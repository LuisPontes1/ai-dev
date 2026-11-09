---
name: ai-dev-video
description: Editar vídeo a partir de gravações longas (cultos, palestras, aulas, lives, podcasts) — escolher cortes e Shorts com gates de coesão e rubrica cega, transcrever e revisar (faster-whisper + revisão com contexto + alinhamento forçado MMS), legendas animadas sincronizadas, enquadramento vertical (recorte parado, deslizada suave com easing), comunicação visual em vídeo longo (painéis, cartões, notas, densidade de tela), CTA, áudio por LUFS, render com ffmpeg (libx264/NVENC/VideoToolbox), execução no Colab/VMs com pasta de fontes, conferência visual antes de mostrar, e publicação no YouTube. Use sempre que o trabalho envolver cortar, legendar, enquadrar, renderizar, revisar ou publicar vídeo.
---

# Edição de vídeo no ai-dev

Conhecimento destilado das sessões de cortes da Igreja Presbiteriana Fonte (07–09/11/2026): um piloto no Colab
e dois dias de iteração com o Luis aprovando ou rejeitando cada versão. As regras abaixo foram **validadas pelo
olho do usuário**; ainda não pelas métricas do YouTube (G6). Trate números de retenção e pesos da rubrica como
ponto de partida a calibrar.

Referências (leia a que o momento pede):
- `references/editorial.md` — que trecho vira corte: produtos, coesão (G3a), rubrica cega (G3b), ganchos, durações, séries, o que deixar de fora
- `references/tela.md` — legendas, capa, marca d'água, painéis e cartões no vídeo longo, densidade, regiões exclusivas, CTA
- `references/enquadramento.md` — recorte vertical, calibração, recorte parado + zoom out, deslizada suave por expressão do ffmpeg
- `references/pipeline-tecnico.md` — transcrição, revisão, alinhamento, render (receitas ffmpeg), áudio, qualidade
- `references/execucao-remota.md` — Colab pela CLI, regras de VM, pasta de fontes, Drive
- `references/qa-e-publicacao.md` — gates G1–G6, folha de contato, prévias, YouTube (títulos, tags, capa, agenda, experimentos)
- `references/caso-igreja-fonte.md` — as escolhas de identidade **deste** canal (cores, fontes, CTA, descrição) — exemplo, não regra geral

## O fluxo — com gates

```
G1 entrada ─▶ transcrever ─▶ G2 transcrição ─▶ sugerir cortes ─▶ G3a coesão ─▶ G3b rubrica ─▶ G3 ✋ usuário aprova a lista
   ─▶ render (VM) ─▶ G4 conferência técnica + visual ─▶ G5 ✋ usuário aprova o vídeo e o pacote ─▶ publicar ─▶ G6 métricas
```

Nenhum gate é opcional. Os dois ✋ são do usuário; os outros são **obrigação do assistente** — o Luis cobrou
explicitamente: "historia fecha? não para no meio? essa revisão é sua atribuição".

## Regras que mais custaram para aprender

1. **Corte não começa nem termina no meio de frase.** Leia a frase antes do início e depois do fim de cada corte. Pergunta sem resposta dentro do corte, não. História longa vira série em partes.
2. **Nota de corte vem de rubrica cega, não de "olho".** Avaliador vê só o texto falado, como quem nunca viu o vídeo; só vai para aprovação o que tirar ≥ 7.
3. **Legenda sincronizada de verdade exige alinhamento forçado** (MMS). Tempo por palavra do Whisper erra até 2 s.
4. **Recorte vertical: parado o short inteiro, onde o assunto passa mais tempo; se ele sai, reduza o zoom** em vez de mover. Quando precisar mover, deslize com easing (cosseno), nunca salto.
5. **Nenhum script usa fonte do sistema.** Fontes vão numa pasta do projeto, junto com o código, para toda VM. Confira com `fc-list` antes de queimar legenda.
6. **Vídeo pesado roda no Colab/VM, não na máquina local** — e não mude essa arquitetura sem avisar.
7. **Nada é mostrado ao usuário sem conferência visual:** checagem automática de colisão entre elementos + folha de contato com um quadro por elemento que entra.
8. **Nada vai ao ar sem o "ok" explícito** no vídeo final e no pacote (título, descrição, tags, links).
9. **Prévia leve (720p) para o celular, e avise que ela não serve para julgar nitidez.** O original fica no Drive.
10. **Foco:** o que não é tarefa do assistente (ex.: thumbnail de série feita por outra pessoa) não come o tempo dos cortes.

## Como trabalhar com o usuário

- Mostre opções lado a lado quando o assunto é visual (layouts A/B/C, variantes de CTA) e deixe ele escolher.
- Cada feedback visual vira regra: registre no projeto (`aidev learn` → `.ai-dev/context.md`) e, se valer para outros
  canais, `aidev learn note --global --applies video`.
- Antes de compactar ou encerrar, o estado do lote (o que foi renderizado, aprovado, publicado) vai para o handoff.
