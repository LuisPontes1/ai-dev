// session.mjs — session state that must survive compaction and session boundaries.
//
// Lives in .ai-dev/ with everything else:
//   plan.md + tasks/         what was agreed and where each task stands
//   session-log.md           append-only history of what the PM did
//   handoff.md               the LIVE state: "Estado (PM)" written by the PM (aidev handoff set),
//                            "Snapshot automático" + "Último resumo de compactação" written by hooks
//
// Compaction protocol (hooks installed by install.sh):
//   PreCompact   → checkpoint() writes the snapshot, logs it, and prints instructions telling the
//                  summarizer what it must keep (role, persona, focus, pending approvals, user's words)
//   PostCompact  → stores the summary and records anything essential it dropped
//   SessionStart(compact) → restoreBlock() puts identity, persona, protocols to re-read and the
//                  handoff back at the top of the context, before the knowledge brief

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { aidevHome, projectPaths } from "./memory.mjs";

const read = (f) => {
  try {
    return fs.readFileSync(f, "utf8");
  } catch {
    return "";
  }
};

export const handoffPath = (root) => path.join(root, ".ai-dev", "handoff.md");
const stamp = (now = new Date()) => now.toISOString().replace("T", " ").slice(0, 16);
const empty = (v) => !v || /^(-|none|nenhum[a]?|n\/a|—)$/i.test(String(v).trim());

// ── Plan and tasks ────────────────────────────────────────────────────────

export function readTasks(root) {
  const dir = path.join(root, ".ai-dev", "tasks");
  let names = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((n) => /^task-[\w-]+\.md$/.test(n) && !/-(prompt|questions|instructions)\.md$/.test(n))
    .sort()
    .map((n) => {
      const text = read(path.join(dir, n));
      const field = (re) => ((text.match(re) || [])[1] || "").trim();
      return {
        id: n.replace(/\.md$/, ""),
        title: field(/^#\s*Task\s*[\w-]*\s*[—-]\s*(.+)$/m) || field(/^#\s*(.+)$/m),
        status: field(/^Status:\s*([\w-]+)/m) || "pending",
        type: field(/^Type:\s*([\w-]+)/m),
        persona: field(/\*\*Persona:\*\*\s*`?([\w-]+)`?/),
        executor: field(/\*\*Agente:\*\*\s*`?([\w-]+)`?/),
      };
    });
}

export function planSummary(root) {
  const plan = read(projectPaths(root).plan);
  const status = (plan.match(/^Status:\s*(\S+)/m) || [])[1];
  const tasks = readTasks(root);
  if (!status && !tasks.length) return "";
  const by = (s) => tasks.filter((t) => t.status === s);
  const fmt = (t) => `${t.id} — ${t.title}${t.executor ? ` (${t.executor}${!empty(t.persona) ? ` · persona ${t.persona}` : ""})` : ""}`;
  const lines = [`Plan: ${status || "?"} · ${tasks.length} tasks: ${["done", "in-progress", "pending", "failed", "blocked"].map((s) => `${by(s).length} ${s}`).join(", ")}`];
  for (const t of by("in-progress")) lines.push(`  🔄 running : ${fmt(t)}`);
  for (const t of [...by("failed"), ...by("blocked")]) lines.push(`  🚫 ${t.status.padEnd(8)}: ${fmt(t)}`);
  const next = by("pending")[0];
  if (next) lines.push(`  🔜 next    : ${fmt(next)}`);
  return lines.join("\n");
}

// Session-log entries: data rows of its table or "[timestamp] …" lines; template examples skipped.
export function sessionLogTail(root, n = 6) {
  const text = read(projectPaths(root).sessionLog).replace(/<!--[\s\S]*?-->/g, "");
  const entries = text.split("\n").filter((l) => {
    const t = l.trim();
    if (/YYYY-MM-DD/.test(t)) return false;
    if (/^\[\d{4}-\d{2}-\d{2}/.test(t)) return true;
    return /^\|\s*\d{4}-\d{2}-\d{2}/.test(t);
  });
  return entries.slice(-n).join("\n");
}

// ── Handoff ───────────────────────────────────────────────────────────────

export const HANDOFF_FIELDS = [
  ["modo", "Modo"],
  ["foco", "Foco"],
  ["fazendo", "Fazendo"],
  ["proximo", "Próximo passo"],
  ["aguardando", "Aguardando usuário"],
  ["persona", "Persona ativa"],
  ["decisoes", "Decisões desta sessão"],
  ["notas", "Notas"],
];

const HANDOFF_TEMPLATE = `# Handoff

> Estado vivo do trabalho. Lido no início de toda sessão e devolvido ao contexto depois de toda compactação.
> "Estado (PM)" é do PM — \`aidev handoff set --campo "…"\`. As outras seções são escritas pelos hooks.

## Estado (PM)

- **Atualizado:** -
${HANDOFF_FIELDS.map(([, label]) => `- **${label}:** -`).join("\n")}
`;

export function replaceSection(text, heading, body) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  const block = [`## ${heading}`, "", body.trim(), ""];
  if (start < 0) return `${text.replace(/\n*$/, "\n\n")}${block.join("\n")}`;
  let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  if (end < 0) end = lines.length;
  lines.splice(start, end - start, ...block);
  return lines.join("\n");
}

export function sectionOf(text, heading) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start < 0) return "";
  let end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  if (end < 0) end = lines.length;
  return lines.slice(start + 1, end).join("\n").trim();
}

export function readHandoff(root) {
  const text = read(handoffPath(root));
  const state = {};
  for (const [key, label] of [["atualizado", "Atualizado"], ...HANDOFF_FIELDS]) {
    const m = sectionOf(text, "Estado (PM)").match(new RegExp(`^- \\*\\*${label}:\\*\\*[ \\t]*(.*)$`, "m"));
    state[key] = m ? m[1].trim() : "";
  }
  return { text, state };
}

export function setHandoff(root, values, now = new Date()) {
  const file = handoffPath(root);
  if (!fs.existsSync(path.dirname(file))) throw new Error("No .ai-dev/ — run /ai-dev-init first");
  const unknown = Object.keys(values).filter((k) => !HANDOFF_FIELDS.some(([f]) => f === k));
  if (unknown.length) throw new Error(`handoff set: unknown field(s) ${unknown.join(", ")} — use ${HANDOFF_FIELDS.map(([f]) => `--${f}`).join(" ")}`);
  let text = read(file) || HANDOFF_TEMPLATE;
  let estado = sectionOf(text, "Estado (PM)") || sectionOf(HANDOFF_TEMPLATE, "Estado (PM)");
  const put = (label, value) => {
    const line = `- **${label}:** ${String(value).replace(/\s*\n\s*/g, " ").trim() || "-"}`;
    const re = new RegExp(`^- \\*\\*${label}:\\*\\*.*$`, "m");
    estado = re.test(estado) ? estado.replace(re, () => line) : `${estado}\n${line}`;
  };
  put("Atualizado", stamp(now));
  for (const [key, label] of HANDOFF_FIELDS) if (values[key] !== undefined) put(label, values[key]);
  text = replaceSection(text, "Estado (PM)", estado);
  fs.writeFileSync(file, text.endsWith("\n") ? text : `${text}\n`);
  return readHandoff(root).state;
}

// ── Transcript ────────────────────────────────────────────────────────────

const NOISE = /^\s*(<(system-reminder|command-|local-command|bash-|task-notification)|Caveat:|\[Request interrupted)/;

export function transcriptDigest(file, { maxBytes = 4 * 1024 * 1024, userMessages = 6 } = {}) {
  const out = { user: [], protocols: [], skills: [] };
  if (!file || !fs.existsSync(file)) return out;
  let text;
  try {
    const size = fs.statSync(file).size;
    const fd = fs.openSync(file, "r");
    const len = Math.min(size, maxBytes);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, size - len);
    fs.closeSync(fd);
    text = buf.toString("utf8");
  } catch {
    return out;
  }
  const protocols = new Set();
  const skills = new Set();
  const users = [];
  for (const line of text.split("\n")) {
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      continue; // first line may be cut by the byte window
    }
    const content = e?.message?.content;
    if (e.type === "user" && !e.isMeta) {
      const texts = typeof content === "string" ? [content] : Array.isArray(content) ? content.filter((b) => b.type === "text").map((b) => b.text) : [];
      for (const t of texts) if (t && t.trim() && !NOISE.test(t)) users.push(t.trim());
    }
    if (e.type === "assistant" && Array.isArray(content)) {
      for (const b of content) {
        if (b.type !== "tool_use") continue;
        const fp = String(b.input?.file_path || "");
        if (b.name === "Read" && /[/\\]\.claude[/\\]ai-dev[/\\]/.test(fp)) protocols.add(fp.replace(/^.*[/\\]\.claude[/\\]/, "~/.claude/"));
        if (b.name === "Skill" && b.input?.skill) skills.add(String(b.input.skill));
      }
    }
  }
  out.user = users.slice(-userMessages).map((t) => (t.length > 500 ? `${t.slice(0, 500)}…` : t));
  out.protocols = [...protocols];
  out.skills = [...skills];
  return out;
}

// ── Snapshot / checkpoint ─────────────────────────────────────────────────

function gitInfo(root) {
  const git = (...a) => execFileSync("git", ["-C", root, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  try {
    const branch = git("rev-parse", "--abbrev-ref", "HEAD");
    const head = git("log", "-1", "--format=%h %s");
    const dirty = git("status", "--porcelain").split("\n").filter(Boolean);
    return `${branch} @ ${head}${dirty.length ? ` · ${dirty.length} uncommitted: ${dirty.slice(0, 8).map((l) => l.slice(3)).join(", ")}${dirty.length > 8 ? ", …" : ""}` : " · clean"}`;
  } catch {
    return "";
  }
}

// The project's perennial persona: .ai-dev/persona.md. Always active in that project —
// it is who the assistant is there, restored at every start, resume, /clear and compaction.
export const PROJECT_PERSONA_BUDGET = 3000;

export function projectPersona(root) {
  const file = path.join(root, ".ai-dev", "persona.md");
  const text = read(file).replace(/<!--[\s\S]*?-->/g, "").trim();
  if (!text) return null;
  const name = ((text.match(/^#\s+(?:Persona:\s*)?(.+)$/m) || [])[1] || "persona do projeto").trim();
  // "Inegociáveis" (or "Nunca") is what subagents also need to honour.
  const rules = (text.match(/^##\s+(?:Inegoci[aá]veis|Regras inegoci[aá]veis|Nunca)[^\n]*\n([\s\S]*?)(?=^##\s|$(?![\s\S]))/m) || [])[1] || "";
  return { name, text, rules: rules.trim(), file };
}

// Named persona: project's .ai-dev/personas/<name>.md wins over the global ~/.claude/ai-dev/personas/<name>.md.
export function personaText(root, name) {
  return read(path.join(root, ".ai-dev", "personas", `${name}.md`)) || read(path.join(aidevHome(), "personas", `${name}.md`));
}

export function activePersona(root) {
  const { state } = readHandoff(root);
  let name = empty(state.persona) ? "" : state.persona.replace(/[`*]/g, "").split(/[\s(—-]/)[0];
  let task = "";
  if (!name) {
    const running = readTasks(root).find((t) => t.status === "in-progress" && !empty(t.persona));
    if (running) {
      name = running.persona;
      task = running.id;
    }
  }
  if (!name) return null;
  return { name, task, text: personaText(root, name) };
}

export function checkpoint(root, { trigger = "manual", transcriptPath = null, now = new Date() } = {}) {
  const t = transcriptDigest(transcriptPath);
  const persona = activePersona(root);
  const harness = path.join(root, ".ai-dev", "harness", "features.json");
  const snap = [
    `- **Gerado:** ${stamp(now)} (${trigger})`,
    gitInfo(root) && `- **Git:** ${gitInfo(root)}`,
    projectPersona(root) && `- **Persona do projeto:** ${projectPersona(root).name} (\`.ai-dev/persona.md\`)`,
    persona && `- **Persona ativa:** ${persona.name}${persona.task ? ` (${persona.task})` : ""}`,
    t.protocols.length && `- **Protocolos carregados (reler antes de agir):** ${t.protocols.map((p) => `\`${p}\``).join(", ")}`,
    t.skills.length && `- **Skills usadas:** ${t.skills.join(", ")}`,
    fs.existsSync(harness) && "- **Modo harness ativo:** ver `aidev status` e `harness/progress.md`",
    "",
    "**Plano:**",
    "```",
    planSummary(root) || "(sem plano)",
    "```",
    sessionLogTail(root) && `**Session log (últimas entradas):**\n${sessionLogTail(root)}`,
    t.user.length && `**Últimas mensagens do usuário (literal):**\n${t.user.map((u) => `> ${u.replace(/\n/g, "\n> ")}`).join("\n\n")}`,
  ].filter((x) => x !== false && x !== "" && x !== null && x !== undefined).join("\n");
  const file = handoffPath(root);
  const text = replaceSection(read(file) || HANDOFF_TEMPLATE, "Snapshot automático", snap);
  fs.writeFileSync(file, text.endsWith("\n") ? text : `${text}\n`);
  appendSessionLog(root, `Compaction (${trigger}) — checkpoint saved to handoff.md.`, now);
  return { digest: t, persona };
}

export function appendSessionLog(root, event, now = new Date()) {
  const file = projectPaths(root).sessionLog;
  if (!fs.existsSync(path.dirname(file))) return;
  const text = read(file);
  const row = /\|\s*Timestamp\s*\|\s*Event\s*\|/i.test(text) ? `| ${stamp(now)} | ${event} |` : `[${stamp(now)}] ${event}`;
  // Keep the row inside the log's table: insert after its last table row, not after trailing comments.
  const lines = text.split("\n");
  let at = -1;
  lines.forEach((l, i) => {
    if (/^\|/.test(l.trim())) at = i;
  });
  if (row.startsWith("|") && at >= 0) lines.splice(at + 1, 0, row);
  else lines.push(row);
  fs.writeFileSync(file, lines.join("\n").replace(/\n*$/, "\n"));
}

// ── Compaction instructions (PreCompact stdout → the summarizer) ─────────

export function compactionInstructions(root, { digest, persona } = {}) {
  const { state } = readHandoff(root);
  const plan = planSummary(root);
  const lines = [
    "This conversation runs the ai-dev system (planning-first; the assistant is the Project Manager, subagents execute).",
    "The summary MUST preserve, explicitly and near the top:",
    "1. ROLE: the assistant is the ai-dev PM — orchestrates, never executes tasks inline; context comes from .ai-dev/ files; nothing runs without plan approval and per-task user confirmation (except inside an approved /ai-dev-loop budget).",
    `2. FOCUS: the exact task/feature in progress and the step within it${!empty(state.foco) ? ` (handoff says: ${state.foco})` : ""}.`,
    `3. PERSONA: ${projectPersona(root) ? `in this project the assistant works as "${projectPersona(root).name}" (.ai-dev/persona.md) — say so explicitly; ` : ""}the active specialist persona and for which task${persona ? ` (currently: ${persona.name}${persona.task ? ` on ${persona.task}` : ""})` : " (none active)"}.`,
    "4. APPROVALS: what the user explicitly approved and what is still awaiting the user — never turn a pending question into an approval.",
    "5. USER'S WORDS: the user's latest instructions and preferences, quoted verbatim when short.",
    "6. DECISIONS made this session that are not yet written to .ai-dev/context.md, with their reasons.",
    "7. FILES: files changed and whether they are committed; any subagent or background job still running (ids).",
    `8. PROTOCOLS: which ai-dev protocol files and skills were loaded${digest?.protocols?.length ? ` (${digest.protocols.join(", ")})` : ""} — they must be re-read after compaction.`,
    "End the summary with: \"After compaction: read .ai-dev/handoff.md, re-read the protocols listed, then continue.\"",
  ];
  if (plan) lines.push("", "Current plan state (from .ai-dev):", plan);
  if (!empty(state.aguardando)) lines.push("", `Awaiting the user (from handoff): ${state.aguardando}`);
  return lines.join("\n");
}

// After compaction: store the summary and flag what it dropped.
export function recordSummary(root, summary, { now = new Date() } = {}) {
  const { state } = readHandoff(root);
  const persona = activePersona(root);
  const must = [
    ["ai-dev / PM role", /ai-dev|\bPM\b|project manager/i],
    !empty(state.foco) && [`focus "${state.foco}"`, new RegExp(String(state.foco).split(/\s+/)[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")],
    persona && [`persona "${persona.name}"`, new RegExp(persona.name, "i")],
    projectPersona(root) && [`persona do projeto "${projectPersona(root).name}"`, new RegExp(projectPersona(root).name.split(/\s+/)[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")],
  ].filter(Boolean);
  const missing = must.filter(([, re]) => !re.test(summary || "")).map(([label]) => label);
  const body = [
    `- **Em:** ${stamp(now)}`,
    missing.length ? `- **⚠️ O resumo perdeu:** ${missing.join(", ")} — restaurado pelo hook de início de sessão a partir deste arquivo.` : "- **Verificação:** papel, foco e persona preservados no resumo.",
    "",
    String(summary || "(vazio)").trim().slice(0, 6000),
  ].join("\n");
  const file = handoffPath(root);
  fs.writeFileSync(file, replaceSection(read(file) || HANDOFF_TEMPLATE, "Último resumo de compactação", body).replace(/\n*$/, "\n"));
  appendSessionLog(root, `Compaction summary stored${missing.length ? ` — missing: ${missing.join(", ")}` : ""}.`, now);
  return { missing };
}

// ── Restore (SessionStart) ────────────────────────────────────────────────

export function restoreBlock(root, source) {
  const { text, state } = readHandoff(root);
  const persona = activePersona(root);
  const snapshot = sectionOf(text, "Snapshot automático");
  const protocols = (snapshot.match(/Protocolos carregados[^:]*:\*\*\s*(.*)$/m) || [])[1];
  const lost = (sectionOf(text, "Último resumo de compactação").match(/O resumo perdeu:\*\*\s*(.*?)(?:\s+—\s+restaurado.*)?$/m) || [])[1];
  const parts = [];

  if (source === "compact" || source === "resume" || source === "clear") {
    parts.push([
      `### ⚙️ Restauração (${source}) — você é o PM do ai-dev`,
      "- ai-dev está ON neste projeto. Você orquestra; subagentes executam. Nunca execute tasks inline.",
      "- Contexto vem de `.ai-dev/`, não do chat. Nada executa sem `plan.md` aprovado e confirmação do usuário por task (exceto dentro de um `/ai-dev-loop` aprovado).",
      "- Regras completas: seção AI-Dev do `~/CLAUDE.md`. Atualize o handoff com `aidev handoff set` a cada marco.",
      protocols ? `- **Releia antes de agir:** ${protocols}` : "",
      lost ? `- ⚠️ A compactação perdeu: ${lost} — confie neste bloco e no handoff, não no resumo.` : "",
    ].filter(Boolean).join("\n"));
  }

  const pp = projectPersona(root);
  if (pp) {
    const body = pp.text.length > PROJECT_PERSONA_BUDGET ? `${pp.text.slice(0, PROJECT_PERSONA_BUDGET)}\n… (continua em .ai-dev/persona.md — leia o arquivo inteiro)` : pp.text;
    parts.push([`### 🧭 Persona do projeto — você trabalha como: ${pp.name}`, "(Fonte: `.ai-dev/persona.md`. Vale a sessão inteira, para toda tarefa deste projeto.)", "", body.replace(/^#\s+.*\n?/, "").trim()].join("\n"));
  }

  const estado = HANDOFF_FIELDS.filter(([k]) => !empty(state[k])).map(([k, label]) => `- **${label}:** ${state[k]}`);
  if (estado.length) parts.push([`### Handoff (.ai-dev/handoff.md — ${state.atualizado || "?"})`, ...estado].join("\n"));

  if (persona && persona.text && source !== "startup") {
    parts.push([`### Persona ativa: ${persona.name}${persona.task ? ` (${persona.task})` : ""}`, persona.text.trim().slice(0, 1800)].join("\n"));
  } else if (persona) {
    parts.push(`### Persona ativa: ${persona.name}${persona.task ? ` (${persona.task})` : ""} — ~/.claude/ai-dev/personas/${persona.name}.md`);
  }

  const plan = planSummary(root);
  if (plan) parts.push(["### Plano (.ai-dev/plan.md + tasks/)", "```", plan, "```"].join("\n"));
  const log = sessionLogTail(root, source === "startup" ? 5 : 8);
  if (log) parts.push(["### Session log (últimas entradas)", log].join("\n"));

  if (source === "compact") {
    const users = (snapshot.split("**Últimas mensagens do usuário (literal):**")[1] || "").trim();
    if (users) parts.push(["### Últimas mensagens do usuário antes da compactação", users.slice(0, 1500)].join("\n"));
  }
  return parts.join("\n\n");
}
