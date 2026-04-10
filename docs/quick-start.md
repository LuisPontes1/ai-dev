# Quick Start

Do zero ao primeiro projeto planejado em 10 minutos.

---

## 1. Instalar

```bash
git clone git@github.com:LuisPontes1/ai-dev.git
cd ai-dev
bash install.sh
```

O que acontece:
- `~/CLAUDE.md` é criado (ou atualizado) com as instruções globais do sistema
- `~/.claude/commands/ai-dev-init.md` é instalado como slash command `/ai-dev-init`

Verifique:
```bash
cat ~/CLAUDE.md | head -5
# Deve mostrar: # AI-Dev Planning System — Global Instructions
```

---

## 2. Abrir um projeto existente

Abra qualquer repo no VS Code com Claude Code ativo. Na primeira mensagem da sessão, o PM lê o estado do projeto e mostra:

```
## Project: minha-api

Não encontrei .ai-dev/ neste repo.

Quer que eu inicialize o sistema de planejamento? Vou criar a estrutura,
detectar o tipo de projeto e parar para você revisar.
```

Digite "sim" ou "pode inicializar".

---

## 3. Inicializar

O PM roda `/ai-dev-init` internamente. Ele:

1. Detecta o tipo de projeto (`python-package`, `databricks-bundle`, `data-pipeline`, ou `generic`)
2. Cria `.ai-dev/` com a estrutura completa
3. Preenche `context.md` com o que inferiu do projeto
4. Adiciona `.ai-dev/` ao `.gitignore` (ou `.databricksignore`)

Resposta do PM:

```
Inicializado. Detectei: python-package

Arquivos criados:
  .ai-dev/context.md         ← revise as seções com [TODO]
  .ai-dev/plan.md
  .ai-dev/tasks/_template.md
  .ai-dev/agents/assignments.md
  .ai-dev/agents/roles.md
  .ai-dev/dependencies/graph.md
  .ai-dev/discovery/
  .ai-dev/reports/

Seções que precisam de revisão em context.md:
  - Stack → framework não identificado [TODO]
  - Credenciais → nenhuma mapeada ainda [TODO]

Próximo passo: revise context.md e me diga o que você quer construir.
Execução está bloqueada até o plano ser aprovado.
```

---

## 4. Revisar o contexto

Abra `.ai-dev/context.md` (ou peça ao PM para mostrar o conteúdo). Complete os `[TODO]`. Exemplo:

```
Você: completa o context.md — o framework é FastAPI, banco é PostgreSQL,
      credencial é DATABASE_URL via env var
```

O PM atualiza o arquivo e confirma.

---

## 5. Descrever o que quer fazer

```
Você: quero adicionar autenticação JWT — login com email/senha,
      token com expiração de 24h, proteger as rotas /users e /orders
```

O PM pensa no plano, verifica atomicidade de cada task, atribui executor e modelo:

```
Proposta de plano — Autenticação JWT

task-001  preflight       Verificar PyJWT instalado e SECRET_KEY no env
                          executor: claude-code · sonnet

task-002  implementation  Criar modelo User e endpoint POST /auth/login
                          executor: claude-code · sonnet

task-003  implementation  Criar middleware JWT e decorator @require_auth
                          executor: copilot · gpt-5.4·high

task-004  implementation  Proteger rotas /users e /orders com @require_auth
                          executor: copilot · gpt-5.4·medium

task-005  verification    Rodar pytest e verificar cobertura das novas rotas
                          executor: claude-code · sonnet

Dependências: 001 → 002 → 003 → 004 → 005

Quer ajustar alguma task antes de aprovar?
```

---

## 6. Aprovar o plano

```
Você: task-002 separa em duas — modelo User numa task e o endpoint /auth/login noutra
```

```
PM: Atualizado. Agora são 6 tasks. task-002a cria o modelo, task-002b cria o endpoint
    (depende de 002a). Demais tasks ajustadas. Confirma o plano?
```

```
Você: aprovado
```

O PM atualiza `plan.md` para `Status: approved` e registra no changelog.

---

## 7. Execução

O PM propõe a primeira task:

```
PM: Pronto para iniciar task-001 — preflight?
    Executor: claude-code · sonnet
    Vai verificar: PyJWT instalado, SECRET_KEY no env.
```

```
Você: pode
```

Subagent roda, escreve o resultado. PM lê e reporta:

```
✅ task-001 concluída — preflight

O que foi feito: PyJWT 2.8.0 encontrado. SECRET_KEY presente no .env.
                 Todas as pré-condições verificadas.
Arquivos: .ai-dev/discovery/preflight-001.md

Próxima: task-002a — Criar modelo User (claude-code · sonnet)
Pode prosseguir?
```

E assim por diante — uma task por vez, você no controle do ritmo.

---

## Comandos úteis no chat

| O que dizer | O que acontece |
|-------------|----------------|
| "qual o status do projeto?" | PM mostra dashboard completo |
| "pausa aqui" | PM para, aguarda próxima instrução |
| "pula para task-004" | PM verifica dependências e adverte se bloqueada |
| "task-003 vai pro copilot com effort high" | PM atualiza o arquivo da task |
| "adiciona uma task para documentar a API" | PM cria nova task, insere no plano, atualiza dependências |
| "o que a task-002 mudou exatamente?" | PM lê e resume o delivery report |

---

## Próximos passos

- [overview.md](overview.md) — arquitetura completa do sistema
- [copilot-plugin.md](copilot-plugin.md) — como o plugin Copilot funciona, todos os comandos
- [databricks-example.md](databricks-example.md) — exemplo com Databricks Asset Bundle
