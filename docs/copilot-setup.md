# GitHub Copilot — Setup e Integração com Claude Code

## Como funciona a integração

O Claude Code invoca o Copilot **diretamente via plugin**, sem interação manual no VS Code. O plugin `copilot-plugin-cc` expõe um script `copilot-companion.mjs` que o Claude Code usa para delegar tasks, reviews e código ao Copilot de forma programática.

Claude Code e Copilot rodam como **agentes complementares**:

| | Claude Code | Copilot |
|---|---|---|
| **Papel principal** | Planejamento, contexto amplo, orquestração | Execução de código, refator, geração inline |
| **Como recebe tarefas** | Lê arquivos `.ai-dev/` | Recebe prompt via `copilot-companion.mjs task` |
| **Aplica mudanças?** | Sim (diretamente) | Sim, com flag `--write` |
| **Pode rodar em background?** | Sim | Sim, com flag `--background` |

---

## Instalação do plugin

O plugin já está instalado em:
```
~/.claude/plugins/copilot-plugin-cc/
```

Os slash commands disponíveis ficam em `~/.claude/commands/copilot/`:

| Comando | O que faz |
|---------|-----------|
| `/copilot:setup` | Verifica se o Copilot CLI está pronto e autenticado |
| `/copilot:rescue` | Delega uma tarefa ao Copilot como subagente |
| `/copilot:review` | Roda um code review do Copilot no estado atual do git |
| `/copilot:adversarial-review` | Review adversarial — questiona decisões de design |
| `/copilot:status` | Verifica o status de um job em background |
| `/copilot:result` | Obtém o resultado de um job |
| `/copilot:cancel` | Cancela um job em andamento |

### Verificar se está funcionando

```bash
/copilot:setup
```

Se retornar que o CLI não está instalado, o setup oferece instalar via npm automaticamente.

---

## Fluxo para tarefas `executor: copilot`

Quando uma task em `.ai-dev/tasks/task-XXX.md` tem `executor: copilot`, Claude Code:

1. Lê o arquivo da task (objetivo, inputs, outputs, critério de aceite)
2. Monta o prompt para o Copilot com o contexto necessário
3. Chama o companion diretamente:

```bash
node ~/.claude/plugins/copilot-plugin-cc/plugins/copilot/scripts/copilot-companion.mjs \
  task --write [prompt com contexto da task]
```

4. Monitora o resultado via `status` / `result`
5. Verifica os critérios de aceite
6. Escreve `reports/delivery-XXX.md` e atualiza `assignments.md`

Para tasks mais complexas, Claude Code usa `/copilot:rescue` que roda o Copilot como subagente com capacidade de raciocínio próprio.

### Opções do comando `task`

```
task [--background] [--write] [--resume-last|--resume|--fresh]
     [--model <model|codex|gemini>]
     [--effort <none|minimal|low|medium|high|xhigh>]
     [prompt]
```

| Flag | Quando usar |
|------|-------------|
| `--write` | Aplica as mudanças nos arquivos (necessário para execução real) |
| `--background` | Roda em background — útil para tasks longas |
| `--effort high` | Tasks complexas que precisam de mais raciocínio |
| `--model codex` | Força o modelo Codex (melhor para geração de código) |
| `--resume-last` | Continua o último thread do Copilot |

---

## Quando Claude Code delega ao Copilot vs. executa sozinho

O arquivo da task define o executor — Claude Code respeita essa decisão. Mas em geral:

**Use `executor: copilot` quando:**
- A task é fortemente focada em geração de código (não arquitetura)
- Você quer uma segunda perspectiva de modelo diferente (Codex/Gemini)
- A task é um refactor ou completion dentro de escopo bem definido

**Use `executor: claude-code` quando:**
- A task requer raciocínio sobre múltiplos arquivos e dependências
- Precisa entender o contexto do projeto como um todo
- Envolve decisões de arquitetura ou planejamento

---

## Autenticação

Se o Copilot CLI não estiver autenticado:

```bash
gh auth login
```

Verifique com:
```bash
/copilot:setup
```
