# Project Context

> This file is the single source of truth for the project briefing.
> Agents read this before starting any task. Keep it accurate and concise.

---

## Objetivo do projeto

[What this project does, why it exists, and what problem it solves]

## Stack

- **Language:**
- **Framework / Runtime:**
- **Database:**
- **Infrastructure / Cloud:**
- **Key libraries:**

## Estrutura do repositório

[Brief description of the main directories and what lives in each]

```
/
├── src/          # [what's here]
├── tests/        # [what's here]
└── ...
```

### Onde procurar

<!-- Mapa do código: perguntas de quem chega e onde está a resposta. Caminhos em backticks —
     `aidev map --check` avisa quando um caminho deixa de existir. Inventário automático em
     `discovery/inventory.md` (`aidev map`). -->

| Pergunta | Resposta |
|----------|----------|
| [Onde ficam os entrypoints?] | [`path/`] |

## Decisões de arquitetura

[Key architectural decisions already made. Be specific — agents use this to avoid contradicting existing patterns.]

| Data | Decisão | Justificativa | Alternativas rejeitadas | Origem |
|------|---------|---------------|-------------------------|--------|
| - | [e.g., usar FastAPI em vez de Django] | [motivo] | - | - |

## Convenções de código

[Naming conventions, file organization rules, patterns to follow or avoid]

## Restrições

[Technical constraints, compliance requirements, things agents must NOT do]

## Ambiente de desenvolvimento

- **Python version / Node version / etc:**
- **Como rodar localmente:**
- **Como rodar os testes:**
- **Variáveis de ambiente necessárias:** (nomes apenas, sem valores)

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

<!-- Liste APENAS nomes de variáveis de ambiente ou paths de arquivos de config.
     NUNCA coloque valores aqui — este arquivo é auditável mas não deve conter segredos.
     Subagentes lêem esta seção para saber onde buscar credenciais antes de executar. -->

| Credencial | Fonte | Como usar |
|------------|-------|-----------|
| Databricks token | `~/.databrickscfg` → profile: `prod` | `--profile prod` no CLI |
| AWS credentials | `~/.aws/credentials` → profile: `default` | env: `AWS_PROFILE` |
| API key serviço X | env var: `SERVICE_X_API_KEY` | ler via `os.environ` |

> Antes de qualquer task de deployment, o subagent deve verificar que as credenciais listadas
> aqui estão disponíveis. Se não estiver, parar e reportar ao PM — não tentar executar.

## Links úteis

- Repo:
- Issue tracker:
- Docs:
- CI/CD:
