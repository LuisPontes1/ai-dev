# Project Context — Databricks Asset Bundle

> Starter pré-preenchido para projetos Databricks com Asset Bundles.
> Revise e complete as seções marcadas com [TODO].

---

## Objetivo do projeto

[TODO: descreva o que este bundle faz e qual problema resolve]

## Stack

- **Plataforma:** Databricks
- **Workspace:** [TODO: ex: adb-xxxxxxxxxxxxxxxx.azuredatabricks.net]
- **Catalog:** [TODO: ex: prod_catalog]
- **Schema principal:** [TODO: ex: customer_data]
- **Runtime:** [TODO: ex: DBR 15.4 LTS ML]
- **Cluster policy:** [TODO: ex: job-clusters-only]
- **Linguagem notebooks:** Python | SQL | ambos

## Estrutura do bundle

```
/
├── databricks.yml           # Bundle root config
├── resources/
│   └── jobs/                # Job definitions (.yml)
├── notebooks/               # Notebooks Python/SQL
├── src/                     # Código Python reutilizável (opcional)
└── .ai-dev/                 # Planejamento (gitignored)
```

## Targets

| Target | Workspace | Uso |
|--------|-----------|-----|
| `dev` | [TODO] | Desenvolvimento e testes |
| `prod` | [TODO] | Produção |

## Decisões de arquitetura

| Decisão | Justificativa |
|---------|---------------|
| Usar Unity Catalog | Governança centralizada |
| [TODO] | [TODO] |

## Restrições

- Não criar tabelas diretamente no schema `prod` — usar target `dev` para testes
- [TODO: outras restrições]

## Credenciais

| Credencial | Fonte | Como usar |
|------------|-------|-----------|
| Databricks token | `~/.databrickscfg` → profile: `[TODO: nome do profile]` | `--profile [profile]` no CLI |

## Ambiente de desenvolvimento

- **Databricks CLI:** `databricks --version` deve retornar 0.x ou superior
- **Autenticação:** `databricks auth status --profile [profile]`
- **Validar bundle:** `databricks bundle validate`
- **Deploy dev:** `databricks bundle deploy --target dev --profile [profile]`
- **Run job:** `databricks bundle run [job-name] --target dev --profile [profile]`

## Links úteis

- Workspace:
- Docs Asset Bundles: https://docs.databricks.com/dev-tools/bundles/index.html
- Issue tracker:
