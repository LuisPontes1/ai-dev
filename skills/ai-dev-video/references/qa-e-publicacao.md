# Conferência e publicação

## Gates

| Gate | O quê | Quem |
|------|-------|------|
| G1 | Entrada: duração, áudio, duplicatas | assistente |
| G2 | Transcrição: ≤ 5% incertos, ≤ 3 segmentos > 30 s | assistente |
| G3a | Coesão das bordas de cada corte | assistente |
| G3b | Rubrica cega ≥ 7 | assistente (subagente) |
| G3 | Lista de cortes | ✋ usuário |
| G4 | Render: técnico (duração, loudness, codec) + visual | assistente |
| G5 | Vídeo final **e** pacote (título, descrição, tags, links, vídeo relacionado) | ✋ usuário |
| G6 | Métricas (retenção, duração média, inscritos) realimentam a rubrica | assistente + usuário |

## G4 — conferência antes de mostrar qualquer coisa (em 100% dos vídeos)

Um script de conferência grava um `.qc.json` + `.qc.png` ao lado de cada vídeo, e **o script de publicação recusa
vídeo sem as duas partes aprovadas**:
1. **Técnica (automática):** formato (1080×1920 / 1440×2560 / 1920×1080), duração (Short ≤ 180 s), volume
   **−17,5 a −12,5 LUFS** (`ebur128=peak=true`), pico, trechos pretos/congelados
   (`blackdetect=d=0.5:pix_th=0.08,freezedetect=n=0.003:d=3`), capa no fim, % do tempo com rosto.
2. **Visual (humana, registrada com uma nota):** folha de 6 quadros (início, 25%, CTA, 75%, fim da fala, capa) **e
   sequências de quadros** nos pontos críticos (deslizadas, bordas, quem cruza a câmera) — a folha sozinha já deixou
   passar problema de movimento.
- Rosto escondido por microfone/óculos dá **falso alarme** no detector: olhe os quadros apontados e libere com nota.
  Detector de "cabeça e ombros" não serve (acha gente em parede vazia).
- Vídeo longo: o render **aborta** se houver colisão de regiões; folha com 1 quadro de **cada evento** (79 num vídeo de ~50 min).
- Sempre: som (LUFS, emendas, silêncio onde deve), duração, nitidez, pessoas indevidas, orador cortado.
5. Prévia de vídeo longo: teste trechos com `--trecho a b` mantendo os horários reais (senão elementos de início aparecem em todo trecho).

## Prévias

720p leve para o celular (1080p de 80 MB estoura o limite de envio); diga que **não serve para julgar nitidez**.
Mande **o link direto do arquivo no Drive** (`https://drive.google.com/file/d/<ID>/view`, ID via `rclone lsjson --files-only`),
nunca só a pasta.

## Publicação (YouTube Data API)

- **Só depois do "ok" explícito** no vídeo e no pacote. O usuário: "Não publica direto hein… tem que passar por aqui…
  o SEO, o título, na descrição o link do insta e do site… importante estar tudo!". Faça disso uma trava no script.
- Sobe **privado com `publishAt`** (agendado) e um rótulo de experimento.
- **Capa:** `thumbnails.set` com o PNG da capa (canal verificado). O app Studio pode mostrar cache antigo.
- **Tags:** o upload já descartou as tags — **confira e regrave**.
- Hashtags: o YouTube mostra só as 3 primeiras acima do título — tema na frente, identidade no fim.
- **Confira pela API depois do upload:** título, nº de tags, `publishAt`, se já está em `hd`.
- Mudar SEO de vídeo já agendado: `videos.update` (snippet) — não precisa reenviar.
- A API **não troca o arquivo** de um vídeo enviado: refazer = apagar e subir de novo (gasta cota: ~1.600 unidades por upload, ~6 uploads/dia).
- Vídeo relacionado e elementos da tela final: **manuais** no Studio.
- Projeto de API não auditado pode prender vídeos em privado (a confirmar).
- Cortes de **orador convidado** precisam de autorização dele.

## Calendário e experimentos

- Nunca dois Shorts do **mesmo evento** em sequência; alterne por origem. Postar tudo de um evento junto é "péssimo pro engajamento".
- Ritmo: **1 Short por dia**, em **07h, 12h ou 18h**, girando os horários (21h foi vetado). Rodízio entre as fontes
  (culto A → B → C…) para nenhum evento aparecer dia sim, dia não. Equilibre a nota média entre os horários.

## Várias sessões no mesmo projeto

Quando sessões diferentes (Shorts, vídeo longo, analytics) mexem no mesmo arquivo de cortes: **leia antes de escrever
e escreva só os campos que são seus.**
- Experimentos registrados (`docs/experimentos.md`): horário (07h, 12h, 18h, 21h; ≥ 5 por variante; medianas em 48 h e 7 d), depois CTA (60%, 30%, sem).
- Leitura das métricas, atraso da API e régua certa por formato: `analytics.md`.
