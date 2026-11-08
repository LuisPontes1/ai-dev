---
name: ai-dev-storytelling
description: Escrever textos que prendem e convencem — posts (LinkedIn), artigos, apresentações, anúncios de projeto, resumos executivos, introduções de README e relatórios para liderança. Cobre gancho (as primeiras linhas antes do "ver mais"), estrutura narrativa (ABT, momento de virada, sparkline, SCQA), como introduzir um paper/livro/ferramenta sem parecer propaganda, fechamento com posição (estilo Akita), voz do autor e remoção de "cheiro de IA". Use sempre que o pedido for escrever, reescrever ou revisar um texto para pessoas lerem, ou quando o usuário reclamar de gancho, fechamento, storytelling ou tom.
---

# Storytelling no ai-dev

Texto bom não é texto bonito. É texto em que **algo muda** — na história e na cabeça de quem lê.
Modelos de linguagem escrevem mal por padrão porque fazem a média: abrem com contexto genérico, listam
em vez de contar, fecham resumindo. Este skill existe para quebrar essa média.

Referências (leia a que o momento pede, não todas):
- `references/frameworks.md` — ABT, momento de virada, sparkline, SCQA, SUCCESs, Story Spine, Jobs — de onde vem cada um
- `references/ganchos-e-fechamentos.md` — padrões de abertura e de fechamento, com exemplos em pt-BR
- `references/anti-ia.md` — o que denuncia texto de IA e como trocar
- `references/exemplo-stone.md` — um post reescrito do jeito errado para o jeito certo

## 0. Antes de tudo: a voz

Leia `<repo ai-dev>/knowledge/voz.md` (o caminho está em `~/.claude/ai-dev/knowledge-dir`). Ele tem as regras
que o usuário já ensinou. Elas valem mais do que qualquer coisa neste skill.

## 1. Antes de escrever uma linha — responda por escrito, em 4 linhas

1. **O ponto:** uma frase. O que o leitor pensa diferente depois de ler? Se não cabe numa frase, não está pronto.
2. **O leitor:** quem é, o que ele já sabe, por que ele pararia de rolar o feed.
3. **O momento de virada:** o instante concreto em que algo mudou (uma reunião, um erro, um número, uma frase
   que alguém disse). É o coração do texto. Sem ele, o texto vira manual. *(Matthew Dicks, "Storyworthy")*
4. **O ABT:** "[situação] **e** [contexto], **mas** [conflito], **portanto** [o que fizemos / o que muda]".
   Se você não consegue escrever o "mas", não existe história ainda. *(Randy Olson, a partir da regra de Trey Parker)*

Mostre essas 4 linhas ao usuário quando o texto for importante. Corrigir aqui custa 10 segundos; depois, uma reescrita.

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

## 6. Revisão — rode tudo, sempre

1. **Teste do feed:** só as 2 primeiras linhas. Dá vontade de abrir?
2. **Teste do "e então":** leia a sequência de parágrafos. Onde a ligação é "e", falta tensão.
3. **Teste do cheiro de IA:** passe `references/anti-ia.md` linha por linha.
4. **Teste da voz:** compare com `knowledge/voz.md`. Soa como o usuário ou como um assistente?
5. **Corte 20%.** Quase todo texto melhora.
6. **Leia em voz alta.** Onde você tropeça, o leitor desiste.

## 7. Aprender com o usuário (o mais importante)

Quando o usuário corrigir um texto ("o gancho tá fraco", "o paper entrou forçado", "fecha igual o Akita"):
1. Entenda a regra por trás da correção, não só a correção.
2. Registre em `knowledge/voz.md` (seção certa) e como aprendizado geral:
   `node ~/.claude/ai-dev/harness/aidev.mjs learn note --global --applies escrita --learning "<regra>"`
3. Ofereça `aidev sync` para levar a regra para outras máquinas.
Assim a mesma correção nunca precisa ser feita duas vezes.
