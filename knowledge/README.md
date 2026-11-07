# ai-dev — conhecimento geral

Conhecimento que vale para **todos os projetos**: suas preferências, manias de ferramentas e plataformas,
gotchas que aparecem em qualquer repo. Vive aqui, no repo ai-dev, versionado — vai junto para toda máquina
e toda sessão na nuvem que usar o ai-dev.

| Arquivo | Escrito com | Conteúdo |
|---------|-------------|----------|
| `learnings.md` | `aidev learn note --global` | lições curtas, com "Aplica-se a" (ex.: `databricks`, `python`, `all`) |
| `gotchas.md` | `aidev learn gotcha --global` | sintoma → causa → correção, entre projetos |

- `install.sh` aponta o ai-dev para esta pasta (`~/.claude/ai-dev/knowledge-dir`), então os comandos gravam direto no clone.
- `aidev sync` faz commit desta pasta, `pull --rebase` e `push` — o PM pergunta antes de rodar.
- O hook de início de sessão injeta só as linhas relevantes: "Aplica-se a" vazio/`all`, ou com uma palavra
  que aparece no `.ai-dev/context.md` do projeto atual.
- Conhecimento de **um** projeto não vem para cá — fica no `.ai-dev/context.md` dele.
- Nunca grave valores de segredos — só nomes.
