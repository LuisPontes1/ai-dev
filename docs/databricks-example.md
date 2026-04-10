# Exemplo: Databricks Asset Bundle com pipeline multi-agente

Este exemplo mostra como o sistema `.ai-dev/` orquestra um estudo no Databricks usando Asset Bundles — sem repo git, com quatro agentes em sequência, cada um deixando seu output em arquivo para o próximo ler.

---

## Contexto do projeto

Pasta de trabalho: `~/estudos/databricks-churn-analysis/`  
Não é um repo git — usa `.databricksignore`.

O `install.sh` detecta isso e adiciona `.ai-dev/` ao `.databricksignore`.

---

## context.md (preenchido pelo PM após /ai-dev-init)

```markdown
# Project Context

## Objetivo do projeto
Analisar churn de clientes usando tabelas do Unity Catalog, construir um job via Asset Bundle.

## Stack
- Plataforma: Databricks (workspace: adb-xxx.azuredatabricks.net)
- Catalog: prod_catalog
- Schema: customer_data
- Runtime: DBR 15.4 LTS ML
- Cluster policy: job-clusters-only

## Databricks CLI
- Profile configurado: ~/.databrickscfg → profile: prod
- Asset Bundle target: dev (para testes), prod (para publicar)

## Restrições
- Não criar tabelas no schema prod diretamente — usar dev target
- Cluster deve usar spot instances

## Credenciais

| Credencial | Fonte | Como usar |
|------------|-------|-----------|
| Databricks token | `~/.databrickscfg` → profile: `prod` | `--profile prod` no CLI |
```

---

## plan.md (montado pelo PM, aprovado pelo usuário)

```markdown
# Project Plan

Status: approved
Approved by: lfpontes
Approved on: 2026-04-09

| ID | Título | Executor | Modelo / Effort | Tipo | Status |
|----|--------|----------|-----------------|------|--------|
| task-001 | Explorar tabelas e schema | claude-code | sonnet | discovery | pending |
| task-002 | Montar databricks.yml e job config | copilot | gpt-5.4·high | implementation | pending |
| task-003 | Preflight: validar CLI e targets | claude-code | sonnet | preflight | pending |
| task-004 | Deploy bundle e disparar job | claude-code | sonnet | deployment | pending |
| task-005 | Monitorar job e gerar relatório | claude-code | sonnet | verification | pending |
```

---

## Dependency graph

```
task-001 (discovery)
└── task-002 (implementation)
    └── task-003 (preflight)
        └── task-004 (deployment)
            └── task-005 (verification)
```

---

## Tasks em detalhe

### task-001.md — Explorar tabelas e schema

```markdown
# Task 001 — Explorar tabelas e schema

Status: pending
Type: discovery

## Objetivo
Listar as tabelas disponíveis no schema customer_data, inspecionar schemas e volumes de dados
relevantes para análise de churn, e escrever os findings em arquivo.

## Contexto necessário
- `.ai-dev/context.md` — seções: catalog, schema, profile databricks

## Inputs
- Nenhum arquivo de código — contexto vem do ambiente Databricks

## Outputs esperados
- `.ai-dev/discovery/tables-findings.md` — schemas, row counts, partições, colunas relevantes

## Executor
- Agente: claude-code
- Modelo (Claude): sonnet
- Session ID: (preenchido ao iniciar)

## Dependências
- Requer: nenhuma
- Bloqueia: task-002

## Critério de aceite
- [ ] Arquivo .ai-dev/discovery/tables-findings.md criado
- [ ] Contém: lista de tabelas, colunas de cada tabela, row count estimado
- [ ] Identifica quais tabelas têm coluna de churn label ou proxy

## Notas
Usar: databricks tables list --catalog prod_catalog --schema customer_data
      databricks tables get --full-name prod_catalog.customer_data.<table>
```

---

### task-002.md — Montar databricks.yml e job config

```markdown
# Task 002 — Montar databricks.yml e job config

Status: pending
Type: implementation

## Objetivo
Criar a estrutura do Asset Bundle com databricks.yml e a definição do job de análise de churn.

## Contexto necessário
- `.ai-dev/context.md` — seções: stack, cluster policy, targets
- `.ai-dev/discovery/tables-findings.md` — tabelas e schemas disponíveis

## Inputs
- `.ai-dev/discovery/tables-findings.md`

## Outputs esperados
- `databricks.yml` — bundle root config
- `resources/jobs/churn_analysis.yml` — job definition com tasks de notebook
- `notebooks/01_feature_engineering.py` — estrutura inicial (pode ser stub)
- `notebooks/02_model_training.py` — estrutura inicial (pode ser stub)

## Executor
- Agente: copilot
- Modelo (Copilot): gpt-5.4
- Effort: high

## Dependências
- Requer: task-001 (status: done)
- Bloqueia: task-003

## Critério de aceite
- [ ] databricks.yml válido com targets dev e prod
- [ ] Job usa cluster policy job-clusters-only com spot instances
- [ ] Job referencia as tabelas encontradas no discovery
- [ ] databricks bundle validate não retorna erros
```

---

### task-003.md — Preflight: validar CLI e targets

```markdown
# Task 003 — Preflight: validar CLI e targets

Status: pending
Type: preflight

## Objetivo
Verificar que o Databricks CLI está instalado, autenticado, e que os targets
dev e prod existem e são acessíveis antes de tentar deploy.

## Contexto necessário
- `.ai-dev/context.md` — seções: profile databricks, targets

## Inputs
- `databricks.yml`

## Outputs esperados
- `.ai-dev/discovery/preflight-003.md` — checklist com resultado de cada verificação

## Executor
- Agente: claude-code
- Modelo (Claude): sonnet

## Dependências
- Requer: task-002 (status: done)
- Bloqueia: task-004

## Critério de aceite
- [ ] Databricks CLI instalado e acessível (`databricks --version`)
- [ ] Profile `prod` autenticado (`databricks auth env --profile prod`)
- [ ] `databricks bundle validate --target dev` sem erros
- [ ] Checklist escrito em preflight-003.md

## Notas
Se qualquer check falhar, registrar qual falhou e por quê — PM decide se corrige ou para.
```

---

### task-004.md — Deploy bundle e disparar job

```markdown
# Task 004 — Deploy bundle e disparar job

Status: pending
Type: deployment

## Objetivo
Fazer deploy do Asset Bundle no target dev e disparar o job, registrando o run_id.

## Contexto necessário
- `.ai-dev/context.md` — seções: profile databricks, targets
- `.ai-dev/discovery/preflight-003.md` — resultado do preflight
- `databricks.yml`

## Inputs
- `databricks.yml`
- `resources/jobs/churn_analysis.yml`

## Outputs esperados
- `.ai-dev/discovery/job-run.md` — run_id, job_id, URL do job no workspace, timestamp

## Executor
- Agente: claude-code
- Modelo (Claude): sonnet

## Dependências
- Requer: task-003 (status: done)
- Bloqueia: task-005

## Critério de aceite
- [ ] databricks bundle deploy --target dev executado sem erros
- [ ] Job disparado via databricks bundle run churn_analysis
- [ ] .ai-dev/discovery/job-run.md criado com run_id válido

## Rollback
Se deploy falhar: `databricks bundle destroy --target dev --profile prod`
Se job falhar no start: nenhum rollback necessário — estado do workspace não muda.

## Notas
Comandos esperados:
  databricks bundle deploy --target dev --profile prod
  databricks bundle run churn_analysis --target dev --profile prod
Capturar o run_id do output e escrever em job-run.md.
```

---

### task-005.md — Monitorar job e gerar relatório

```markdown
# Task 005 — Monitorar job e gerar relatório

Status: pending
Type: verification

## Objetivo
Acompanhar a execução do job até conclusão e gerar relatório com resultado, métricas e próximos passos.

## Contexto necessário
- `.ai-dev/context.md` — seções: profile databricks
- `.ai-dev/discovery/job-run.md` — run_id e job_id

## Inputs
- `.ai-dev/discovery/job-run.md`

## Outputs esperados
- `.ai-dev/reports/delivery-005.md` — relatório de execução do job

## Executor
- Agente: claude-code
- Modelo (Claude): sonnet

## Dependências
- Requer: task-004 (status: done)
- Bloqueia: nenhuma

## Critério de aceite
- [ ] Job concluído com status SUCCEEDED ou falha documentada com causa
- [ ] Relatório contém: duração, tasks executadas, output relevante
- [ ] Se falhou: causa raiz identificada e próximos passos sugeridos

## Notas
Polling:
  databricks jobs get-run --run-id <id> --profile prod
Verificar status a cada 30s até terminal (SUCCEEDED, FAILED, CANCELLED).
```

---

## O que o PM mostra ao usuário durante o projeto

```
## Project: Databricks Churn Analysis

Plan status: approved

Tasks
  ✅ done    : task-001 — Explorar tabelas e schema
  🔄 running : task-002 — Montar databricks.yml e job config (copilot · gpt-5.4·high)
  🔜 next    : task-003 — Preflight: validar CLI e targets
  ⏳ pending : task-004 — Deploy bundle e disparar job
  ⏳ pending : task-005 — Monitorar job e gerar relatório

Next action: Aguardando subagent copilot concluir task-002.
```

---

## Por que funciona bem neste caso

1. **Não é um repo** — `.ai-dev/` vive na pasta do estudo, `.databricksignore` cuida do versionamento
2. **Discovery como task de primeira classe** — o agente explora o ambiente real e escreve o que encontrou; nada é assumido no plano
3. **Cadeia de arquivos** — cada task deixa um arquivo que é o input exato da próxima; nenhum contexto se perde entre subagents
4. **Preflight antes de deploy** — task-003 valida CLI, autenticação e targets antes de tentar deploy; falhas são baratas
5. **Rollback definido** — task-004 (deploy) tem rollback explícito; se falhar, o PM sabe o que fazer
6. **Polling de jobs** — task-005 é um loop de polling; o subagent roda, aguarda, e só escreve o relatório quando o job termina
7. **PM visível** — após cada task, o PM resume o que aconteceu e pergunta se quer continuar

---

## Padrão reutilizável

Este padrão funciona para qualquer pipeline de dados:

```
discovery    → "o que existe no ambiente"   → findings.md
implementation → "o que vamos construir"    → código / config
preflight    → "estamos prontos?"           → checklist
deployment   → "publicar e executar"        → run ID / logs
verification → "o que aconteceu"            → relatório
```
