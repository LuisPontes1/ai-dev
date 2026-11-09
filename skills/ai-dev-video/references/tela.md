# O que vai na tela

## Legendas de Short (queimadas, ASS/libass)

Aprovado depois de três rodadas ("A legenda ficou muito boa", "Me pareceu bem sincronizada"):

- **Fonte sem serifa pesada** (Montserrat ExtraBold, tamanho 86 em 1080×1920). A primeira fonte do piloto foi rejeitada: "ta feia".
- **Palavra atual destacada** com cor da marca e um "pop" de escala; já faladas em branco ExtraBold; **por vir em Medium semitransparente** ("ir negritando as palavras conforme fala").
  ```
  Style: Fonte,Montserrat ExtraBold,86,&H00FFFFFF,&H00FFFFFF,&H00151515,&H64000000,0,0,0,0,100,100,1,0,1,6,2,8,90,90,360,1
  palavra atual: {\c<cor>\fscx118\t(0,120,\fscx104)}   por vir: Montserrat Medium com \alpha&H70&
  ```
- **Agrupamento por sentido:** até 6 palavras / 30 caracteres / quebra em pausa ≥ 0,5 s; até 2 linhas. Cada grupo **fica na tela até o próximo começar** — isso acabou com a legenda "espremida" que "troca muito rápido". Efeito colateral a vigiar: palavra sozinha numa pausa.
- **Posição no terço superior (~18–20% da altura)**, sugestão do usuário: "onde sobra espaço vazio… pra não ficar em cima do pastor". Longe da interface de baixo do Shorts, mas não colada no topo (ícones de busca/câmera).
- **Sincronia por alinhamento forçado** (MMS) do texto revisado — ver `pipeline-tecnico.md`.
- **Revisar o texto de cada corte antes de queimar**: erro de transcrição em legenda é permanente.

## Legendas de vídeo 16:9

Sem legenda queimada. Gere `.srt` por palavra (até 10 palavras / 42 caracteres / pausa 0,6 s; fim de cada cue +0,2 s, **sem sobreposição**) e suba no YouTube.

## Capa do Short e marca d'água

- **Capa = um quadro exato** (1 s, no fim), não 5 s: título equilibrado em linhas (sem palavra órfã: "O Evangelho / nos move", não "O Evangelho nos / move"), marca e @canal sobre o vídeo escurecido; áudio em silêncio. O YouTube escolhe um quadro do meio se você não mandar a capa: use `thumbnails.set` com o PNG.
- **Marca d'água** pequena, branca, semitransparente (≈130 px, opacidade 0,7) no canto superior direito; some durante a capa. No 16:9 dispensável se a transmissão já tem logo.

## Vídeo longo com comunicação visual

Problema que resolve: "como não está em quadro aberto, pegando os telões, não tem como ver a projeção" e "só o pastor
falando 40 minutos fica pouco interativo".

**Layouts:** painel lateral à direita (versículos/textos lidos) e cartão escuro (citações) foram aprovados; **faixa
inferior foi rejeitada** ("achei que ficou feio"). Estilo moderno — chips arredondados, cinza-escuro translúcido, cor
da marca, ícones simples — "parecia anos 30… quero um negócio bem moderno".

**Texto lido na tela:** use a **tradução oficial** com crédito; a palavra lida **acende** sincronizada com a voz
(alinhe o texto oficial às palavras faladas com `difflib.SequenceMatcher`, interpole os buracos; abaixo de 0,45 de
acerto, painel estático). Se o orador leu diferente, a tela mostra o texto oficial.

**Notas que se escrevem depois da fala** ("como se fosse tomando nota… sem spoiler"):
- nunca "esboço" antecipado; a nota entra ~0,6 s depois que o orador **termina** a ideia;
- escreve linha a linha (~1,2 s); notas anteriores ganham ✓; o caderno fica ~8 s e sai; bloco novo = página nova;
- com muitas notas, mostre as últimas 5 + "+N acima".

**Outros cartões:** frase-chave (tese), "para aplicar" (✓ + frase prática), citação longa em páginas. Sempre com as
palavras do orador; nada inventado. Corte o que for redundante.

**Densidade** (pergunta do usuário: "quanto tempo de tela limpa?"):
- um painel por vez; prioridade texto lido > citação > frase-chave > aplicação > nota;
- ≥ ~25 s de respiro entre frase e aplicação; sem repetir conteúdo; trocas a < 2,5 s só trocam o conteúdo;
- referência medida: **~21% com painel, ~79% tela limpa**, algo novo a cada ~1 min, histórias longas limpas de propósito.
  Não há "percentual ideal" — calibre pela curva de retenção (princípios de Mayer: coerência, sinalização, contiguidade).

**Regiões exclusivas:** cada canto tem **um elemento por vez** (ex.: chip do orador **ou** CTA no inferior esquerdo).
O render deve **falhar** se dois elementos ocuparem a mesma região ao mesmo tempo — o erro real foi o CTA abrir em
cima do nome do pregador ("acho que vc não fez o check visual").

**Logo queimado pela transmissão** cortado pelo recorte: desloque o recorte para deixá-lo de fora e ponha o logo limpo.

**Chip do orador** (nome, série, título · texto) entra no início e uma vez no meio — não "toda hora".

**Abertura e encerramento** curtos (~6,5 s / ~29 s): símbolo girando, título revelado; no fim "3 frases para levar",
espaços para vídeos sugeridos, como conhecer, próximo episódio. Elementos clicáveis da tela final são postos à mão no Studio.

## CTA

**Short:** zona segura entre o meio e o terço de baixo (fora da interface à direita e embaixo); entra a ~60% do
vídeo, ~4 s, sem som. Animação de botões sendo tocados funciona melhor que selo estático ("mostrar interativamente com
os botões… seria bom"). Ícones que a fonte não tem são desenhados (PIL). Interface simulada só na prévia, nunca no vídeo.

**Vídeo longo:** mais tempo de tela (~20 s), cursor clicando, aparece primeiro o símbolo e gira com calma; entra perto
de 65–80% e numa janela de tela limpa. Prioridade: **inscrição** primeiro; site/redes na tela final e na descrição.

Exemplo de CTA com identidade (o "✝ = ❤" da Igreja Fonte): `caso-igreja-fonte.md`.
