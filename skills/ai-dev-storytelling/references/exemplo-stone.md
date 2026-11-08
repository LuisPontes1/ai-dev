# Exemplo: post sobre o paper de harness, no contexto da Stone

Exemplo ilustrativo para mostrar a técnica. **Os fatos (números, resultados, nomes) precisam vir do usuário** —
onde aparece `[…]`, é dado real a preencher, não para inventar.

## Versão "média de IA" (o que não fazer)

> 🚀 Você já se perguntou como manter agentes de IA trabalhando por horas sem perder o foco?
>
> Recentemente li um paper fascinante da Anthropic sobre "harnesses" para agentes de longa duração, e quero
> compartilhar os principais aprendizados! 💡
>
> ✅ Feature list em JSON
> ✅ Arquivo de progresso
> ✅ Script de inicialização
> ✅ Testes end-to-end
>
> Isso muda tudo na forma como trabalhamos com IA. No fim do dia, não é sobre o modelo, é sobre o processo.
>
> E você, já usa agentes no seu dia a dia? 👇 #IA #DataScience #Inovação

**Por que é ruim:** abre com pergunta genérica; o paper é a abertura (vira resenha); lista sem história; nenhum
"mas"; nada que só o autor poderia dizer; fecha com chavão e pergunta genérica; emojis de marcador.

## Versão com gancho, ABT e fechamento com posição

> Na Stone estamos vivendo uma virada: IA entrando nos processos — e nos de Data Science também.
> E a primeira coisa que aprendi foi que o agente não falha por ser burro.
>
> Ele falha por outro motivo. Em tarefa longa, ele tenta fazer tudo de uma vez, para no meio, e na sessão
> seguinte não lembra de nada. Pior: às vezes olha o que já existe e declara o trabalho pronto. [exemplo real
> do time: o que aconteceu, quando]
>
> A gente tentou o óbvio: prompt maior, mais contexto. Não resolveu.
>
> O que destravou foi um paper da Anthropic sobre agentes de longa duração. A ideia central é simples: tratar
> cada sessão como um turno de trabalho. Um agente prepara o terreno uma vez; depois, cada turno lê as notas
> do anterior, faz **uma** coisa, prova que funciona e deixa nota para o próximo. Nada é marcado como pronto
> sem teste.
>
> Trouxemos isso para o nosso fluxo de DS: [o que mudou na prática — ex.: lista de entregáveis que começa toda
> "falhando", log de passagem, teste antes de dar como feito]. Resultado: [número real].
>
> Minha aposta: o gargalo de IA em DS não é o modelo. É o processo em volta dele. Agente não precisa de memória
> maior — precisa de notas melhores. E isso é trabalho nosso.
>
> (Link do paper no primeiro comentário.)

**O que mudou:**
- **Gancho:** âncora no mundo do autor (Stone, DS, transformação) + tensão na segunda linha ("não falha por ser burro").
- **Começo no oposto do fim:** começa com o agente se perdendo; termina com o processo que não deixa ele se perder.
- **ABT:** estamos trazendo IA **e** os agentes codam bem, **mas** se perdem em tarefa longa, **portanto** mudamos o processo.
- **Paper como virada:** aparece no meio, como a resposta à tentativa que falhou — orgânico, não resenha.
- **Concreto:** espaço reservado para exemplo e número reais.
- **Fechamento estilo Akita:** tese em primeira pessoa, curta, com a frase-manchete ("notas melhores").
