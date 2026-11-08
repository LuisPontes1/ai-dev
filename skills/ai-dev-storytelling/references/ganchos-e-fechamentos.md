# Ganchos e fechamentos

## Ganchos — padrões que funcionam

Cada padrão com um exemplo ruim (média de IA) e um bom.

| Padrão | Ruim | Bom |
|--------|------|-----|
| **Âncora no seu mundo** (empresa, time, momento) | "A IA está revolucionando a forma como trabalhamos." | "Na Stone estamos trazendo IA para os processos — inclusive os de Data Science." |
| **Começar na tensão** | "Hoje quero falar sobre agentes de IA." | "Nosso agente codou 3 horas seguidas e no fim declarou o projeto pronto. Não estava." |
| **Número que surpreende** | "Os resultados foram muito positivos." | "200 features. Todas começaram marcadas como falhando — de propósito." |
| **Confissão / erro** | "Aprendi muitas lições nesse projeto." | "Eu achava que o problema era o modelo. Era a gente." |
| **Frase de alguém** | "Um colega fez uma observação interessante." | "'Ele não precisa de mais memória, precisa de um caderno', disse o tech lead." |
| **Contraste antes/depois** | "Melhoramos nosso processo." | "Em março o agente esquecia tudo a cada sessão. Hoje ele passa o turno com nota de handoff." |

Regras:
- A primeira linha cabe no corte do celular (~140 caracteres). A segunda abre a lacuna.
- Nada de "Você já se perguntou…?", "No mundo atual…", "Vamos falar sobre…", "Fiquei muito feliz em anunciar…".
- Emoji no começo, só se for a voz do usuário (ver `knowledge/voz.md`).

## Como apresentar um paper, livro ou ferramenta

Errado: abrir com ele. ("A Anthropic publicou um paper fascinante sobre…") — vira resenha, o leitor não tem por que ligar.

Certo: **problema → tentativa → paper como a virada → o que mudou na prática**.
1. O leitor sente o problema no seu contexto ("em tarefa longa o agente se perde").
2. Você mostra que tentou o óbvio (prompt maior, mais contexto) e não resolveu.
3. **Portanto** o paper entra: uma frase sobre a ideia central, em linguagem sua ("a ideia é tratar cada sessão como um turno com passagem de bastão").
4. O que você fez com isso e o resultado concreto.
5. Link no fim ou no primeiro comentário — não no gancho.

## Fechamentos — padrões

| Padrão | Como | Exemplo |
|--------|------|---------|
| **Tese em primeira pessoa (Akita)** | 1–2 frases curtas com sua posição, sem ressalva | "Minha aposta: o gargalo de IA em DS não é modelo. É processo. Quem montar o processo primeiro vai na frente." |
| **Volta ao começo, transformado** | Retome a imagem do gancho, agora resolvida | Gancho: "o agente declarou pronto e não estava". Fim: "Hoje ele não declara nada. Ele prova — ou a feature continua falhando." |
| **Frase-manchete** | A frase que o leitor vai repetir | "Agente não precisa de memória maior. Precisa de notas melhores." |
| **Chamado específico** | Pergunta que só quem viveu responde | "Se você já colocou agente em pipeline de DS: onde ele quebrou primeiro?" |

Proibidos: "Em resumo…", "Concluindo…", repetir os pontos em lista, "E você, o que acha? 👇", bloco de hashtags, "Bora?".

## Checklist rápido

- [ ] O gancho é específico do autor (empresa, número, cena) e cabe no corte do celular
- [ ] Existe um "mas" claro nas primeiras 5 linhas
- [ ] O paper/livro/ferramenta aparece como resposta, não como abertura
- [ ] Há pelo menos um número com unidade ou uma cena concreta
- [ ] O fim fecha o arco do começo e deixa uma posição
