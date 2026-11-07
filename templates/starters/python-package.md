# Project Context — Python Package

> Starter pré-preenchido para projetos Python (library, CLI, serviço).
> Revise e complete as seções marcadas com [TODO].

---

## Objetivo do projeto

[TODO: o que este pacote faz, quem usa, qual problema resolve]

## Stack

- **Python:** [TODO: ex: 3.11]
- **Framework:** [TODO: FastAPI | Flask | nenhum | etc.]
- **Database:** [TODO: PostgreSQL | SQLite | nenhum | etc.]
- **Gerenciador de pacotes:** uv | pip | poetry
- **Test runner:** pytest
- **Linter / formatter:** ruff | black | flake8

## Estrutura do repositório

```
/
├── src/
│   └── [package_name]/      # Código fonte principal
├── tests/                   # Testes (pytest)
├── pyproject.toml           # Config do projeto e dependências
├── .env.example             # Variáveis de ambiente necessárias (sem valores)
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
| - | [TODO] | [TODO] | - | - |

## Convenções de código

- Imports organizados: stdlib → third-party → local
- Type hints obrigatórios em funções públicas
- [TODO: outras convenções]

## Restrições

- [TODO: ex: manter compatibilidade com Python 3.10+]
- [TODO: ex: não usar dependências sem licença MIT/Apache]

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
| [TODO] | env var: `[VAR_NAME]` | `os.environ["VAR_NAME"]` |

## Ambiente de desenvolvimento

- **Instalar deps:** `uv sync` ou `pip install -e ".[dev]"`
- **Rodar testes:** `pytest tests/`
- **Rodar linter:** `ruff check src/`
- **Variáveis de ambiente:** copiar `.env.example` → `.env`

## Links úteis

- Repo:
- Issue tracker:
- Docs:
- CI/CD:
