---
name: ai-dev-storytelling
description: Escrever textos que prendem, convencem e soam sênior — posts (LinkedIn), artigos, apresentações, anúncios de projeto, resumos executivos, introduções de README e relatórios para liderança. Cobre persona, voz e tom do autor; postura sênior (julgamento, tradeoff, confiança calibrada) em vez de texto "juninho"; gancho (as primeiras linhas antes do "ver mais"); estrutura narrativa (ABT, momento de virada, sparkline, SCQA); como introduzir um paper/livro/ferramenta sem parecer propaganda; fechamento com posição (estilo Akita); acabamento de frase em português; e remoção de "cheiro de IA". Use sempre que o pedido for escrever, reescrever ou revisar um texto para pessoas lerem, ou quando o usuário reclamar de gancho, fechamento, storytelling ou tom.
---

# Storytelling no ai-dev

Texto bom não é texto bonito. É texto em que **algo muda** — na história e na cabeça de quem lê.
Modelos de linguagem escrevem mal por padrão porque fazem a média: abrem com contexto genérico, listam
em vez de contar, fecham resumindo. Este skill existe para quebrar essa média.

Referências (leia a que o momento pede, não todas):
- `references/voz-tom-persona.md` — as três camadas (quem fala, como sempre fala, como fala **aqui**), as 4 dimensões de tom, tom por situação, como extrair a voz de alguém
- `references/senioridade.md` — **texto juninho vs sênior**: a escada descrever → explicar → julgar → generalizar, 15 sinais com troca, confiança calibrada, ethos
- `references/estilo-frase.md` — acabamento: desordem em português (realizar, a nível de, gerundismo), verbos no lugar de substantivos, ritmo, Orwell, Zinsser, Graham, Pinker
- `references/frameworks.md` — ABT, momento de virada, sparkline, SCQA, SUCCESs, Story Spine, Jobs — de onde vem cada um
- `references/ganchos-e-fechamentos.md` — padrões de abertura e de fechamento, com exemplos em pt-BR
- `references/anti-ia.md` — o que denuncia texto de IA e como trocar
- `references/exemplo-stone.md` — um post reescrito do jeito errado para o jeito certo

## 0. Antes de tudo: a voz

Leia `<repo ai-dev>/knowledge/voz.md` (o caminho está em `~/.claude/ai-dev/knowledge-dir`). Ele tem a persona, a
voz, o tom por situação e as regras que o usuário já ensinou. Elas valem mais do que qualquer coisa neste skill.

Se `voz.md` estiver raso (itens "a confirmar", sem exemplos), peça ao usuário 3 a 5 textos dele que ele gosta — ou
de autores que ele quer como referência — e extraia a voz com o roteiro de `references/voz-tom-persona.md` §4.
Grave o resultado no `voz.md`, com um exemplo real por regra.

## 1. Antes de escrever uma linha — responda por escrito, em 6 linhas

1. **Persona:** "Eu sou [papel] que [viveu o quê], escrevendo para [quem] porque [motivo]." Define o que pode ser
   afirmado, o que não precisa ser explicado e a distância com o leitor.
2. **Tom:** a situação (post, relatório para liderança, post-mortem, anúncio, mensagem para o time) e o ajuste de
   tom correspondente — tabela em `references/voz-tom-persona.md` §3.
3. **O ponto:** uma frase. O que o leitor pensa diferente depois de ler? Se não cabe numa frase, não está pronto.
4. **O leitor:** quem é, o que ele já sabe, por que ele pararia de rolar o feed.
5. **O momento de virada:** o instante concreto em que algo mudou (uma reunião, um erro, um número, uma frase
   que alguém disse). É o coração do texto. Sem ele, o texto vira manual. *(Matthew Dicks, "Storyworthy")*
6. **O ABT:** "[situação] **e** [contexto], **mas** [conflito], **portanto** [o que fizemos / o que muda]".
   Se você não consegue escrever o "mas", não existe história ainda. *(Randy Olson, a partir da regra de Trey Parker)*

Mostre essas 6 linhas ao usuário quando o texto for importante. Corrigir aqui custa 10 segundos; depois, uma reescrita.

## 2. Escolha a estrutura pelo formato

| Formato | Estrutura | Por quê |
|---------|-----------|---------|
| Post, artigo pessoal, história de projeto | ABT + **começar no oposto do final** | Se o fim é "a IA entrou do jeito certo", o começo é o momento em que ela ainda entrava do jeito errado. A distância entre começo e fim é a história. |
| Apresentação, palestra, pitch | Sparkline: alterna **o que é** ↔ **o que poderia ser**, termina num chamado | Cria tensão repetida até a ação. *(Nancy Duarte, "Resonate")* |
| Lançamento, anúncio | Manchete de uma linha + regra de três + um momento "uau" | Dá ao leitor a frase que ele vai repetir. *(Carmine Gallo sobre Steve Jobs)* |
| Relatório para liderança, decisão de DS, e-mail executivo | SCQA → resposta primeiro → argumentos em pirâmide | Executivo quer a conclusão antes do raciocínio. *(Barbara Minto)* |
| Ideia que precisa "colar" | SUCCESs: simples, inesperada, concreta, crível, emocional, história | Checklist de sobrevivência de ideia. *(Chip e Dan Heath, "Made to Stick")* |

## 3. O gancho (as linhas antes do "ver mais")

No LinkedIn o corte acontece por volta de 140 caracteres no celular e ~210 no desktop (estimativas; o LinkedIn não publica o número).
**Tudo o que importa precisa estar ali.**

- Comece **dentro** da cena ou da tensão, não antes dela. Contexto de mercado ("No mundo atual…", "A IA está transformando…") é aquecimento: corte.
- Ancore em algo **específico e seu**: empresa, time, número, momento. "Na Stone estamos trazendo IA para os processos de DS" é melhor que qualquer frase sobre "a revolução da IA" — porque só você pode dizer.
- A segunda linha abre a pergunta que o resto responde (a "lacuna": o leitor precisa saber o que vem depois).
- Teste: leia só as duas primeiras linhas. Você clicaria em "ver mais"? Se a resposta é "talvez", reescreva.

Padrões e exemplos: `references/ganchos-e-fechamentos.md`.

## 4. O meio: mas / portanto, nunca "e então"

- Cada parágrafo se liga ao anterior por **mas** (complica) ou **portanto** (consequência). Se a ligação é "e também", corte ou mova.
- **Concreto vence abstrato:** nome, número com unidade e comparação, cena, frase que alguém disse. "Rodou 6 horas e entregou 40 features testadas" > "aumentou a produtividade".
- **Uma ideia por texto.** As outras viram outro post.
- **Referências (paper, livro, ferramenta) entram como resposta ao conflito, nunca como abertura.** O paper é o "portanto", não o "era uma vez". Primeiro o leitor sente o problema; aí o paper aparece como a coisa que destravou. É isso que faz a citação parecer orgânica em vez de resenha.

## 5. O fechamento

O fim é o que fica. Ele deve **fechar o arco aberto no começo** e deixar uma posição.

- Termine com **opinião assumida em primeira pessoa** — o que você acredita agora que não acreditava antes. Estilo Akita: direto, sem pedir desculpa, sem "na minha humilde opinião", sem resumo.
- Volte à imagem do começo, agora transformada (o "oposto" do passo 2 se resolve aqui).
- Se houver chamada, seja específica ("se você roda DS com agentes, me conta onde eles quebram") — nunca "E você, o que acha? 👇".
- Proibido: "Em resumo", "Concluindo", lista de aprendizados repetindo o texto, hashtags em bloco.

## 6. Postura sênior — o que separa texto maduro de texto "juninho"

O problema de texto juninho é postura, não gramática (detalhes em `references/senioridade.md`):
- **Julgue, não relate.** Cada seção chega pelo menos ao degrau "julgar" (foi bom? a que custo? comparado a quê?).
  O melhor texto chega a "generalizar" (o que isso ensina fora daqui).
- **Nomeie o tradeoff.** Quem decidiu de verdade pagou um preço. "Ganhamos A, pagamos B, valeu porque C."
- **Conte o que deu errado** e o que você faria diferente. É o trecho mais crível do texto.
- **Confiança calibrada:** afirme o que mediu, escope o que vale ("no nosso caso, para batch"), uma ressalva só onde ela é real.
- **Leitor par:** não ensine o óbvio, não peça aprovação, não agradeça todo mundo no meio do texto.
- **Você é o sujeito das decisões;** a ferramenta (IA, paper, framework) é instrumento.

## 7. Revisão — rode tudo, sempre

1. **Teste do feed:** só as 2 primeiras linhas. Dá vontade de abrir?
2. **Teste do "e então":** leia a sequência de parágrafos. Onde a ligação é "e", falta tensão.
3. **Teste da escada:** marque cada parágrafo como descrever / explicar / julgar / generalizar. Só 1 e 2? Suba.
4. **Teste dos 15 sinais** de `references/senioridade.md`.
5. **Teste do cheiro de IA:** `references/anti-ia.md` linha por linha.
6. **Teste da voz e do tom:** compare com `knowledge/voz.md`. Soa como o usuário, no tom desta situação?
7. **Acabamento:** as três passadas de `references/estilo-frase.md` (corte 20%, verbo no lugar de substantivo, leitura em voz alta).

## 8. Aprender com o usuário (o mais importante)

Quando o usuário corrigir um texto ("o gancho tá fraco", "o paper entrou forçado", "fecha igual o Akita"):
1. Entenda a regra por trás da correção, não só a correção.
2. Registre em `knowledge/voz.md` (seção certa) e como aprendizado geral:
   `node ~/.claude/ai-dev/harness/aidev.mjs learn note --global --applies escrita --learning "<regra>"`
3. Ofereça `aidev sync` para levar a regra para outras máquinas.
Assim a mesma correção nunca precisa ser feita duas vezes.
