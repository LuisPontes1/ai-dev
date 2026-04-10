# ai-dev

> Um sistema de desenvolvimento planning-first para Claude Code + GitHub Copilot.  
> Você só fala com o chat. Os agentes trabalham.

---

## O problema que isso resolve

Quando você abre um repo e começa a pedir coisas ao Claude Code, o contexto fica no chat, as decisões ficam implícitas, e quando você reabre a sessão no dia seguinte não tem como saber o que foi planejado, o que foi executado, ou por quê. Se algo der errado no meio do caminho, não tem rollback, não tem auditoria.

`ai-dev` resolve isso com uma pasta `.ai-dev/` que vive em cada projeto (fora do versionamento). Ela define um contrato claro:

- **Você só interage via chat** — nunca abre arquivo, nunca roda comando, nunca verifica status manualmente
- **O Claude Code atua como Project Manager** — lê o estado do projeto nos arquivos, itera o plano com você, delega execução a subagents
- **Cada task roda em subagent isolado** — recebe apenas o arquivo da task, executa, escreve o resultado em arquivo, encerra
- **Todo contexto circula via arquivos** — auditável, reproduzível, retomável

---

## Como parece na prática

Você abre um repo e diz "quero adicionar autenticação JWT". O PM responde:

```
## Project: minha-api

Plan status: draft

Não encontrei .ai-dev/ neste repo. Quer que eu inicialize o sistema de planejamento?
Vou criar a estrutura e parar para você revisar.
```

Você confirma. Ele cria `.ai-dev/context.md` preenchido com o que inferiu do projeto, e `.ai-dev/plan.md` vazio. Você revisa o contexto, descreve o que quer. O PM propõe:

```
Proposta de plano — autenticação JWT

task-001  preflight    Verificar dependências (PyJWT instalado, variáveis de env)
task-002  discovery    Mapear rotas existentes que precisam de proteção
task-003  implementation  Criar middleware de autenticação JWT   claude-code · sonnet
task-004  implementation  Proteger rotas mapeadas               copilot · gpt-5.4·medium
task-005  verification  Rodar testes e validar cobertura        claude-code · sonnet

Sequência: 001 → 002 → 003 → 004 → 005

Quer ajustar alguma task, trocar executor ou modelo antes de aprovar?
```

Você aprova. O PM executa uma task por vez, te mostra o resultado de cada uma, e pede confirmação antes de avançar.

---

## Instalação

```bash
git clone git@github.com:LuisPontes1/ai-dev.git
cd ai-dev
bash install.sh
```

Isso instala:
- `~/CLAUDE.md` — instrui o Claude Code a operar em modo planning-first em qualquer repo
- `~/.claude/commands/ai-dev-init.md` — slash command `/ai-dev-init` para inicializar novos projetos

---

## Uso

Em qualquer repo ou pasta de projeto:

1. Abra no VS Code com Claude Code ativo
2. Claude detecta que não tem `.ai-dev/` e pergunta se quer inicializar
3. Confirme → `/ai-dev-init` cria a estrutura com starter do tipo de projeto detectado
4. Revise `.ai-dev/context.md` e descreva o que quer construir
5. O PM propõe tasks — você ajusta executor, modelo, ordem
6. Aprove o plano → execução começa, uma task por vez
7. Após cada task: PM resume o que foi feito e pergunta se quer continuar

---

## Estrutura gerada em cada projeto

```
.ai-dev/                     ← gitignored, local apenas
├── context.md               ← briefing do projeto (stack, decisões, credenciais)
├── plan.md                  ← plano + gate de aprovação + changelog
├── tasks/
│   ├── _template.md         ← template com checklist de atomicidade
│   └── task-001.md          ← uma task por arquivo, autocontida
├── agents/
│   ├── assignments.md       ← task → executor + modelo + status
│   └── roles.md             ← definição dos executores
├── dependencies/
│   └── graph.md             ← DAG de dependências entre tasks
├── discovery/               ← findings de discovery e deployment tasks
└── reports/
    └── delivery-001.md      ← gerado automaticamente ao concluir cada task
```

---

## Executores suportados

| Executor | Como funciona |
|----------|---------------|
| `claude-code` | Subagent lê o arquivo da task e executa autonomamente |
| `copilot` | PM invoca o plugin Copilot diretamente — sem interação manual no VS Code |
| `manual` | PM gera arquivo de instruções — você executa e confirma |

Para o executor `copilot`, o sistema usa o plugin `copilot-plugin-cc` instalado em `~/.claude/plugins/`. Veja [docs/copilot-plugin.md](docs/copilot-plugin.md) para detalhes completos.

---

## Funciona além de repos git

`.ai-dev/` funciona em qualquer diretório — incluindo projetos Databricks Asset Bundle, pastas de estudo, pipelines sem versionamento. O `install.sh` detecta `.gitignore`, `.databricksignore`, ou cria um novo. Veja o [exemplo Databricks completo](docs/databricks-example.md).

---

## Documentação

| Doc | O que cobre |
|-----|-------------|
| [docs/quick-start.md](docs/quick-start.md) | Primeiros passos com exemplo real de sessão |
| [docs/overview.md](docs/overview.md) | Arquitetura completa, diagrama, fluxo detalhado |
| [docs/copilot-plugin.md](docs/copilot-plugin.md) | Plugin copilot-plugin-cc: comandos, modelos, flags |
| [docs/databricks-example.md](docs/databricks-example.md) | Pipeline completo no Databricks com Asset Bundle |
