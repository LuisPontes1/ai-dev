"""Gera piloto/piloto_cortes_colab.ipynb. Uso: python piloto/gerar_notebook.py piloto/piloto_cortes_colab.ipynb"""
import json, sys

cells = []

def md(s):
    cells.append({"cell_type": "markdown", "metadata": {}, "source": s.strip("\n")})

def code(s):
    cells.append({"cell_type": "code", "metadata": {}, "execution_count": None,
                  "outputs": [], "source": s.strip("\n")})

md(r"""
# Piloto — cortes de culto com IA (Google Colab)

Pega **um culto gravado no seu Google Drive** e gera:

1. Transcrição com tempo por palavra (Whisper large-v3 na GPU do Colab)
2. Transcrição **revisada** pelo Claude Haiku (nomes bíblicos, pontuação) sem mexer nos tempos
3. **Mapa do culto + sugestões de cortes** (longos de 6–14 min e shorts de ~59s) pelo Claude Opus
4. Prévias renderizadas dos melhores cortes (short vertical com legenda + corte longo)

Tudo é salvo em `Meu Drive/cortes-culto/<nome-do-culto>/`.

### Antes de rodar
- **GPU:** menu *Ambiente de execução → Alterar tipo → GPU T4*.
- Ajuste a célula **Configuração** e rode tudo (*Ambiente de execução → Executar tudo*).

**Dois modos:**
- `MODO = "chat"` (padrão, sem custo de API): o notebook transcreve e para. Você pede ao Claude no chat para ler a transcrição no Drive e gravar `analise_cortes.json`; depois roda de novo e ele renderiza.
- `MODO = "api"`: tudo automático. Precisa da chave em 🔑 *Secrets* → `ANTHROPIC_API_KEY`. Custo estimado: **< US$ 0,50** por culto de ~2h.
""")

md("## 1. Configuração")
code(r'''
# ==== EDITE AQUI ====
VIDEO_NOME = "2026-11-01 10-44-29.mov"   # nome do arquivo no Drive (busca em todo o Meu Drive)

# Glossário: ajuda o Whisper e o Haiku a acertar nomes. Quanto mais completo, melhor.
GLOSSARIO = {
    "igreja": "",                         # nome da igreja
    "pregadores": [],                     # ex.: ["Pr. Fulano", "Pra. Beltrana"]
    "pessoas_citadas": ["João Lucas", "Lourenço", "Ricardo", "Wagner"],
    "serie_atual": "",                    # ex.: "Série em Rute"
    "termos": ["Noemi", "Rute", "Orfa", "Boaz", "Elimeleque", "Malom", "Quiliom",
               "Moabe", "moabitas", "Quemós", "Belém de Judá", "Deuteronômio"],
}

MODELO_WHISPER = "large-v3"

# Modo do piloto:
#   "chat" → sem API: o notebook para depois da transcrição; você pede ao Claude (no chat) para ler
#            a transcrição no Drive e gravar `analise_cortes.json` na pasta do culto; aí roda de novo para renderizar.
#   "api"  → tudo automático pela Claude API (precisa da ANTHROPIC_API_KEY nos Secrets).
MODO = "chat"
REVISAR_COM_HAIKU = False      # só no modo "api"
MODELO_REVISAO = "claude-haiku-5-5"
MODELO_CORTES  = "claude-opus-5-5"

USAR_SEPARACAO_MUSICA = True   # inaSpeechSegmenter: marca louvor/música para o Claude ignorar
RENDERIZAR_SHORTS = 3          # quantos shorts renderizar (os de maior nota)
RENDERIZAR_LONGOS = 1          # quantos cortes longos renderizar
CROP_X = 0.5                   # posição horizontal do recorte vertical (0=esquerda, 0.5=centro, 1=direita)
''')

md("## 2. Preparar ambiente (Drive, GPU, bibliotecas)")
code(r'''
import os, sys, subprocess, glob, json, re, time, shutil, unicodedata
from pathlib import Path

EM_COLAB = "google.colab" in sys.modules
if EM_COLAB:
    from google.colab import drive, userdata
    drive.mount("/content/drive")
    if MODO == "api":
        os.environ["ANTHROPIC_API_KEY"] = userdata.get("ANTHROPIC_API_KEY")
    RAIZ_DRIVE = Path("/content/drive/MyDrive")
    TRABALHO = Path("/content/trabalho")
else:  # execução local (testes)
    RAIZ_DRIVE = Path(os.environ.get("RAIZ_DRIVE", "."))
    TRABALHO = Path(os.environ.get("TRABALHO", "./trabalho"))

pkgs = ["faster-whisper", "pydantic"] + (["anthropic>=0.70"] if MODO == "api" else [])
if USAR_SEPARACAO_MUSICA:
    pkgs.append("inaSpeechSegmenter")
subprocess.run([sys.executable, "-m", "pip", "install", "-q", *pkgs], check=False)

gpu = subprocess.run(["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
                     capture_output=True, text=True).stdout.strip() if shutil.which("nvidia-smi") else ""
print("GPU:", gpu or "nenhuma (vai ser BEM mais lento — troque para T4)")
DEVICE = "cuda" if gpu else "cpu"
''')

md("## 3. Localizar o vídeo e extrair o áudio")
code(r'''
if Path(VIDEO_NOME).is_file():
    candidatos = [Path(VIDEO_NOME)]
else:
    print("Procurando no Drive...")
    candidatos = [Path(p) for p in glob.glob(str(RAIZ_DRIVE / "**" / VIDEO_NOME), recursive=True)]
if not candidatos:
    raise FileNotFoundError(f"Não achei '{VIDEO_NOME}' em {RAIZ_DRIVE}")
VIDEO_DRIVE = candidatos[0]
print("Vídeo:", VIDEO_DRIVE, f"({VIDEO_DRIVE.stat().st_size/1e9:.2f} GB)",
      f"— {len(candidatos)} cópia(s) encontrada(s)" if len(candidatos) > 1 else "")

STEM = VIDEO_DRIVE.stem
SAIDA = RAIZ_DRIVE / "cortes-culto" / STEM          # resultados (no Drive)
TRABALHO.mkdir(parents=True, exist_ok=True)
SAIDA.mkdir(parents=True, exist_ok=True)

# cópia local: leitura do Drive montado é lenta para o render
VIDEO = TRABALHO / VIDEO_DRIVE.name
if not VIDEO.exists() or VIDEO.stat().st_size != VIDEO_DRIVE.stat().st_size:
    print("Copiando vídeo para o disco local do Colab...")
    shutil.copy(VIDEO_DRIVE, VIDEO)

AUDIO = TRABALHO / "audio.wav"
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(VIDEO), "-vn", "-ac", "1", "-ar", "16000", str(AUDIO)], check=True)

def ffprobe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return json.loads(out)

info = ffprobe(VIDEO)
v = next(s for s in info["streams"] if s["codec_type"] == "video")
DURACAO = float(info["format"]["duration"])
LARGURA, ALTURA = int(v["width"]), int(v["height"])
print(f"Duração: {DURACAO/60:.1f} min · {LARGURA}x{ALTURA}")
''')

md("## 4. Separar música × fala (opcional)\nMarca os trechos de louvor para o Claude não perder tempo com eles e para evitar as alucinações do Whisper em música.")
code(r'''
MUSICA = []   # lista de (inicio, fim) em segundos
if USAR_SEPARACAO_MUSICA:
    try:
        from inaSpeechSegmenter import Segmenter
        seg = Segmenter(vad_engine="smn", detect_gender=False)
        MUSICA = [(float(a), float(b)) for (rotulo, a, b) in seg(str(AUDIO)) if rotulo == "music"]
        total = sum(b - a for a, b in MUSICA)
        print(f"Música detectada: {total/60:.1f} min em {len(MUSICA)} trechos")
    except Exception as e:
        print("inaSpeechSegmenter falhou, seguindo sem separação:", repr(e)[:300])
''')

md("## 5. Transcrever (Whisper large-v3)\nCom tempo por palavra, filtro de silêncio (VAD) e glossário. Leva ~10–20 min numa T4 para 2h de culto.")
code(r'''
from faster_whisper import WhisperModel

def prompt_glossario(g):
    nomes = [g.get("igreja", "")] + g.get("pregadores", []) + g.get("pessoas_citadas", []) + g.get("termos", [])
    nomes = [n for n in nomes if n]
    return ("Pregação em português do Brasil. Nomes e termos: " + ", ".join(nomes) + ".") if nomes else None

TRANSCRICAO_BRUTA = SAIDA / "transcricao_bruta.json"
if TRANSCRICAO_BRUTA.exists():
    segmentos = json.loads(TRANSCRICAO_BRUTA.read_text())
    print("Usando transcrição já salva:", len(segmentos), "segmentos")
else:
    modelo = WhisperModel(MODELO_WHISPER, device=DEVICE, compute_type="float16" if DEVICE == "cuda" else "int8")
    t0 = time.time()
    import wave, numpy as np
    with wave.open(str(AUDIO)) as wf:   # WAV 16 kHz mono gerado pelo ffmpeg na etapa 3
        amostras = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768.0
    iterador, _ = modelo.transcribe(
        amostras, language="pt", word_timestamps=True,
        vad_filter=True, vad_parameters={"min_silence_duration_ms": 500},
        condition_on_previous_text=False,       # evita os loops de repetição
        initial_prompt=prompt_glossario(GLOSSARIO),
        beam_size=5,
    )
    segmentos = []
    for s in iterador:
        segmentos.append({
            "id": len(segmentos), "inicio": round(float(s.start), 2), "fim": round(float(s.end), 2), "texto": s.text.strip(),
            "palavras": [{"p": w.word.strip(), "i": round(float(w.start), 2), "f": round(float(w.end), 2)} for w in (s.words or [])],
        })
        if len(segmentos) % 100 == 0:
            print(f"  {s.end/60:.1f} min transcritos...")
    print(f"Transcrição: {len(segmentos)} segmentos em {(time.time()-t0)/60:.1f} min")
    TRANSCRICAO_BRUTA.write_text(json.dumps(segmentos, ensure_ascii=False))
''')

md("## 6. Limpeza automática\nRemove repetições em loop, caracteres de outros alfabetos e marca os segmentos que caem em música.")
code(r'''
LATINO = re.compile(r"[^\x00-\x7FÀ-ÿ–—…“”‘’ºª°]")   # letras de outros alfabetos = alucinação
LOOP = re.compile(r"(\b.{8,80}?)(?:[\s,.]+\1\b){2,}", re.IGNORECASE)

def normaliza(t):
    t = unicodedata.normalize("NFKD", t.lower())
    return re.sub(r"[^a-z0-9 ]", "", t).strip()

def sobreposicao_musica(a, b):
    total = sum(max(0, min(b, mb) - max(a, ma)) for ma, mb in MUSICA)
    return total / max(b - a, 0.01)

def limpar(segs):
    limpos, removidos = [], 0
    for s in segs:
        original = s["texto"]
        texto = LOOP.sub(r"\1", original)
        lixo = LATINO.findall(texto)
        texto = LATINO.sub("", texto).strip()
        if not texto or (limpos and normaliza(texto) == normaliza(limpos[-1]["texto"])):
            removidos += 1
            continue
        s = dict(s, texto=texto)
        s["musica"] = bool(sobreposicao_musica(s["inicio"], s["fim"]) > 0.5)
        s["suspeito"] = bool(lixo) or texto != original.strip()
        limpos.append(s)
    for i, s in enumerate(limpos):
        s["id"] = i
    print(f"{len(limpos)} segmentos ({removidos} removidos, "
          f"{sum(s['musica'] for s in limpos)} em música, {sum(s['suspeito'] for s in limpos)} suspeitos)")
    return limpos

segmentos = limpar(segmentos)
''')

md("## 7. Revisão da transcrição (Claude Haiku — opcional)\nSó roda com `MODO = \"api\"` e `REVISAR_COM_HAIKU = True`. Corrige nomes, referências bíblicas e pontuação **segmento a segmento**, mantendo os mesmos IDs — os tempos continuam valendo.")
code(r'''
from pydantic import BaseModel
from concurrent.futures import ThreadPoolExecutor

cliente = None
if MODO == "api":
    import anthropic
    cliente = anthropic.Anthropic()
USO = {}   # modelo -> [tokens_entrada, tokens_saida]
PRECO = {"claude-haiku-5-5": (0.10, 0.50), "claude-opus-5-5": (4.00, 20.00), "claude-sonnet-5-5": (2.00, 10.00)}

def registra_uso(modelo, resp):
    u = USO.setdefault(modelo, [0, 0])
    u[0] += resp.usage.input_tokens + (resp.usage.cache_read_input_tokens or 0) + (resp.usage.cache_creation_input_tokens or 0)
    u[1] += resp.usage.output_tokens

class SegRevisado(BaseModel):
    id: int
    texto: str
    incerto: bool

class Revisao(BaseModel):
    segmentos: list[SegRevisado]

SISTEMA_REVISAO = f"""Você revisa transcrições automáticas (Whisper) de cultos evangélicos em português do Brasil.

Regras:
- Devolva EXATAMENTE os mesmos IDs recebidos, um item por ID, na mesma ordem. Nunca junte, divida, omita ou crie segmentos.
- Corrija: nomes próprios, nomes e livros bíblicos, referências (ex.: "João 3:16"), palavras claramente mal reconhecidas, pontuação e maiúsculas.
- NÃO reescreva o estilo, NÃO resuma, NÃO "melhore" a fala. Gírias, repetições naturais e frases incompletas ficam como estão — o texto precisa bater com o áudio.
- Se não tiver certeza da correção, mantenha o texto original e marque incerto=true.
- Trechos marcados [MÚSICA] são letras de louvor: apenas corrija o óbvio.

Glossário desta igreja (grafias corretas):
{json.dumps(GLOSSARIO, ensure_ascii=False, indent=1)}"""

def revisar_bloco(bloco):
    linhas = "\n".join(f"[{s['id']}]{' [MÚSICA]' if s['musica'] else ''} {s['texto']}" for s in bloco)
    resp = cliente.messages.parse(
        model=MODELO_REVISAO, max_tokens=16000,
        system=[{"type": "text", "text": SISTEMA_REVISAO, "cache_control": {"type": "ephemeral"}}],
        output_config={"effort": "low"},
        messages=[{"role": "user", "content": f"Revise estes segmentos:\n\n{linhas}"}],
        output_format=Revisao,
    )
    registra_uso(MODELO_REVISAO, resp)
    if resp.stop_reason != "end_turn" or resp.parsed_output is None:
        print(f"  ⚠ bloco {bloco[0]['id']}–{bloco[-1]['id']}: stop_reason={resp.stop_reason}; mantendo original")
        return {}
    return {r.id: r for r in resp.parsed_output.segmentos}

def alinhar_palavras(seg, texto_novo):
    """Mantém os tempos por palavra: se o nº de palavras bate, troca 1:1; senão distribui no tempo das palavras originais."""
    novas, antigas = texto_novo.split(), seg["palavras"]
    if not antigas:
        return []
    if len(novas) == len(antigas):
        return [dict(a, p=n) for a, n in zip(antigas, novas)]
    ini, fim = antigas[0]["i"], antigas[-1]["f"]
    passo = (fim - ini) / max(len(novas), 1)
    return [{"p": n, "i": round(ini + k * passo, 2), "f": round(ini + (k + 1) * passo, 2)} for k, n in enumerate(novas)]

TRANSCRICAO_REVISADA = SAIDA / "transcricao_revisada.json"
if TRANSCRICAO_REVISADA.exists():
    segmentos = json.loads(TRANSCRICAO_REVISADA.read_text())
    print("Usando revisão já salva")
elif not (MODO == "api" and REVISAR_COM_HAIKU):
    for s in segmentos:
        s.setdefault("texto_original", s["texto"]); s.setdefault("incerto", False)
    print("Revisão com Haiku desligada — seguindo com a transcrição limpa")
    TRANSCRICAO_REVISADA.write_text(json.dumps(segmentos, ensure_ascii=False))
else:
    TAM = 120
    blocos = [segmentos[i:i + TAM] for i in range(0, len(segmentos), TAM)]
    print(f"Revisando {len(segmentos)} segmentos em {len(blocos)} blocos...")
    with ThreadPoolExecutor(max_workers=4) as ex:
        resultados = list(ex.map(revisar_bloco, blocos))
    revisados = {k: v for r in resultados for k, v in r.items()}
    alterados = 0
    for s in segmentos:
        r = revisados.get(s["id"])
        s["texto_original"] = s["texto"]
        s["incerto"] = bool(r and r.incerto)
        if r and r.texto.strip() and r.texto.strip() != s["texto"]:
            s["texto"] = r.texto.strip()
            s["palavras"] = alinhar_palavras(s, s["texto"])
            alterados += 1
    faltando = len(segmentos) - len(revisados)
    print(f"Revisão: {alterados} segmentos alterados, {sum(s['incerto'] for s in segmentos)} incertos, {faltando} sem retorno")
    TRANSCRICAO_REVISADA.write_text(json.dumps(segmentos, ensure_ascii=False))

# exportações legíveis
def hms(t, ms=False):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{s:06.3f}".replace(".", ",") if ms else f"{int(h):02d}:{int(m):02d}:{int(s):02d}"

def escreve_srt(segs, caminho, deslocamento=0.0):
    with open(caminho, "w") as f:
        for n, s in enumerate(segs, 1):
            f.write(f"{n}\n{hms(max(s['inicio']-deslocamento,0), True)} --> {hms(max(s['fim']-deslocamento,0), True)}\n{s['texto']}\n\n")

escreve_srt(segmentos, SAIDA / "transcricao_revisada.srt")
(SAIDA / "transcricao_revisada.txt").write_text(
    "\n".join(f"[{s['id']}|{hms(s['inicio'])}]{' ♪' if s['musica'] else ''} {s['texto']}" for s in segmentos))
# partes de ~60 KB (o conector do Drive pode truncar arquivos de texto grandes)
linhas, parte, tam, n = [], [], 0, 0
for s in segmentos:
    l = f"[{s['id']}|{hms(s['inicio'])}]{' ♪' if s['musica'] else ''} {s['texto']}\n"
    parte.append(l); tam += len(l.encode())
    if tam > 60_000:
        n += 1; (SAIDA / f"transcricao_parte_{n}.txt").write_text("".join(parte)); parte, tam = [], 0
if parte:
    n += 1; (SAIDA / f"transcricao_parte_{n}.txt").write_text("".join(parte))
print("Salvo em", SAIDA, f"({n} parte(s) para o chat)")
''')

md("## 8. Mapa do culto e sugestões de cortes (Claude Opus)")
code(r'''
from typing import Literal

class Bloco(BaseModel):
    tipo: Literal["louvor", "avisos", "oferta", "oracao", "leitura", "pregacao", "ceia", "outro"]
    inicio_id: int
    fim_id: int
    resumo: str

class Corte(BaseModel):
    tipo: Literal["longo", "short"]
    inicio_id: int
    fim_id: int
    titulo: str
    gancho: str            # a primeira frase que aparece no corte
    tema: str
    versiculos: list[str]
    justificativa: str
    nota: int              # 0-10

class Analise(BaseModel):
    tema_central: str
    texto_base: str
    resumo_pregacao: str
    blocos: list[Bloco]
    cortes: list[Corte]

SISTEMA_CORTES = """Você é editor de vídeo de um canal de YouTube de igreja evangélica. Sua tarefa: ler a transcrição de um culto inteiro e sugerir cortes que façam pessoas assistirem até o fim e voltarem.

Cada linha da transcrição tem o formato: [ID|hh:mm:ss] texto   (linhas com ♪ são música/louvor).
Use SEMPRE os IDs para marcar início e fim.

1) MAPA: divida o culto em blocos (louvor, avisos, oferta, oração, leitura, pregação, ceia, outro).

2) CORTES LONGOS (2 a 4), duração entre 6 e 14 minutos:
- Uma unidade de ensino COMPLETA (ideia → texto bíblico → aplicação), que faça sentido para quem não viu o culto.
- Começa numa frase que abre tensão, pergunta ou história. Nunca começar com "bom", "continuando", "como eu disse".
- Termina numa conclusão ou aplicação, nunca no meio de um raciocínio.

3) SHORTS (5 a 10), duração entre 30 e 60 segundos (ideal ~55s):
- UMA ideia só. Gancho forte nos primeiros 3 segundos (o segmento inicial precisa prender sozinho).
- Prefira: frase citável, ilustração forte, momento emocional, afirmação contraintuitiva.
- Termina em frase completa. Evite piadas internas e referências a pessoas da plateia que quem está de fora não entende.

Para cada corte: título para YouTube (curto, sem clickbait enganoso, fiel à mensagem), o gancho (primeira frase do corte), tema, versículos citados, justificativa curta e nota 0–10 (potencial de retenção).
Seja fiel à teologia e ao tom da pregação; não tire frases do contexto de forma que mude o sentido."""

def linhas_para_claude(segs):
    return "\n".join(f"[{s['id']}|{hms(s['inicio'])}]{' ♪' if s['musica'] else ''} {s['texto']}" for s in segs)

ANALISE = SAIDA / "analise_cortes.json"
if ANALISE.exists():
    analise = Analise.model_validate_json(ANALISE.read_text())
    print("Usando análise salva em", ANALISE.name)
elif MODO == "chat":
    raise SystemExit(
        f"✅ Transcrição pronta em {SAIDA / 'transcricao_revisada.txt'}\n\n"
        f"Agora peça ao Claude no chat: “lê a transcrição de '{STEM}' no Drive e grava o analise_cortes.json”.\n"
        "Quando ele terminar, rode o notebook de novo (Executar tudo) — ele pula o que já foi feito e renderiza os cortes.")
else:
    contexto = f"Contexto da igreja: {json.dumps(GLOSSARIO, ensure_ascii=False)}\n\n" if any(GLOSSARIO.values()) else ""
    resp = cliente.messages.parse(
        model=MODELO_CORTES, max_tokens=32000,
        system=SISTEMA_CORTES,
        output_config={"effort": "high"},
        messages=[{"role": "user", "content": f"{contexto}Transcrição do culto ({DURACAO/60:.0f} min):\n\n{linhas_para_claude(segmentos)}"}],
        output_format=Analise,
        timeout=900,
    )
    registra_uso(MODELO_CORTES, resp)
    if resp.stop_reason == "refusal":
        raise RuntimeError(f"O modelo recusou: {resp.stop_details}")
    if resp.parsed_output is None:
        raise RuntimeError(f"Resposta incompleta (stop_reason={resp.stop_reason}). Tente novamente ou aumente max_tokens.")
    analise = resp.parsed_output
    ANALISE.write_text(analise.model_dump_json(indent=2))

def tempo(c):
    ini, fim = segmentos[c.inicio_id]["inicio"], segmentos[c.fim_id]["fim"]
    return ini, fim, fim - ini

print(f"Tema: {analise.tema_central}  ·  Texto base: {analise.texto_base}\n")
print("MAPA DO CULTO")
for b in analise.blocos:
    print(f"  {hms(segmentos[b.inicio_id]['inicio'])}–{hms(segmentos[b.fim_id]['fim'])}  {b.tipo:9s} {b.resumo}")

relatorio = [f"# {STEM}\n", f"**Tema:** {analise.tema_central}  \n**Texto base:** {analise.texto_base}\n",
             f"{analise.resumo_pregacao}\n", "## Mapa do culto\n"]
relatorio += [f"- `{hms(segmentos[b.inicio_id]['inicio'])}–{hms(segmentos[b.fim_id]['fim'])}` **{b.tipo}** — {b.resumo}" for b in analise.blocos]
for tipo in ("longo", "short"):
    lista = sorted([c for c in analise.cortes if c.tipo == tipo], key=lambda c: -c.nota)
    print(f"\n{'CORTES LONGOS' if tipo == 'longo' else 'SHORTS'}")
    relatorio.append(f"\n## {'Cortes longos' if tipo == 'longo' else 'Shorts'}\n")
    for c in lista:
        ini, fim, dur = tempo(c)
        alvo = (360, 840) if tipo == "longo" else (30, 62)
        aviso = "" if alvo[0] <= dur <= alvo[1] else f"  ⚠ duração fora do alvo"
        print(f"  [{c.nota}/10] {hms(ini)}–{hms(fim)} ({dur/60:.1f} min) {c.titulo}{aviso}\n         gancho: “{c.gancho}”")
        relatorio.append(f"### [{c.nota}/10] {c.titulo}\n- `{hms(ini)} → {hms(fim)}` ({dur/60:.1f} min){aviso}\n"
                         f"- **Gancho:** “{c.gancho}”\n- **Tema:** {c.tema} · **Versículos:** {', '.join(c.versiculos) or '—'}\n"
                         f"- {c.justificativa}\n")
(SAIDA / "cortes_sugeridos.md").write_text("\n".join(relatorio))
''')

md("## 9. Renderizar prévias\nShort: vertical 9:16 com legenda grande (2–4 palavras por vez). Longo: horizontal + arquivo `.srt` para subir no YouTube.\n\n> O recorte vertical é fixo (`CROP_X`). Acompanhamento automático do rosto fica para a próxima fase.")
code(r'''
def legendas_curtas(ini, fim, caminho, max_palavras=3):
    palavras = [w for s in segmentos if s["fim"] > ini and s["inicio"] < fim for w in s["palavras"] if ini <= w["i"] < fim]
    with open(caminho, "w") as f:
        n = 0
        for k in range(0, len(palavras), max_palavras):
            g = palavras[k:k + max_palavras]
            n += 1
            f.write(f"{n}\n{hms(g[0]['i']-ini, True)} --> {hms(min(g[-1]['f'], fim)-ini, True)}\n{' '.join(w['p'] for w in g).upper()}\n\n")

def esc(p):  # escapa caminho para o filtro subtitles do ffmpeg
    return str(p).replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")

def nome_arquivo(t):
    return re.sub(r"[^\w\- ]", "", unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode())[:60].strip()

def render_short(c, idx):
    ini, fim, dur = tempo(c)
    ini, fim = max(ini - 0.15, 0), fim + 0.3
    srt = TRABALHO / f"short_{idx}.srt"
    legendas_curtas(ini, fim, srt)
    w = int(ALTURA * 9 / 16) // 2 * 2
    x = int((LARGURA - w) * CROP_X)
    estilo = "FontName=DejaVu Sans,FontSize=13,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=70"
    destino = SAIDA / f"short_{idx:02d}_{nome_arquivo(c.titulo)}.mp4"
    vf = f"crop={w}:{ALTURA}:{x}:0,scale=1080:1920,subtitles='{esc(srt)}':force_style='{estilo}'"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{ini:.2f}", "-i", str(VIDEO), "-t", f"{fim-ini:.2f}",
                    "-vf", vf, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-c:a", "aac", "-b:a", "160k",
                    "-movflags", "+faststart", str(destino)], check=True)
    return destino

def render_longo(c, idx):
    ini, fim, dur = tempo(c)
    ini, fim = max(ini - 0.3, 0), fim + 0.5
    destino = SAIDA / f"longo_{idx:02d}_{nome_arquivo(c.titulo)}.mp4"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{ini:.2f}", "-i", str(VIDEO), "-t", f"{fim-ini:.2f}",
                    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "aac", "-b:a", "192k",
                    "-movflags", "+faststart", str(destino)], check=True)
    trecho = [s for s in segmentos if s["fim"] > ini and s["inicio"] < fim and not s["musica"]]
    escreve_srt(trecho, destino.with_suffix(".srt"), deslocamento=ini)
    return destino

shorts = sorted([c for c in analise.cortes if c.tipo == "short"], key=lambda c: -c.nota)[:RENDERIZAR_SHORTS]
longos = sorted([c for c in analise.cortes if c.tipo == "longo"], key=lambda c: -c.nota)[:RENDERIZAR_LONGOS]
for i, c in enumerate(shorts, 1):
    t0 = time.time(); print("Short:", c.titulo, end=" … ")
    print(render_short(c, i).name, f"({time.time()-t0:.0f}s)")
for i, c in enumerate(longos, 1):
    t0 = time.time(); print("Longo:", c.titulo, end=" … ")
    print(render_longo(c, i).name, f"({time.time()-t0:.0f}s)")
''')

md("## 10. Resumo e custo")
code(r'''
total = 0.0
for modelo, (ent, sai) in USO.items():
    pe, ps = PRECO.get(modelo, (0, 0))
    custo = ent / 1e6 * pe + sai / 1e6 * ps
    total += custo
    print(f"{modelo:20s} entrada {ent:>8,} · saída {sai:>7,} tokens · US$ {custo:.3f}")
print(f"{'TOTAL':20s} US$ {total:.3f}  (estimativa; confira no console da Anthropic)")
print("\nArquivos em:", SAIDA)
for p in sorted(SAIDA.iterdir()):
    print("  ", p.name)
''')

nb = {"cells": cells, "metadata": {
        "accelerator": "GPU", "colab": {"provenance": [], "gpuType": "T4"},
        "kernelspec": {"display_name": "Python 3", "name": "python3"},
        "language_info": {"name": "python"}},
      "nbformat": 4, "nbformat_minor": 0}
for c in nb["cells"]:
    c["source"] = c["source"].splitlines(keepends=True)
Path = __import__("pathlib").Path
out = Path(sys.argv[1]); out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(nb, ensure_ascii=False, indent=1))
print("ok", out, len(cells), "cells")
