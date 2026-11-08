# Texto juninho vs texto sênior

O problema de um texto "juninho" quase nunca é gramática. É **postura**. O texto júnior relata atividade, explica
o óbvio, se empolga sem prova e pede aprovação. O texto sênior entrega **julgamento**: o que importa, por quê, a
que custo, e o que ele faria diferente. Escreve para um leitor inteligente, como uma conversa entre pares.

## A escada da profundidade

Todo parágrafo está num destes degraus. Texto júnior fica nos dois primeiros. Texto sênior vive nos dois
últimos, apoiado nos primeiros.

| Degrau | Pergunta que responde | Exemplo (DS) |
|--------|-----------------------|--------------|
| 1. Descrever | O que aconteceu? | "Colocamos agentes para gerar as features do modelo de churn." |
| 2. Explicar | Como funciona? | "Cada agente lê uma lista de features e implementa uma por sessão." |
| 3. **Julgar** | Isso foi bom? A que custo? Comparado a quê? | "Ficou mais lento por sessão, mas parou de quebrar o que já funcionava — e é isso que custava caro." |
| 4. **Generalizar** | O que isso ensina que vale fora daqui? | "O limite de agente em DS não é o modelo; é a ausência de critério de pronto." |

Regra: **cada seção precisa chegar pelo menos ao degrau 3.** Se um parágrafo para no 1 ou no 2, ele é contexto —
encurte e suba.

## 15 sinais, com troca

| # | Sinal júnior | Por que soa júnior | Troca sênior |
|---|--------------|--------------------|--------------|
| 1 | Lista do que fez ("fiz X, Y e Z") | Atividade não é resultado | O que mudou por causa disso, e o que você escolheu **não** fazer |
| 2 | Só vantagens | Quem decidiu de verdade pagou um preço | Nomeie o tradeoff e o custo: "ganhamos A, pagamos B, valeu porque C" |
| 3 | "Muito melhor", "bem mais rápido" | Adjetivo sem régua | Número com base de comparação: "de 3 dias para 4 horas" |
| 4 | Ensina o óbvio ("é importante lembrar que testes são importantes") | Trata o leitor como aluno | Corte; o leitor par já sabe. Fale do que **não** é óbvio |
| 5 | Hype ("isso muda tudo", "revolucionário") | Empolgação substituindo prova | Afirmação calibrada e escopada: "no nosso caso, para pipelines batch, mudou X" |
| 6 | Hedge em tudo ("talvez", "de certa forma", "na minha humilde opinião") | Medo de se comprometer | Uma ressalva onde ela é real; o resto, afirmado |
| 7 | Pede aprovação ("o que vocês acham?", "espero ter ajudado") | Coloca o leitor como juiz | Termine com posição; pergunte só o que você realmente quer saber |
| 8 | Agradece todo mundo no meio do texto | Muda o foco do texto para a política | Crédito específico e curto, no lugar certo ("a ideia do log foi do fulano") |
| 9 | Esconde o que deu errado | Parece vitrine, não experiência | Conte o erro com calma e o que ele ensinou — é o trecho mais crível do texto |
| 10 | Jargão para impressionar | Ofusca; a maldição do conhecimento | Termo técnico só quando o leitor também usa; senão, a palavra simples |
| 11 | Ferramenta como protagonista ("o Claude fez…") | Quem decide é a ferramenta | Você é o sujeito das decisões; a ferramenta é instrumento |
| 12 | Conclusão genérica ("IA é o futuro") | Qualquer pessoa poderia ter escrito | Conclusão que só a sua experiência sustenta |
| 13 | Exclamações!! | Entusiasmo de quem quer convencer | Ponto final. A frase forte não precisa de ajuda |
| 14 | Cobre tudo superficialmente | Medo de deixar algo de fora | Uma ideia, funda. As outras viram outros textos |
| 15 | Sem "e se eu fizesse de novo" | Falta reflexão | Uma frase sobre o que você faria diferente — é onde aparece o julgamento |

## Exemplo — mesmo conteúdo, duas posturas

**Juninho:**
> Nas últimas semanas implementamos agentes de IA no nosso processo de Data Science e os resultados foram
> incríveis! Usamos uma lista de features, um arquivo de progresso e testes automatizados. Foi uma experiência
> de muito aprendizado e acredito muito que a IA vai transformar a forma como trabalhamos. Agradeço ao time
> pelo apoio! O que vocês acham?

**Sênior:**
> Colocamos agentes para escrever as features do modelo de churn e a primeira semana foi ruim: eles
> marcavam tarefa como pronta sem rodar nada, e a cada sessão nova esqueciam o que tinham feito.
> A correção não foi prompt. Foi processo: lista de entregáveis que começa toda "falhando", nota de passagem
> entre sessões e nada vira "pronto" sem teste rodado. Ficou mais lento por sessão — e mais rápido no total,
> porque paramos de refazer. Se eu começasse de novo, colocaria o critério de pronto antes do primeiro agente.

O que mudou: sujeito "nós" decidindo; erro contado; tradeoff explícito (mais lento por sessão, mais rápido no
total); julgamento; "faria diferente". Zero adjetivo de empolgação. Zero pedido de aprovação.

## Confiança calibrada

Sênior não é arrogante nem inseguro. É **preciso sobre o tamanho da afirmação**:
- Escopo: "no nosso time", "para batch", "nos 3 projetos em que testamos".
- Força proporcional à evidência: o que você mediu, afirme; o que você supõe, diga que supõe — uma vez.
- Discorde de ideias, não de pessoas, e diga por quê.

## Credibilidade (ethos) sem se gabar

Aristóteles separava três apelos: credibilidade de quem fala (*ethos*), emoção do público (*pathos*) e razão
(*logos*). Texto júnior tenta ganhar ethos com cargo e entusiasmo. Texto sênior ganha ethos com **detalhe que só
quem fez sabe** — o número exato, o erro específico, a decisão difícil. E usa pathos com parcimônia: emoção em
excesso faz o autor parecer parcial.

Fontes: Steven Pinker, *The Sense of Style* (estilo clássico, maldição do conhecimento); Chip e Dan Heath, *Made
to Stick* (maldição do conhecimento); Aristóteles, *Retórica* (ethos, pathos, logos); prática de design docs em
engenharia (tradeoffs como sinal de julgamento).
