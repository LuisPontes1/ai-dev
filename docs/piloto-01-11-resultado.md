# Piloto 01/11/2026 — resultado e próximos passos

> Primeiro teste ponta a ponta com um culto real. Serve de ponto de partida para a próxima sessão (no Mac).

## O que rodou

| Etapa | Onde | Resultado |
|---|---|---|
| Vídeo | `Meu Drive/Gravações Igreja Fonte/2026-11-01 10-44-29.mov` | 1,55 GB · 109 min · 1920x1080 |
| Transcrição | Colab T4 (via `google-colab-cli`), faster-whisper large-v3 | 8,6 min · 1.209 segmentos · qualidade boa |
| Revisão | Manual (Claude no chat), sem Haiku | 18 segmentos corrigidos (Habacuque, Francis Schaeffer, presbiteriana…) |
| Escolha dos cortes | Claude no chat | 4 longos + 10 shorts (`analise_cortes.json`) |
| Render | Colab T4, ffmpeg libx264 (CPU) | 10 shorts (~2 min cada) + 2 longos (10–13 min cada) |
| Custo | | ~2 unidades Colab · US$ 0 de API |

Saída: `Meu Drive/cortes-culto/2026-11-01 10-44-29/`

**Contexto da igreja descoberto:** Igreja Fonte (presbiteriana, plantação na Zona Norte de SP). Série em Romanos. Sermão de 01/11: Romanos 12:3-8 (vida em comunidade e dons), 46:21–1:31:22. Esposa do pastor: Hendrika. Logo "fonte" no canto superior direito do vídeo.

## Problemas técnicos encontrados (já resolvidos no notebook)

- Colab agora usa **CUDA 13**; o faster-whisper precisa de libs CUDA 12 → instalar `nvidia-cublas-cu12` + `nvidia-cudnn-cu12==9.*` e pré-carregar.
- Fonte `DejaVu Sans` não existe no Colab → caiu em **"Humor Sans"** (fonte de quadrinhos). Trocado para `Liberation Sans`.
- `drive.mount` pela CLI exige uma aprovação no navegador a cada VM nova.
- Whisper junta louvores longos em um segmento só (ex.: 2+ min) — sem o separador de música, isso polui o mapa.

## Backlog de qualidade (a priorizar com o feedback do Luis)

1. **Limites dos cortes** — hoje começam/terminam em limites de segmento do Whisper, que às vezes são meio de frase. Usar tempo por palavra + pausas para cortar em fim de frase, com respiro de entrada/saída e fade curto.
2. **Legendas** — fonte/estilo, destaque da palavra falada, quebra por sentido (não a cada 3 palavras), posição acima da UI dos Shorts, ortografia revisada antes de queimar.
3. **Enquadramento vertical** — crop fixo (`CROP_X`). Trocar por rastreamento de rosto com suavização; tratar as trocas de câmera (ex.: trecho em câmera vertical com tarjas pretas por volta de 46 min).
4. **Áudio** — loudnorm de 2 passadas, redução de ruído/eco da sala, eventualmente realce de voz.
5. **Abertura dos shorts** — título/gancho na tela nos 2–3 primeiros segundos; eventualmente cortar a primeira frase se ela for "morna".
6. **Seleção dos cortes** — calibrar critérios com o feedback de quem assistiu (quais funcionaram e por quê) e depois com as métricas do YouTube.
7. **Velocidade do render** — usar VideoToolbox no Mac (`h264_videotoolbox`) ou NVENC no Colab.
8. **Cortes longos** — vinheta/abertura, capítulos, miniatura.

## Próximo passo

Continuar **no Mac** (Claude Code local): Drive para desktop + Whisper (MLX) + ffmpeg com VideoToolbox, rodando sobre o mesmo culto de 01/11 para comparar com este piloto.
