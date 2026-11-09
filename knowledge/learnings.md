# Aprendizados — todos os projetos

> Escrito com `aidev learn note --global`. Mantenha curto; apague linhas que deixaram de ser verdade.

| Data | Aprendizado | Aplica-se a | Origem |
|------|-------------|-------------|--------|
| 2026-11-08 | Gancho começa no momento real do autor (ex.: transformação com IA na Stone, inclusive em DS), não no assunto ou no paper | escrita | post Stone/paper harness |
| 2026-11-08 | Paper/livro entra de forma orgânica como resposta ao problema, no meio do texto — nunca como abertura nem resenha | escrita | post Stone/paper harness |
| 2026-11-08 | Fechamento estilo Akita: posição em primeira pessoa, curta, sem resumo nem pergunta genérica | escrita | post Stone/paper harness |
| 2026-11-08 | Evitar texto juninho: julgar em vez de relatar, nomear tradeoff e custo, contar o que deu errado, confiança calibrada, não pedir aprovação | escrita | feedback 2026-11-08 |
| 2026-11-09 | Legenda de vídeo só fica sincronizada com alinhamento forçado (MMS) do texto revisado; tempo por palavra do Whisper erra até 2 s | video | cortes IP Fonte 08/11 |
| 2026-11-09 | Nenhum script de render usa fonte do sistema: pasta de fontes vai no pacote para toda VM; conferir com fc-list antes de queimar legenda | video | cortes IP Fonte 08/11 |
| 2026-11-09 | Nada é mostrado ao usuário sem checagem de colisão entre elementos e folha de contato com 1 quadro por elemento | video | cortes IP Fonte 08/11 |
| 2026-11-09 | YouTube Shorts: a métrica que decide distribuição é 'Ficou para assistir' (assistiu × deslizou), que só existe no Studio. Pela API, use views engajadas ÷ views como aproximação (dá mais baixo: 49% × 64% do Studio num caso real) e nunca compare as duas réguas. | video | cortes-culto 11/2026 |
| 2026-11-09 | YouTube Analytics API fecha com ~2 dias de atraso: compare vídeos por janelas fixas (48 h, 7 d) só depois que a janela fechou, e por mediana com ≥ 5 vídeos por variante; uma variável por vez ou equilibre a segunda entre as variantes da primeira. | video | cortes-culto 11/2026 |
| 2026-11-09 | SEO no YouTube com dados: valide cada busca no autocompletar (suggestqueries.google.com, ds=yt, hl/gl do país) e no top 8 de search.list (100 unidades da cota). Padrões que existem: 'tema + pessoa conhecida' e 'referência + explicação'. Descarte termos dominados por música/outro sentido (playback, letra, karaokê). Busca principal literal no começo do título; título serve à busca, capa e gancho servem ao feed. | video | cortes-culto 11/2026 |
| 2026-11-09 | Os termos de busca reais que trouxeram views estão na Analytics API: dimensions=insightTrafficSourceDetail com filters=insightTrafficSourceType==YT_SEARCH (maxResults ≤ 25). Use para ver se a busca vem por tema ou só por nome do canal. | video | cortes-culto 11/2026 |
| 2026-11-09 | Conteúdo passivo (gravado para outro fim, ex.: sermão, palestra, live) não tem gancho nativo: a seleção do trecho é a edição. Ferramentas: começar na frase forte, cold open (2–4 s da frase de impacto + flash + volta ao começo), cortar pausas, texto de gancho na tela. Teste o cold open em metade dos cortes antes de adotar. | video | cortes-culto 11/2026 |
| 2026-11-09 | Retenção de Shorts: início acima de 100% = repetição (bom); queda forte nos primeiros ~10% = gancho; queda no meio = ritmo ou frase-chave tarde; queda no fim = fechamento. Em vídeo longo, leia minutos médios e origem do tráfego (inscritos × feed/busca), não só %. | video | cortes-culto 11/2026 |
