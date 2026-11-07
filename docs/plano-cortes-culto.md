# Plano — Cortes de culto com IA

> Status: **planejamento** · Última atualização: 2026-11-07
> Objetivo: transformar a gravação do culto inteiro em **cortes longos (6–14 min)** e **shorts (~59s)** para o YouTube, com sugestões guiadas por conteúdo e por métricas reais do canal.

---

## 1. Visão geral

```
Gravação do culto (1h30–3h)                         [Mac M5 Pro]
  │
  ├─ 1. Extrair áudio (ffmpeg → WAV 16 kHz mono)
  ├─ 2. Separar música × fala (ina_segmenter)     → isola pregação, descarta louvor
  ├─ 3. Transcrever (mlx-whisper large-v3, pt-BR)   → timestamps por palavra
  │
  ├─ 4. Revisar transcrição (Claude Haiku 5.5 via API)
  │       corrige nomes, livros/versículos, pontuação — SEM mexer nos tempos
  │
  ├─ 5. Mapear o culto (Claude)                    → blocos, temas, versículos, frases fortes
  ├─ 6. Sugerir cortes (Claude + skill)            → longos e shorts, com nota e justificativa
  ├─ 7. ✋ Aprovação humana
  │
  ├─ 8. Renderizar (ffmpeg)                         → corte, 9:16 com reframe, legenda, loudness
  ├─ 9. Publicar (YouTube Data API)                 → título, descrição, capítulos
  └─ 10. Métricas (YouTube Analytics API)          → retenção, duração média, inscritos
              └──────── realimenta a skill de cortes ────────┘
```

**Princípio:** o Claude só precisa de **áudio + transcrição** para decidir os cortes. O vídeo pesado só é tocado no render, e isso acontece no Mac.

---

## 1.1 Situação atual (levantamento no Drive, 2026-11-07)

**Gravações:** arquivos `.mov` semanais (domingos), nome no padrão `AAAA-MM-DD HH-MM-SS.mov` (horário de início da gravação, ~10h40), **1,0–2,3 GB** cada, de jun/2026 até 01/11/2026. Cada culto em uma pasta própria.

- Há **duplicatas** (mesmo culto, mesmo tamanho, em pastas diferentes — ex.: 06/09, 13/09, 20/09). O pipeline deve deduplicar por nome + tamanho.
- Também existem: `Recap - Culto - 04-10-2026.mov` (de outra pessoa) e `2026-06-14 11h00 (culto).mov` / `2026-05-10 11h00 (culto).mov` (padrão de nome antigo).

**Tentativa anterior (fev/2025):** `culto.mp4` (só áudio), `culto.txt` (transcrição, ~42 KB, sem timestamps) e `culto_16022024.pdf`. A pregação é sobre **Rute 1** (série em Rute). A transcrição mostra exatamente os problemas que o plano precisa resolver:

| Problema | Exemplos reais em `culto.txt` | Solução no pipeline |
|---|---|---|
| Nomes bíblicos errados | "Ananelé" (Elimeleque), "Lofa" (Orfa), "Quemos" (Quemós), "reciclos de Ruth" (versículos de Rute) | Glossário no `initial_prompt` + revisão Haiku |
| Palavras trocadas | "noas" (noras), "eleu" (e li) | Revisão Haiku |
| Loops/alucinação do Whisper | "perdi a vida e perdi a vida e perdi a vida…", frase de Rute 1:8 repetida 3× | VAD + ina_segmenter, `condition_on_previous_text=False`, detector de repetição |
| Lixo no fim (música/ruído) | "…tenhonorเดínhם aqui, no, na, em, não, quero…" | Transcrever só trechos de fala |
| Sem timestamps | arquivo é texto corrido | Whisper com `word_timestamps` → JSON/SRT |

Mesmo com erros, o conteúdo já mostra **bons candidatos a short** (frases citáveis): *"Não existe meritocracia no Reino de Cristo Jesus"*, *"A gente romantiza a travessia"*, *"O Evangelho é dois amputados que se reconhecem"*, *"Tem dores que nos unem"*.

**Acesso no Mac:** instalar **Google Drive para desktop**; as gravações aparecem em `~/Library/CloudStorage/GoogleDrive-<email>/…`. Marcar a pasta do culto da semana como "disponível offline" antes de processar.

---

## 2. Onde roda cada coisa

| Parte | Onde | Por quê |
|---|---|---|
| Planejamento, código, skills, docs | Sessão cloud (este repo) | Sem acesso a arquivos pesados, ideal para escrever/versionar |
| Gravações, Whisper, render, upload | **Mac M5 Pro** | GPU Apple (Metal/MLX), arquivos locais, custo zero |
| Revisão de transcrição e análise | **Claude API** (chamada do Mac) | Haiku barato para volume; modelo maior para julgamento |
| Controle pelo celular | `claude remote-control` no Mac | Você conversa pelo app; tudo executa no Mac |

### Setup do Mac

```bash
brew install ffmpeg
python3 -m venv ~/.venvs/cortes && source ~/.venvs/cortes/bin/activate
pip install mlx-whisper anthropic inaSpeechSegmenter
git clone git@github.com:LuisPontes1/ai-dev.git && cd ai-dev && bash install.sh
export ANTHROPIC_API_KEY=...        # ou: ant auth login
claude remote-control               # deixa a sessão disponível no celular
caffeinate -i                       # durante processamentos longos
```

> Se o Whisper atual for o `openai-whisper` (PyTorch/CPU), trocar por `mlx-whisper` ou `whisper.cpp` — muito mais rápido no Apple Silicon.

---

## 3. Uso da Claude API (US$ 100 de crédito)

### Modelos por etapa

| Etapa | Modelo | Por quê |
|---|---|---|
| Revisão da transcrição | `claude-haiku-5-5` | Tarefa mecânica e de volume; muito barato |
| Mapa do culto + sugestão de cortes | `claude-opus-5-5` (ou `claude-sonnet-5-5`) | Julgamento editorial — vale o modelo melhor; é 1 chamada por culto |
| Títulos/descrições | `claude-haiku-5-5` ou Sonnet | Testar qualidade e decidir |

### Custo estimado por culto (preços de referência, out/2026)

Um culto de 2h ≈ 20–25 mil palavras ≈ **~40–50 mil tokens**.

| Etapa | Entrada | Saída | Custo aprox. |
|---|---|---|---|
| Haiku 5.5 revisão ($0,10 / $0,50 por MTok) | ~50k | ~50k | **~US$ 0,03** |
| Opus 5.5 cortes ($4 / $20 por MTok) | ~55k | ~6k | **~US$ 0,35** |
| **Total por culto** | | | **< US$ 0,50** |

→ US$ 100 cobrem **centenas de cultos**. Dá para usar o modelo melhor onde importa sem preocupação.
Economias extras se precisar: **Batch API** (−50%, assíncrono — ótimo para revisar de madrugada) e **prompt caching** do system prompt + glossário.

### Revisão da transcrição — regras importantes

A revisão **não pode quebrar os timestamps**, senão a legenda e os cortes saem errados.

1. Enviar a transcrição **em segmentos numerados** (`[0412] 00:41:03.20 → texto`).
2. Haiku devolve **o mesmo ID com o texto corrigido** (structured output / JSON), sem juntar nem dividir segmentos.
3. Corrige: nomes próprios (pastores, igreja, cidades), livros e referências bíblicas (`João 3:16`), termos do glossário, pontuação e maiúsculas.
4. **Não** reescreve estilo nem "melhora" a fala — o texto precisa bater com o áudio.
5. Marca trechos duvidosos (`"incerto": true`) em vez de inventar.
6. Realinhar palavras ao tempo após a correção (diff palavra a palavra; WhisperX se necessário).

**Antes da revisão, reduzir erros na origem:**
- `initial_prompt` do Whisper com o glossário (nomes dos pastores, nome da igreja, termos recorrentes).
- Rodar o Whisper **só nos trechos de fala** (saída do ina_segmenter) — evita alucinações típicas em música ("Obrigado.", "Legendas pela comunidade…").

---

## 4. Critérios de corte (primeira versão — vira skill)

### Cortes longos (6–14 min)
- Uma unidade de ensino **completa**: problema → texto bíblico → aplicação.
- Começa com uma frase que **abre um loop** (pergunta, tensão, história) — nada de "bom, continuando…".
- Termina numa conclusão/aplicação, não no meio de um raciocínio.
- Faz sentido **sem ter visto o culto**.
- Gera título claro + capítulos.

### Shorts (~59s)
- **Uma ideia só.** Gancho nos **3 primeiros segundos**.
- Frase citável, ilustração forte, momento emocional ou contra-intuitivo.
- Corte limpo no fim (frase completa); funciona em loop é bônus.
- Vertical 9:16, rosto centralizado, legenda grande palavra-a-palavra.

### Saída esperada da sugestão
Para cada corte: início/fim, tipo, título sugerido, gancho (primeira frase), tema, versículos, **nota 0–10** e justificativa curta. Você aprova/ajusta antes do render.

---

## 5. Skills e MCPs

### Skills (conhecimento)
| Skill | Conteúdo |
|---|---|
| `contexto-igreja` | Pastores, séries de pregação, linha teológica, tom, temas sensíveis, glossário |
| `cacador-de-cortes` | Critérios da seção 4 + aprendizados das métricas |
| `analista-youtube` | Como ler retenção/CTR/duração e o que funciona **neste** canal |
| `render-padrao` | Estilo de legenda, cores, vinheta, loudness (−14 LUFS) |

### MCPs (ferramentas) — **depois** do fluxo estabilizar
- **MCP do canal**: `transcrever`, `revisar_transcricao`, `mapear_culto`, `sugerir_cortes`, `renderizar`, `publicar`, `metricas`.
- Já disponível: **Google Drive** (conector ativo) para trazer gravações/exportações.
- Começamos com **scripts Python** simples; viram MCP quando a interface estiver clara.

---

## 6. YouTube — métricas

- **YouTube Data API v3**: upload, título, descrição, capítulos, miniatura.
- **YouTube Analytics API**: views, tempo assistido, duração média, retenção (`audienceWatchRatio`), inscritos ganhos.
- Algumas métricas do Studio podem **não** estar na API (ex.: CTR de impressões, "assistiu × deslizou" em shorts) — **a confirmar**. Plano B: exportar CSV do Studio periodicamente.
- Requer projeto no Google Cloud + OAuth com conta **dona/gerente** do canal.

---

## 7. Fases

| Fase | Entrega | Critério de pronto |
|---|---|---|
| **0. Plano** | Este documento | Decisões em aberto respondidas |
| **1a. Piloto no Colab** | `piloto/piloto_cortes_colab.ipynb` (também em `Meu Drive/cortes-culto/`) — Drive montado, Whisper na T4, Haiku + Opus, prévias renderizadas | Rodar no culto de 01/11 e avaliar os cortes |
| **1. Transcrição + sugestão** | Scripts: extrair áudio → segmentar → Whisper → revisão Haiku → mapa + sugestões | Em 1 culto real, você acha ≥ 3 cortes sugeridos "publicáveis" |
| **2. Render** | Corte longo + short vertical com legenda | Vídeos prontos para subir sem edição manual |
| **3. YouTube** | Upload + coleta de métricas | Relatório semanal do canal |
| **4. Empacotar** | Skills + MCP + rotina no ai-dev | Fluxo semanal rodando pelo celular |

---

## 8. Decisões em aberto

- [x] Onde ficam as gravações? → **Google Drive** (ver 1.1)
- [ ] Uma câmera ou várias? Áudio da mesa?
- [ ] Você é dono/gerente do canal (OAuth)?
- [ ] Quantos cultos/semana e meta de cortes + shorts publicados?
- [ ] Quem aprova os cortes?
- [ ] Qual Whisper está instalado hoje no Mac?
- [ ] O pipeline mora neste repo (`ai-dev`) ou num repo próprio (ex.: `cortes-culto`)?
- [ ] Gravação de teste para a Fase 1 → sugestão: `2026-11-01 10-44-29.mov` (a mais recente)
- [ ] O que é o PDF `culto_16022024.pdf` (esboço do sermão? boletim?) — pode virar insumo do contexto
- [ ] Glossário inicial: nome da igreja, pastores, membros citados com frequência, série atual
