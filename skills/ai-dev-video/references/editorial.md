# Editorial — que trecho vira corte

## Produtos (defina antes de cortar)

| Produto | Formato | Duração | Para quê |
|---------|---------|---------|----------|
| **Short** | 9:16, legenda queimada | 30 s – 3 min (a maioria 60–112 s) | Alcance; isca para o canal |
| **Corte médio** do canal | **16:9**, sem legenda queimada, `.srt` por palavra | 5–15 min | Uma unidade de ensino completa |
| **Vídeo longo editado** ("a Palavra") | 16:9 com comunicação visual | o sermão inteiro (~50 min) | Quem não viu ao vivo; assistir com contexto |

"Corte curto/médio" **não é Short**: o usuário corrigiu — "o curto… não é formato de shorts… ele é pro canal mesmo…
formato deitado". Pergunte o formato quando houver dúvida.

## Onde achar material

- Separe fala de música (inaSpeechSegmenter) e ache o sermão/palestra principal pelos tempos.
- Não só o bloco principal: abertura, mensagem às crianças, falas temáticas e **sessão de perguntas** rendem cortes.
  Em perguntas sem microfone, o título faz o papel da pergunta.
- Descarte quando a **fonte** é ruim (câmera trocada com barras pretas, desfoque): "não dá pra usar esse corte… teve problema
  na origem". Mova para `descartados/`; nunca apague.

## G3a — Coesão (obrigação do assistente)

Para **cada** corte, leia: a frase antes do início · o início · o fim · a frase depois do fim.

- Não começa com "e…", "porque…", "sim," solto nem no meio de frase.
- Não termina antes da conclusão ("parava antes dos agravantes") nem em frase que depende do que vem depois.
- Pergunta levantada dentro do corte precisa ser respondida dentro dele.
- História maior que o formato vira **série em partes**; a parte 1 termina num gancho e as partes saem em dias seguidos.
  Cuidado: a parte 2 precisa se entender sozinha.
- Abertura morna é pulada ("Fazer a leitura de Romanos…" → começar 5 s depois, na primeira frase com conteúdo).
- Conteúdo datado ("ontem celebramos…") envelhece o corte — evite como abertura.
- Corte definido por **ids de segmento** da transcrição, não por tempo solto: a revisão de texto mantém os ids e os cortes aprovados continuam válidos.
- Valide antes do render imprimindo duração e o fim do último segmento:
  ```python
  print(f"{k} {a}-{b} {ini/60:6.2f}-{fim/60:6.2f} {fim-ini:6.1f}s fim: …{S[b]['texto'][-50:]}")
  ```

## G3b — Rubrica cega

O usuário recusou nota "de olho" ("nota arbitrária sua… não tem como fazer com uma metodologia correta?").

Avaliador (modelo forte) recebe **só o texto falado do corte**, como espectador que nunca viu o vídeo. Critérios 1–5:

| Critério | Peso | Pergunta |
|----------|------|----------|
| Gancho | 0,25 | A 1ª frase (3 s) faz parar de rolar? |
| Autonomia | 0,25 | Entende-se sem o resto? (sem "isso", "ele", "esse texto", "como eu disse") |
| Fechamento | 0,15 | Termina em conclusão, punchline ou pergunta? |
| Valor | 0,20 | Insight, aplicação, história, humor ou emoção? |
| Fidelidade | 0,15 | Fora de contexto, continua fiel ao que o orador quis dizer? |

Nota = soma ponderada × 2 (0–10). **Só vai para aprovação ≥ 7** (ou o que foi ajustado pela sugestão do avaliador).
Saída: problemas, sugestão de ajuste, título pesquisável (≤ 70 caracteres).
- O avaliador varia ~0,3–0,5 na mesma entrada: rode 3× e use a média em decisões de borda.
- Rode por **subagente** quando o usuário tiver mais cota no plano do que crédito de API (`--exportar` → subagente → `--importar`).
- A rubrica não vê imagem: o contexto visual (quem está no quadro, se a cena faz sentido) é conferido no G4.
- Futuro: "personas" assistindo segundo a segundo — só depois de 20–30 Shorts publicados, para calibrar contra a retenção real.

## O que tende a funcionar (e o que não)

Notas altas no piloto: **autoironia** do orador, **gancho inesperado** nos primeiros segundos, **conversa com quem está de
fora** ("Amo Jesus, mas odeio a igreja — será que dá?"), temas atuais (ansiedade, comparação) com exemplos concretos.
Abrir pela **tese** ("Se a igreja não estiver pautada em Cristo, todo o resto vai ser um problema") foi elogiado.

Notas baixas / fora: exortação que soa como **bronca** fora de contexto; temas **políticos**; piadas que dependem do
contexto; liturgia (ceia, louvor) — sem o culto em volta, não funcionam como corte.

Short pode servir de **isca** para o corte longo terminando antes da explicação completa (hipótese, ainda não medida).

## Títulos

- Pesquisáveis, no padrão do canal (ex.: "Título | Texto | Orador"). "Se o que nos une é dorama, igreja não existe"
  foi criticado: "Ele tá pesquisável?… Achei esquisito o título".
- Sem clickbait enganoso; fiel à mensagem.
- Palavras sensíveis (doença, morte): **fora do título, da capa e da primeira legenda**; o áudio não é mutado.
