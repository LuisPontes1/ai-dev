# Analytics — fechar o ciclo (G6)

> Destilado das lições que a sessão de analytics do `cortes-culto` registrou no conhecimento geral (09/11/2026).
> É o G6 do fluxo: as métricas recalibram a rubrica de cortes, o título e o gancho.

## Qual métrica decide

**Shorts:** a métrica que decide a distribuição é **"Ficou para assistir"** (assistiu × deslizou) — e ela **só existe
no Studio**. Pela API, a aproximação é **views engajadas ÷ views**, que dá mais baixo (num caso real: 49% pela API ×
64% no Studio). **Nunca compare as duas réguas** entre si: escolha uma por análise.

**Vídeo longo:** leia **minutos médios assistidos** e a **origem do tráfego** (inscritos × feed/busca), não só a
porcentagem de retenção.

## Como ler a curva de retenção de um Short

| Forma da curva | Diagnóstico | Onde mexer |
|----------------|-------------|------------|
| Início **acima de 100%** | gente assistindo de novo — bom sinal | — |
| Queda forte nos primeiros ~10% | **gancho** fraco | primeira frase, cold open, texto de gancho na tela |
| Queda no meio | **ritmo**, ou a frase-chave chega tarde | cortar pausas, começar mais perto da tese |
| Queda no fim | **fechamento** | terminar na conclusão/punchline (G3a) |

## Comparar sem se enganar

- A Analytics API fecha com **~2 dias de atraso**: compare por **janelas fixas (48 h, 7 d) só depois que a janela fechou**.
- Compare **medianas**, com **≥ 5 vídeos por variante**.
- **Uma variável por vez** (horário, CTA, título) — ou equilibre a segunda variável entre as variantes da primeira.
- Registre cada experimento (hipótese, variantes, vídeos, janela, resultado) num arquivo do projeto, ex.: `docs/experimentos.md`.

## Busca e SEO com dados

- Os **termos reais que trouxeram views** estão na API:
  `dimensions=insightTrafficSourceDetail` com `filters=insightTrafficSourceType==YT_SEARCH` (`maxResults` ≤ 25).
  Use para saber se a busca vem por **tema** ou só pelo **nome do canal**.
- Dado real: busca era **~8% das views** e só trazia **nomes** (do canal e de um orador conhecido), nenhum tema.
  Termos "inventados" para o título não têm busca; orador sem nome conhecido não é termo de busca → título pelo
  tema/referência. Quando o tema não tem busca, o Short depende só do feed — diga isso ao usuário.
- Antes de usar um termo no título, **valide**:
  1. no autocompletar do YouTube (`suggestqueries.google.com`, `ds=yt`, `hl`/`gl` do país);
  2. no top 8 do `search.list` (custa 100 unidades da cota).
- Padrões de busca que existem: **"tema + pessoa conhecida"** e **"referência + explicação"** (ex.: "Romanos 12 explicação").
- Descarte termos dominados por **música ou outro sentido** (playback, letra, karaokê).
- **Busca principal, literal, no começo do título.** O título serve à busca; capa e gancho servem ao feed.

## Conteúdo passivo: a seleção é a edição

Sermão, palestra e live foram gravados para outro fim e **não têm gancho nativo**. As ferramentas:
- começar na **frase forte** (tese, pergunta, imagem);
- **cold open**: 2–4 s da frase de impacto + flash + volta ao começo;
- cortar pausas;
- **texto do gancho na tela** nos primeiros segundos.

Teste o cold open em **metade** dos cortes antes de adotar (é um experimento, não regra).

## Painel do canal

Se o painel for um Artifact do tipo Dashboard: dois `data-draw` com o mesmo nome fazem o último `dash.draw` vencer
(uma tabela aparece dentro de outro elemento). **Prefixe os nomes por tipo** (`k-` números, `t-` tabelas, `c-` gráficos)
e confira duplicatas antes de publicar.

## Rotina de acompanhamento

| Quando | O quê |
|--------|-------|
| Todo dia | coleta das métricas → atualiza o painel do canal |
| Toda semana | relatório: achados + próximo passo de cada um; preenche o registro dos experimentos |

O número de 48 h de um Short aparece no 3º–4º dia; o de 7 dias, no 9º.

## Regras fixas para decidir

| Pergunta | Regra |
|----------|-------|
| Qual horário vence? | Com ≥ 5 Shorts com dados por horário, o de mediana de "ficou" (e de views 48 h) **≥ 30% maior** vira padrão → próxima fase |
| Que corte fazer mais? | O **quartil de cima** em "ficou": o que eles têm em comum (tema, orador, tipo de gancho, duração) vira prioridade |
| O que derruba os fracos? | Queda nos 3 s → refazer ganchos; queda no fim → fechamentos |
| A rubrica presta? | **A cada 10 Shorts:** correlação de cada critério do G3b com "ficou" e views 48 h → ajustar os pesos |
| Personas simuladas? | Só com 20–30 Shorts e 7 dias de dados de cada |

Comece pela **linha de base** do canal antes de qualquer experimento (no caso real: Shorts antigos com "ficou" de 22% a
38%, mediana 31%; busca = 8% das views; vídeos longos vêm quase todos de inscritos; um vídeo institucional convertia
~10× mais inscritos que os Shorts).

## Ligação com a rubrica

Depois de 20–30 Shorts publicados: compare a nota da rubrica (G3b) com a retenção real e o "ficou para assistir" de
cada um, e ajuste os pesos (gancho, autonomia, fechamento, valor, fidelidade). Só então vale simular "personas" assistindo.
