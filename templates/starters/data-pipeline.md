# Project Context — Data Pipeline

> Starter pré-preenchido para pipelines de dados (ETL, ELT, ingestão, transformação).
> Revise e complete as seções marcadas com [TODO].

---

## Objetivo do projeto

[TODO: o que este pipeline faz — fonte dos dados, transformações, destino, frequência]

## Stack

- **Orquestrador:** [TODO: Databricks Workflows | Airflow | Prefect | etc.]
- **Transformação:** [TODO: dbt | Spark | pandas | SQL | etc.]
- **Fonte de dados:** [TODO: S3 | banco relacional | API | Kafka | etc.]
- **Destino:** [TODO: Delta Lake | Snowflake | BigQuery | etc.]
- **Linguagem:** Python | SQL | ambos

## Arquitetura de camadas

| Camada | Descrição | Localização |
|--------|-----------|-------------|
| Bronze | Dados brutos, sem transformação | [TODO: path ou schema] |
| Silver | Dados limpos e validados | [TODO: path ou schema] |
| Gold | Dados agregados para consumo | [TODO: path ou schema] |

## Estrutura do projeto

```
/
├── pipelines/               # Definições dos pipelines / DAGs
├── transformations/         # Lógica de transformação (dbt models ou scripts)
├── schemas/                 # Schemas esperados de entrada e saída
├── tests/                   # Testes de qualidade de dados
└── .ai-dev/                 # Planejamento (gitignored)
```

### Onde procurar

<!-- Mapa do código: perguntas de quem chega e onde está a resposta. Caminhos em backticks —
     `aidev map --check` avisa quando um caminho deixa de existir. Inventário automático em
     `discovery/inventory.md` (`aidev map`). -->

| Pergunta | Resposta |
|----------|----------|
| [Onde ficam os entrypoints?] | [`path/`] |

## Decisões de arquitetura

| Data | Decisão | Justificativa | Alternativas rejeitadas | Origem |
|------|---------|---------------|-------------------------|--------|
| - | Medallion architecture (bronze/silver/gold) | [TODO] | - | - |
| - | [TODO] | [TODO] | - | - |

## Restrições

- [TODO: ex: dados PII não podem sair da região eu-west-1]
- [TODO: ex: SLA de entrega: dados disponíveis até 08h UTC]
- [TODO: ex: não deletar dados na camada bronze — apenas append]

## Qualidade de dados

- Schema validation: [TODO: Great Expectations | dbt tests | manual]
- Alertas de falha: [TODO: email | Slack | PagerDuty]
- Estratégia de reprocessamento: [TODO: full reload | incremental | partição específica]

## Invariantes

<!-- Regras que, se quebradas, causam bug em outro lugar. Cite o arquivo que as garante (em backticks). -->

- [ex.: toda escrita passa por `src/db/tx.py`]

## Gotchas

<!-- Sintoma → causa → correção, para o que custou >10 min. Escrito com `aidev learn gotcha`.
     O hook de início de sessão injeta as últimas linhas em toda sessão. -->

| Sintoma | Causa | Correção | Origem |
|---------|-------|----------|--------|

## Aprendizados

<!-- Lições do projeto que não cabem em decisão nem gotcha. Escrito com `aidev learn note`.
     Lição que vale para outros projetos → `aidev learn note --global` (vai para o repo ai-dev). -->

| Data | Aprendizado | Aplica-se a | Origem |
|------|-------------|-------------|--------|

## Credenciais

| Credencial | Fonte | Como usar |
|------------|-------|-----------|
| Source DB | env var: `SOURCE_DB_URL` | connection string |
| Cloud storage | `~/.aws/credentials` ou env vars | AWS SDK / CLI |
| [TODO] | [TODO] | [TODO] |

## Ambiente de desenvolvimento

- **Rodar pipeline local:** [TODO]
- **Rodar testes:** [TODO]
- **Validar schemas:** [TODO]

## Links úteis

- Repo:
- Issue tracker:
- Dashboard de monitoramento:
- Runbook de incidentes:
