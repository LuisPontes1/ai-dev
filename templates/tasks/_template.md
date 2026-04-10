# Task XXX — [Título]

Status: pending
<!-- pending | in-progress | done | blocked -->

Type: preflight | discovery | implementation | deployment | verification
<!-- preflight    → verifica pré-condições antes de deployment (auth, targets, vars)
     discovery    → explora recursos externos, escreve findings em arquivo
     implementation → cria ou modifica código/config
     deployment  → executa, publica, roda jobs
     verification → valida resultado, gera relatório -->

Created: YYYY-MM-DD
Updated: YYYY-MM-DD

---

## Atomicidade

<!-- Preencha antes de criar a task. Se qualquer resposta for "não", quebre em subtasks. -->

- [ ] Esta task tem **exatamente um objetivo** (sem "e também", sem "além disso")
- [ ] Os outputs são **completamente enumeráveis** antes de começar
- [ ] É **verificável de forma independente** — sem depender de outra task incompleta
- [ ] Cabe em **uma sessão de agente** sem interrupção de raciocínio
- [ ] Um rollback parcial é **possível ou irrelevante** (falha não deixa o repo num estado inválido)

---

## Objetivo

[Uma única frase que descreve o que será feito. Se precisar de "e" para conectar dois objetivos, quebre a task.]

---

## Contexto necessário

<!-- Agente lê estes arquivos antes de começar. Tudo que o agente precisa saber está listado aqui.
     Nunca passar contexto via chat ou linha de comando. -->

- `.ai-dev/context.md` — seções: [e.g., stack, arquitetura]
- `[path/to/relevant/file]` — [por que é necessário]

---

## Inputs

<!-- Arquivos que o agente lê para entender o estado atual antes de fazer mudanças. -->

- `path/to/input/file.ext` — [o que contém]

---

## Outputs esperados

<!-- Arquivos que serão criados ou modificados. O agente não toca em nada fora desta lista. -->

- `path/to/output/file.ext` — [create | modify | delete — descrição da mudança]

---

## Executor

- **Agente:** `claude-code` | `copilot` | `manual`

<!-- Se claude-code: -->
- **Modelo (Claude):** `opus` | `sonnet` | `haiku`

<!-- Se copilot — especifique modelo E effort: -->
- **Modelo (Copilot):** `gpt-5.4` | `codex` | `gemini`
- **Effort:** `high` | `medium` | `low` | `minimal`
  <!-- high   → lógica complexa, múltiplos arquivos, raciocínio arquitetural
       medium → tasks padrão, complexidade moderada
       low    → mudanças simples, boilerplate
       minimal→ geração mecânica, sem raciocínio necessário -->

- **Session ID:** *(preenchido ao iniciar)*

---

## Dependências

- Requer: `task-000` (status: done)
- Bloqueia: `task-002`, `task-003`

---

## Critério de aceite

<!-- Verificável sem ambiguidade. Cada item deve ser checável de forma independente. -->

- [ ] [critério específico e testável]
- [ ] [critério específico e testável]
- [ ] Testes existentes ainda passam

---

## Rollback

<!-- Preencher para tasks do tipo deployment ou implementation com efeitos colaterais.
     Se a task falhar no meio, o subagent executa estes passos antes de escrever o relatório de falha.
     Se não aplicável (ex: task só lê ou cria arquivos novos), escreva "Não aplicável". -->

- [passo de reversão 1 — ex: databricks bundle destroy --target dev]
- [passo de reversão 2 — ex: restaurar arquivo X da versão anterior]

---

## Notas

[Restrições, edge cases, decisões já tomadas que o agente deve respeitar]
