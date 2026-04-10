# Copilot Plugin — Referência Completa

O ai-dev inclui um plugin integrado que invoca o GitHub Copilot diretamente do Claude Code — sem interação manual no VS Code. Usa o `@github/copilot-sdk` (v0.2.2+) para criar sessões, enviar prompts, monitorar jobs em background e recuperar resultados programaticamente.

---

## O que é o plugin

O plugin expõe o script `copilot-companion.mjs` — uma CLI Node.js que se comunica com o Copilot via JSON-RPC através do SDK oficial.

**Código fonte no repo:**
```
ai-dev/plugins/copilot/
├── package.json                    ← @github/copilot-sdk ^0.2.2
├── .claude-plugin/plugin.json
├── scripts/
│   ├── copilot-companion.mjs       ← script principal (~960 linhas)
│   ├── session-lifecycle-hook.mjs  ← hook de sessão
│   ├── stop-review-gate-hook.mjs   ← hook de review gate
│   └── lib/                        ← módulos internos
│       ├── copilot-client.mjs      ← integração com SDK Copilot
│       ├── tracked-jobs.mjs        ← controle de jobs em background
│       ├── state.mjs               ← persistência de jobs
│       ├── render.mjs              ← formatação de output
│       ├── git.mjs                 ← operações git para reviews
│       └── ...
├── commands/                       ← slash commands
├── agents/                         ← copilot-rescue subagent
├── prompts/                        ← templates de prompt
├── schemas/                        ← JSON schema para reviews
├── hooks/                          ← hooks de sessão
└── skills/                         ← skills internas
```

**Instalado pelo `install.sh` em:**
```
~/.claude/plugins/ai-dev-copilot/   ← plugin + node_modules
~/.claude/commands/copilot/          ← slash commands
```

**Slash commands disponíveis:**
```
/copilot:setup              → verificar estado e autenticação
/copilot:review             → code review do working tree ou branch
/copilot:adversarial-review → review que questiona decisões de design
/copilot:rescue             → delegar tarefa completa ao Copilot
/copilot:status             → status de jobs em background
/copilot:result             → resultado de job concluído
/copilot:cancel             → cancelar job ativo
```

---

## Instalação

O plugin é instalado automaticamente pelo `install.sh` do ai-dev:

```bash
git clone git@github.com:LuisPontes1/ai-dev.git
cd ai-dev
bash install.sh
```

O installer copia o plugin, roda `npm install` (que baixa o `@github/copilot-sdk`), e instala os slash commands.

Após instalação, verifique:

```
/copilot:setup
```

### Pré-requisitos

- **Node.js >= 18.18** (`node --version`)
- **GitHub Copilot** ativo na conta GitHub
- **GitHub CLI** autenticado (`gh auth status`)

### Autenticar

Se o `/copilot:setup` indicar que não está autenticado:

```bash
gh auth login
```

Após autenticar, rode `/copilot:setup` novamente para confirmar.

---

## Modelos disponíveis

O Copilot expõe diferentes modelos com diferentes capacidades. Use o flag `--model` nos comandos `task` e `rescue`.

| Alias | Modelo real | Melhor para |
|-------|-------------|-------------|
| *(padrão)* | GPT-4o | Tasks gerais, equilibrado |
| `gpt-5.4` | GPT-5.4 | Raciocínio complexo, multi-arquivo |
| `codex` | `gpt-5.3-codex` | Geração pura de código, sem raciocínio |
| `gemini` | `gemini-3.1-pro` | Alternativa Google, contexto longo |

**Effort levels** (controlam profundidade de raciocínio do modelo):

| Effort | Quando usar |
|--------|-------------|
| `none` | Sem raciocínio — resposta direta |
| `minimal` | Geração mecânica, boilerplate |
| `low` | Mudanças simples, bem definidas |
| `medium` | Tasks padrão, complexidade moderada |
| `high` | Lógica complexa, múltiplos arquivos |
| `xhigh` | Máximo raciocínio — tasks arquiteturais |

> O effort só faz diferença em modelos que suportam reasoning (gpt-5.4, não codex).

---

## Comandos

### `/copilot:setup`

Verifica disponibilidade, autenticação e configurações do plugin.

```bash
# Verificar estado
/copilot:setup

# Ativar stop-review-gate (Copilot revisa cada resposta do Claude antes de exibir)
/copilot:setup --enable-review-gate

# Desativar review gate
/copilot:setup --disable-review-gate
```

---

### `/copilot:rescue`

Delega uma tarefa completa ao Copilot como subagent com raciocínio próprio. É o comando mais poderoso — Copilot recebe o contexto e decide como resolver.

```
/copilot:rescue refatorar o módulo de autenticação para suportar OAuth2
```

**Flags:**

| Flag | Comportamento |
|------|---------------|
| `--background` | Roda em background, use `/copilot:status` para acompanhar |
| `--wait` | Aguarda resultado na mesma sessão |
| `--model codex` | Força um modelo específico |
| `--effort high` | Define nível de raciocínio |
| `--resume` | Continua o thread atual do Copilot |
| `--fresh` | Força novo thread (ignora contexto anterior) |
| `--resume-last` | Retoma automaticamente o último thread ativo |

**Exemplo com model e effort:**
```
/copilot:rescue --model gpt-5.4 --effort xhigh redesenhar a camada de serviços para CQRS
```

**Thread management:**  
O plugin detecta se há um thread ativo do Copilot na sessão atual. Se sim, pergunta: "Continuar o thread atual ou iniciar novo?" — útil para tasks que se desdobram em follow-ups.

---

### `/copilot:review`

Code review do estado atual do git (working tree ou branch). Retorna o output do Copilot verbatim.

```bash
# Review do working tree (mudanças não commitadas)
/copilot:review

# Review de uma branch inteira (vs main)
/copilot:review --scope branch --base main

# Forçar foreground
/copilot:review --wait

# Forçar background
/copilot:review --background
```

O comando estima o tamanho do diff e recomenda foreground (diff pequeno) ou background (diff grande) antes de perguntar.

---

### `/copilot:adversarial-review`

Review que questiona decisões de design e trade-offs — não só bugs. Útil antes de aprovar um plano ou após uma task de implementação complexa.

```bash
# Review adversarial do working tree
/copilot:adversarial-review

# Com foco específico
/copilot:adversarial-review --scope branch focar em segurança e injeção de dependências
```

A diferença do `/copilot:review`: o adversarial questiona *se a abordagem escolhida é a certa*, não apenas se a implementação está correta.

---

### `/copilot:status`

Verifica o status de jobs em background.

```bash
# Status de todos os jobs
/copilot:status

# Status de um job específico
/copilot:status job-abc123

# Com saída JSON
/copilot:status --json
```

---

### `/copilot:result`

Recupera o resultado de um job concluído.

```bash
/copilot:result job-abc123
```

---

### `/copilot:cancel`

Cancela um job em andamento.

```bash
/copilot:cancel job-abc123
```

---

## Como o sistema ai-dev usa o plugin

Quando uma task tem `executor: copilot`, o `/ai-dev-exec` (ou o PM manualmente):

1. Lê `.ai-dev/tasks/task-XXX.md` (objetivo, outputs esperados, critério de aceite)
2. Lê todos os arquivos em `## Contexto necessário` e `## Inputs`
3. Escreve um prompt autocontido em `.ai-dev/tasks/task-XXX-prompt.md` — todo contexto inline
4. Invoca o companion via `--prompt-file` (prompts nunca são passados inline):

```bash
node ~/.claude/plugins/ai-dev-copilot/plugins/copilot/scripts/copilot-companion.mjs \
  task \
  --write \
  --model gpt-5.4 \
  --effort high \
  --prompt-file .ai-dev/tasks/task-XXX-prompt.md
```

O `--write` é obrigatório — sem ele o Copilot sugere mas não aplica as mudanças nos arquivos.

O prompt fica em arquivo por design — auditável, reproduzível, e consistente com o princípio do sistema: "context lives in files, never in chat."

Para tasks complexas (type: `implementation` com múltiplos arquivos ou lógica arquitetural), usa `/copilot:rescue` — que automaticamente detecta a task ativa e lê o prompt file quando ai-dev está ON.

**Após execução:**
1. Subagent verifica os critérios de aceite da task
2. Escreve `reports/delivery-XXX.md`
3. Atualiza status em `assignments.md`
4. PM lê o report e resume ao usuário

---

## Stop-review-gate

O plugin tem uma feature chamada **stop-review-gate**: antes de exibir cada resposta do Claude para você, o Copilot revisa a resposta e pode adicioná-la ao contexto ou bloqueá-la.

Útil em projetos onde você quer uma segunda opinião automática sobre cada sugestão do Claude antes de ver o resultado final.

```bash
# Ativar
/copilot:setup --enable-review-gate

# Desativar
/copilot:setup --disable-review-gate
```

> No contexto do sistema ai-dev, o review gate é mais útil fora das tasks planejadas — durante conversas exploratórias onde você ainda está definindo o escopo.

---

## Escolhendo executor e modelo por task

| Cenário | Executor | Modelo | Effort |
|---------|----------|--------|--------|
| Criar estrutura de arquivos, scaffold | `claude-code` | `sonnet` | — |
| Lógica complexa, múltiplos arquivos | `claude-code` | `opus` | — |
| Geração de código dentro de escopo claro | `copilot` | `gpt-5.4` | `medium` |
| Refactor arquitetural, redesign | `copilot` | `gpt-5.4` | `xhigh` |
| Geração de boilerplate, CRUD | `copilot` | `codex` | `minimal` |
| Verificação, testes, análise | `claude-code` | `sonnet` | — |
| Algo que requer contexto longo | `copilot` | `gemini` | `high` |

O PM atribui executor e modelo durante o planejamento. Você pode ajustar antes de aprovar o plano — basta dizer "task-003 vai pro copilot com gpt-5.4 xhigh".
