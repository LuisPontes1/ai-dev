# Pipeline técnico — receitas que funcionaram

## 1. Entrada (G1)

`ffprobe`: duração dentro do esperado (ex.: 60–200 min) e trilha de áudio presente. Deduplique gravações por nome + tamanho.
Ideal para o futuro: gravar em HEVC ~20 Mbps (dá zoom sem perder tanto) e áudio da mesa em multipista.

## 2. Transcrição (GPU no Colab, T4 basta)

```bash
ffmpeg -i culto.mov -vn -ac 1 -ar 16000 audio.wav
pip install faster-whisper nvidia-cublas-cu12 'nvidia-cudnn-cu12==9.*'
```
**Colab com CUDA 13:** o ctranslate2 precisa das libs do CUDA 12 — pré-carregue antes de importar:
```python
import ctypes, glob, site
for pat in ("nvidia/cublas/lib/libcublas*.so.12", "nvidia/cudnn/lib/libcudnn*.so.9"):
    for lib in glob.glob(f"{site.getsitepackages()[0]}/{pat}"):
        ctypes.CDLL(lib, mode=ctypes.RTLD_GLOBAL)
```
**PyAV do Colab quebra o `decode_audio`** (TypeError `metadata_errors`): passe numpy.
```python
import wave, numpy as np
with wave.open("audio.wav") as w: audio = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
model = WhisperModel("large-v3", device="cuda", compute_type="float16")
segs, _ = model.transcribe(audio, language="pt", word_timestamps=True, beam_size=5,
    vad_filter=True, vad_parameters={"min_silence_duration_ms": 500},
    condition_on_previous_text=False,            # evita loops ("perdi a vida e perdi a vida…")
    initial_prompt=glossario)                    # nomes, lugares, termos — por culto/série, não fixo
```
~9 min para 1h49 na T4. Em kernel persistente, tire os módulos de `sys.modules` antes de rodar de novo.

**Música × fala:** inaSpeechSegmenter (`Segmenter(detect_gender=False)`); segmento >50% sobreposto a música → `musica=True`.
Cuidado: fala com piano de fundo é marcada como música — **não pule esses trechos na revisão**.

**Limpeza:** regex de loop `(\b.{8,80}?)(?:[\s,.]+\1\b){2,}` e remoção de caracteres fora do alfabeto.

## 3. Revisão do texto (sem quebrar tempos)

- Segmentos numerados entram e saem com **o mesmo id** (structured output / Pydantic); não juntar nem dividir.
- Corrige nomes, referências, termos do glossário, pontuação. **Não** reescreve a fala. Marca `incerto` em vez de inventar.
- O que funcionou melhor: **modelo forte revisando a transcrição inteira com o contexto do evento** (orador, título,
  textos lidos, pessoas citadas, esboço) — pedido do usuário: "melhor ele revisar tudo mesmo… tendo o contexto do culto".
  ~US$ 1,2–1,5 por culto. Versões baratas (modelo pequeno + forte só nos incertos) deixaram passar erros que importam
  em legenda ("treina/treme", "rabo/Raabe", "fé/boca").
- Guarde a versão anterior (`transcricao.v1-*.json`).

**G2:** ≤ 5% de segmentos incertos e ≤ 3 segmentos com mais de 30 s.

## 4. Alinhamento forçado (sincronia da legenda)

Tempos por palavra do Whisper vieram ~0,28 s adiantados, com até 2,25 s de erro. Alinhe **o texto revisado** ao
áudio com **MMS** (torchaudio `MMS_FA`), por segmento, com folga de ~0,4 s e fallback para os tempos originais.

## 5. Render

**Short** (1440×2560 — upload em 1440p ganha VP9/AV1 no YouTube; 4K não ajuda se a fonte é 1080p):
crop 9:16 → véu + capa no último segundo → marca d'água → legenda ASS → CTA (PNG RGBA) ; áudio loudnorm −14, silêncio na capa.

**Corte médio 16:9:**
```bash
ffmpeg -ss T0 -t DUR -i VIDEO \
 -vf "scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,fade=in:st=0:d=0.4,fade=out:st=DUR-0.6:d=0.6,format=yuv420p" \
 -af "loudnorm=I=-14:TP=-1.5:LRA=11,afade=in:st=0:d=0.3,afade=out:st=DUR-0.6:d=0.6" \
 -c:v libx264 -preset veryfast -crf 19 -c:a aac -b:a 192k -movflags +faststart saida.mp4
```
Margens do recorte: `t0 = início − 0,4 s`, `t1 = fim + 0,8 s` (vídeo longo: +1,5 s no fim).

**Overlays de vídeo longo:** PNGs + concat demuxer (`file`/`duration`), cada imagem vale até o próximo evento;
entrada/saída de painel 0,35 s com alpha e deslocamento de 60 px (ease cúbico); troca de conteúdo 0,22 s.
```
[1:v]fps=30,format=rgba[ov];[cam][ov]overlay=eof_action=pass:shortest=0,format=yuv420p
```
Emendas: abertura com `xfade=transition=fade:duration=0.8` + `acrossfade=d=0.8`; encerramento com `concat`.

**Encoders:**

| Onde | Comando | Observação |
|------|---------|------------|
| CPU | `libx264 -preset veryfast -crf 19` | ~2 min por Short numa VM sem GPU |
| GPU NVIDIA (Colab T4/L4) | `h264_nvenc -preset p5 -cq 20` | 13 vídeos em ~20 min na T4 |
| Mac | `h264_videotoolbox -b:v <taxa> -profile:v high` | ~8× tempo real |

**Qualidade e saída** ("Mas a qualidade tá top?"): zoom come resolução (1,35× ≈ 800p, ~68% do detalhe; 1,2× ≈ 900p,
~78%) — e o zoom certo é decidido pelo enquadramento (`enquadramento.md`), não pela resolução. O que compensa é a
**saída**: o YouTube codifica uploads maiores em VP9/AV1 com mais bitrate.
- Short: composição em 1080×1920, saída **1440×2560**.
- Vídeo longo: gráficos desenhados em 1080p e ampliados; saída **4K (2160p), ~45 Mbps, H.264 NVENC**. O arquivo
  (11–17 GB) não abre na prévia do Drive → o mesmo job gera uma **versão leve 720p (~2,5 Mbps)** para o usuário assistir.
- Render do vídeo longo leva ~45–60 min: teste enquadramento e telas em trechos de ~1 min antes.

**ffmpeg do Homebrew vem sem libass/drawtext**: legenda queimada e texto renderizam na VM (ou instale um build completo).

## 6. Áudio

| Peça | Alvo |
|------|------|
| Shorts e cortes | `loudnorm=I=-14:TP=-1.5:LRA=11` (−14 ±1 LUFS) |
| Vídeo longo | `loudnorm=I=-16:TP=-1.5:LRA=11` (conferir: ~−16 LUFS integrado, pico ≤ −1 dBTP) |
| Trilha da abertura | −24/−25 LUFS (~9 dB abaixo da fala) — "ficou um pouco alto" em −16 |
| Trilha do encerramento | −22 LUFS, fade in 1 s / out 3 s |

- Pendente: loudnorm em **duas passadas**.
- Trilha a partir do próprio louvor: tire as vozes com **Demucs** (`htdemucs --two-stems=vocals`, roda em segundos localmente). Nunca use gravação
  "da internet" (claim de direitos); plano B: Biblioteca de Áudio do YouTube.
- AAC 192k nos arquivos; transmissão ao vivo limitada a 160 kbps pelo YouTube.
