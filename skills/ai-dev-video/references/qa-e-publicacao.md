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

## G4 — conferência antes de mostrar qualquer coisa

1. **Checagem automática de colisão**: dois elementos na mesma região ao mesmo tempo = erro de render.
2. **Folha de contato** com 1 quadro por entrada de elemento (79 quadros num vídeo de ~50 min) — olhe todos.
3. Som: volume (LUFS medido), emendas, silêncio onde deve haver.
4. Duração, nitidez, pessoas indevidas no quadro, orador cortado.
5. Prévia de vídeo longo: teste trechos com `--trecho a b` mantendo os horários reais (senão elementos de início aparecem em todo trecho).

## Prévias

720p leve para o celular (1080p de 80 MB estoura o limite de envio); diga que **não serve para julgar nitidez**.

## Publicação (YouTube Data API)

- **Só depois do "ok" explícito** no vídeo e no pacote. O usuário: "Não publica direto hein… tem que passar por aqui…
  o SEO, o título, na descrição o link do insta e do site… importante estar tudo!". Faça disso uma trava no script.
- Sobe **privado com `publishAt`** (agendado) e um rótulo de experimento.
- **Capa:** `thumbnails.set` com o PNG da capa (canal verificado). O app Studio pode mostrar cache antigo.
- **Tags:** o upload já descartou as tags — **confira e regrave**.
- Hashtags: o YouTube mostra só as 3 primeiras acima do título — tema na frente, identidade no fim.
- A API **não troca o arquivo** de um vídeo enviado: refazer = apagar e subir de novo (gasta cota: ~1.600 unidades por upload, ~6 uploads/dia).
- Vídeo relacionado e elementos da tela final: **manuais** no Studio.
- Projeto de API não auditado pode prender vídeos em privado (a confirmar).
- Cortes de **orador convidado** precisam de autorização dele.

## Calendário e experimentos

- Nunca dois Shorts do **mesmo evento** em sequência; alterne por origem. Postar tudo de um evento junto é "péssimo pro engajamento".
- Ritmo que ficou: 1 Short por dia.
- Experimentos registrados (`docs/experimentos.md`): horário (07h, 12h, 18h, 21h; ≥ 5 por variante; medianas em 48 h e 7 d), depois CTA (60%, 30%, sem).
