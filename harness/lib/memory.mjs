// memory.mjs — knowledge that survives sessions and gets used every time.
//
// No parallel store: knowledge lives where ai-dev already keeps it.
//
//   Project (.ai-dev/, local to the project)
//     context.md        single source of truth — map (Estrutura do repositório), Decisões de arquitetura,
//                       Invariantes, Gotchas, Aprendizados, Restrições
//     discovery/        findings, incl. inventory.md written by `aidev map`
//     reports/          delivery reports — "## Conhecimento" of each task
//     plan.md · session-log.md · harness/progress.md
//
//   General (the ai-dev repo itself, versioned, shared by every project and machine)
//     <ai-dev repo>/knowledge/learnings.md · gotchas.md
//     located via $AIDEV_KNOWLEDGE_DIR, or ~/.claude/ai-dev/knowledge-dir (written by install.sh)
//
// Verbs: brief (auto-injected by the SessionStart hook) · recall (search) · learn (append one row)

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function aidevHome() {
  return process.env.AIDEV_HOME || path.join(os.homedir(), ".claude", "ai-dev");
}

export function globalKnowledgeDir() {
  if (process.env.AIDEV_KNOWLEDGE_DIR) return process.env.AIDEV_KNOWLEDGE_DIR;
  const pointer = path.join(aidevHome(), "knowledge-dir");
  try {
    const dir = fs.readFileSync(pointer, "utf8").trim();
    if (dir) return dir;
  } catch { /* not installed from a repo clone */ }
  return path.join(aidevHome(), "knowledge");
}

export const projectPaths = (root) => {
  const base = path.join(root, ".ai-dev");
  return {
    base,
    context: path.join(base, "context.md"),
    plan: path.join(base, "plan.md"),
    discovery: path.join(base, "discovery"),
    reports: path.join(base, "reports"),
    sessionLog: path.join(base, "session-log.md"),
    progress: path.join(base, "harness", "progress.md"),
  };
};

const read = (f) => {
  try {
    return fs.readFileSync(f, "utf8");
  } catch {
    return "";
  }
};

const listMd = (dir) => {
  try {
    return fs.readdirSync(dir).filter((n) => n.endsWith(".md")).map((n) => path.join(dir, n));
  } catch {
    return [];
  }
};

// ── Markdown helpers ──────────────────────────────────────────────────────

// Template placeholders like "[what it owns]", "[TODO]", "[e.g., …]" — not "[link](url)", "arr[0]" or "[x]".
const PLACEHOLDER = /\[(?:TODO[^\]\n]*|e\.g\.[^\]\n]*|[A-Za-zÀ-ſ][^\]\n]*\s[^\]\n]*)\](?!\()/;
const SEPARATOR = /^\|[\s:|-]+\|\s*$/;
const isPlaceholderRow = (line) => PLACEHOLDER.test(line) || line.includes("...");
// Every cell is a placeholder or empty — safe to drop once real rows arrive.
const isFullyPlaceholder = (line) =>
  line.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim())
    .every((c) => !c || c === "-" || /^\[[^\]]*\]$/.test(c) || PLACEHOLDER.test(c) || c.includes("..."));

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function sections(markdown) {
  const out = {};
  let current = "_preamble";
  for (const line of markdown.split("\n")) {
    const m = line.match(/^##\s+(.*)$/);
    if (m) {
      current = m[1].trim();
      out[current] = [];
    } else {
      (out[current] ||= []).push(line);
    }
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.join("\n").trim()]));
}

export function findSection(secs, ...names) {
  const wanted = names.map(norm);
  const key = Object.keys(secs).find((k) => wanted.some((n) => norm(k).startsWith(n)));
  return key ? secs[key] : "";
}

// Strip what a template leaves behind: comments, blockquote hints, placeholder lines,
// tables without data rows, empty code fences, and headings with nothing under them.
function clean(text) {
  let lines = text
    .replace(/<!--[\s\S]*?-->/g, "")
    .split("\n")
    .filter((l) => !/^\s*>/.test(l) && !isPlaceholderRow(l));
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const l = lines[i];
    if (l.trim().startsWith("|") && lines[i + 1] && SEPARATOR.test(lines[i + 1])) {
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith("|")) j += 1;
      if (j > i + 2) out.push(...lines.slice(i, j));
      i = j - 1;
      continue;
    }
    out.push(l);
  }
  lines = out.join("\n").replace(/```[^\n]*\n[\s/]*```/g, "").split("\n");
  const kept = lines.filter((l, i) => {
    if (!/^#{3,6}\s/.test(l)) return true;
    const rest = lines.slice(i + 1);
    const next = rest.findIndex((x) => x.trim());
    return next >= 0 && !/^#{1,6}\s/.test(rest[next]);
  });
  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function tableRows(markdown) {
  const rows = [];
  let header = null;
  for (const line of markdown.split("\n")) {
    if (!line.trim().startsWith("|")) {
      header = null;
      continue;
    }
    if (!header) {
      header = line;
      continue;
    }
    if (SEPARATOR.test(line) || isPlaceholderRow(line)) continue;
    rows.push({ header, row: line.trim() });
  }
  return rows;
}

function lastRows(markdown, n, filter = () => true) {
  const rows = tableRows(markdown).filter(filter);
  if (!rows.length) return "";
  const picked = rows.slice(-n);
  const head = picked[0].header.trim();
  return [head, head.replace(/[^|]/g, "-").replace(/-+/g, "---"), ...picked.map((r) => r.row)].join("\n");
}

function clip(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const nl = cut.lastIndexOf("\n");
  return `${nl > 0 ? cut.slice(0, nl) : cut}\n… (truncated — \`aidev recall\` for more)`;
}

const cells = (row) => row.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((c) => c.trim());

// ── brief ─────────────────────────────────────────────────────────────────

// General learnings are only worth context when they apply here: "all"/empty, or a word of
// their "Applies to" cell appears in this project's context.md.
function relevantTo(contextText) {
  const ctx = norm(contextText);
  return ({ header, row }) => {
    const h = cells(header).map(norm);
    const idx = h.findIndex((x) => x.startsWith("aplica") || x.startsWith("applies"));
    if (idx < 0) return true;
    const applies = norm(cells(row)[idx] || "");
    if (!applies || ["-", "all", "todos", "geral", "*"].includes(applies)) return true;
    return applies.split(/[\s,/]+/).some((w) => w.length >= 3 && ctx.includes(w));
  };
}

function conhecimentoOfRecentReports(dir, n) {
  const files = listMd(dir)
    .filter((f) => /delivery-/.test(path.basename(f)))
    .map((f) => ({ f, t: fs.statSync(f).mtimeMs }))
    .sort((a, b) => b.t - a.t)
    .slice(0, n);
  return files
    .map(({ f }) => {
      const k = clean(findSection(sections(read(f)), "Conhecimento"));
      return k && !/^none\.?$/i.test(k) ? `${path.basename(f)}:\n${k}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

export function brief(root, { maxChars = 9000, harnessStatus = null, progressTail = "" } = {}) {
  const p = projectPaths(root);
  const ctxText = read(p.context);
  const ctx = sections(ctxText);
  const parts = [];

  const g = globalKnowledgeDir();
  const rel = relevantTo(ctxText);
  const globalLearn = lastRows(read(path.join(g, "learnings.md")), 15, rel);
  const globalGotchas = lastRows(read(path.join(g, "gotchas.md")), 8, rel);
  if (globalLearn || globalGotchas) {
    parts.push(["### Conhecimento geral (ai-dev/knowledge — vale para este projeto)", clip([globalLearn, globalGotchas].filter(Boolean).join("\n\n"), 2000)].join("\n"));
  }

  const objective = clean(findSection(ctx, "Objetivo"));
  const structure = clean(findSection(ctx, "Estrutura", "Mapa"));
  const invariants = clean(findSection(ctx, "Invariantes"));
  const restrictions = clean(findSection(ctx, "Restri"));
  const ctxParts = [
    objective && `**Objetivo:** ${clip(objective, 600)}`,
    structure && `**Estrutura / mapa:**\n${clip(structure, 2500)}`,
    invariants && `**Invariantes (não quebrar):**\n${clip(invariants, 800)}`,
    restrictions && `**Restrições:**\n${clip(restrictions, 600)}`,
  ].filter(Boolean);
  if (ctxParts.length) parts.push(["### Projeto (.ai-dev/context.md)", ctxParts.join("\n\n")].join("\n"));

  const decisions = lastRows(findSection(ctx, "Decisoes", "Decisions"), 10);
  if (decisions) parts.push(["### Decisões de arquitetura (não desfazer em silêncio)", clip(decisions, 1500)].join("\n"));
  const gotchas = lastRows(findSection(ctx, "Gotchas"), 12);
  if (gotchas) parts.push(["### Gotchas", clip(gotchas, 1500)].join("\n"));
  const learnings = lastRows(findSection(ctx, "Aprendizados"), 10);
  if (learnings) parts.push(["### Aprendizados", clip(learnings, 1000)].join("\n"));

  const recent = conhecimentoOfRecentReports(p.reports, 2);
  if (recent) parts.push(["### Conhecimento das últimas entregas (reports/)", clip(recent, 1000)].join("\n"));

  const discoveries = listMd(p.discovery).map((f) => path.basename(f)).sort();
  const planStatus = (read(p.plan).match(/^Status:\s*(\S+)/m) || [])[1];
  const where = [
    planStatus && `plan.md: ${planStatus}`,
    discoveries.length && `discovery/: ${discoveries.slice(0, 12).join(", ")}${discoveries.length > 12 ? ", …" : ""}`,
  ].filter(Boolean);
  if (where.length) parts.push(["### Também em .ai-dev", ...where.map((w) => `- ${w}`)].join("\n"));

  if (harnessStatus || progressTail) {
    parts.push(["### Long-running harness", harnessStatus, progressTail && clip(progressTail.trim(), 1200)].filter(Boolean).join("\n"));
  }

  if (!parts.length) return "";
  const header = [
    "## ai-dev knowledge brief",
    "Auto-loaded at session start and after compaction from .ai-dev/ and the ai-dev general knowledge. Use it; verify details against the code.",
    "Search: `node ~/.claude/ai-dev/harness/aidev.mjs recall <terms>` · Record: `aidev learn gotcha|decision|note` (`--global` = ai-dev general knowledge).",
  ].join("\n");
  return clip(`${header}\n\n${parts.join("\n\n")}`, maxChars);
}

// ── recall ────────────────────────────────────────────────────────────────

function sources(root) {
  const p = projectPaths(root);
  const out = [
    { file: p.context, scope: "context" },
    { file: p.plan, scope: "plan" },
    { file: p.sessionLog, scope: "session-log" },
    { file: p.progress, scope: "progress" },
    ...listMd(p.discovery).map((file) => ({ file, scope: "discovery" })),
    ...listMd(p.reports).map((file) => ({ file, scope: "reports" })),
    ...listMd(path.join(p.base, "tasks")).filter((f) => !/_template|-prompt\.md$/.test(f)).map((file) => ({ file, scope: "tasks" })),
    ...listMd(globalKnowledgeDir()).map((file) => ({ file, scope: "geral" })),
  ];
  return out.filter((s) => fs.existsSync(s.file));
}

function chunks(text) {
  const lines = text.split("\n");
  const out = [];
  let block = [];
  let blockStart = 0;
  let header = null;
  const flush = () => {
    if (block.length) out.push({ line: blockStart + 1, text: block.join("\n") });
    block = [];
  };
  lines.forEach((line, i) => {
    if (line.trim().startsWith("|")) {
      flush();
      if (!header) header = line;
      else if (!SEPARATOR.test(line) && !isPlaceholderRow(line)) out.push({ line: i + 1, text: line.trim(), header });
      return;
    }
    header = null;
    if (!line.trim() || /^#{1,6}\s/.test(line)) {
      flush();
      if (/^#{1,6}\s/.test(line)) {
        blockStart = i;
        block = [line];
      }
      return;
    }
    if (!block.length) blockStart = i;
    block.push(line);
  });
  flush();
  return out;
}

const WEIGHT = { context: 1.6, geral: 1.4, discovery: 1.3, reports: 1.2, progress: 1.1, tasks: 1, plan: 1, "session-log": 0.6 };

export function recall(root, query, { limit = 8 } = {}) {
  const terms = [...new Set(norm(query).split(/[^\p{L}\p{N}_./-]+/u).filter((t) => t.length >= 2))];
  if (!terms.length) return [];
  const hits = [];
  for (const src of sources(root)) {
    for (const c of chunks(read(src.file))) {
      if (PLACEHOLDER.test(c.text) && c.text.length < 200) continue;
      const lower = norm(c.text);
      let distinct = 0;
      let total = 0;
      for (const t of terms) {
        const n = lower.split(t).length - 1;
        if (n) {
          distinct += 1;
          total += n;
        }
      }
      if (!distinct) continue;
      hits.push({ score: (distinct * 3 + Math.min(total, 6)) * (WEIGHT[src.scope] || 1), file: src.file, line: c.line, scope: src.scope, text: c.text, header: c.header });
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ── learn ─────────────────────────────────────────────────────────────────

// Header aliases → field. Lets `learn` write into tables whose columns differ
// (older context.md has "Decisão | Justificativa" only).
const ALIASES = {
  date: ["data", "date"],
  decision: ["decisao", "decision"],
  why: ["justificativa", "why", "motivo", "por que"],
  rejected: ["alternativas", "rejeitad", "rejected"],
  source: ["origem", "source", "found in", "encontrado"],
  symptom: ["sintoma", "symptom"],
  cause: ["causa", "cause"],
  fix: ["correcao", "fix", "solucao", "workaround"],
  learning: ["aprendizado", "learning"],
  applies: ["aplica", "applies"],
};

const fieldOf = (header) => {
  const h = norm(header);
  return Object.keys(ALIASES).find((f) => ALIASES[f].some((a) => h.startsWith(a))) || null;
};

const KINDS = {
  gotcha: {
    section: "Gotchas",
    file: "gotchas.md",
    header: "| Sintoma | Causa | Correção | Origem |",
    required: ["symptom", "fix"],
    intro: "<!-- Sintoma primeiro, para ser encontrado. Escrito com `aidev learn gotcha`. -->",
  },
  decision: {
    section: "Decisões de arquitetura",
    file: null, // project only — general knowledge has no architecture
    header: "| Data | Decisão | Justificativa | Alternativas rejeitadas | Origem |",
    required: ["decision", "why"],
    intro: "",
  },
  note: {
    section: "Aprendizados",
    file: "learnings.md",
    header: "| Data | Aprendizado | Aplica-se a | Origem |",
    required: ["learning"],
    intro: "<!-- Lições curtas que valem na próxima vez. Escrito com `aidev learn note`. -->",
  },
};

const esc = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ").trim() || "-";

// Insert a row into the first table under `## <section>` (or the first table of
// the file when section is null). Creates the section/table if missing and drops
// template placeholder rows from that table.
export function insertRow(text, section, kind, values, now = new Date()) {
  const lines = text.split("\n");
  let start = 0;
  let end = lines.length;
  if (section) {
    const s = lines.findIndex((l) => /^##\s/.test(l) && norm(l.replace(/^##\s+/, "")).startsWith(norm(section)));
    if (s < 0) {
      const body = [KINDS[kind].header, KINDS[kind].header.replace(/[^|]/g, "-").replace(/-+/g, "---")];
      const trail = text.endsWith("\n") ? "" : "\n";
      return insertRow(`${text}${trail}\n## ${section}\n\n${KINDS[kind].intro ? `${KINDS[kind].intro}\n\n` : ""}${body.join("\n")}\n`, section, kind, values, now);
    }
    start = s + 1;
    const next = lines.findIndex((l, i) => i > s && /^##\s/.test(l));
    end = next < 0 ? lines.length : next;
  }
  let head = -1;
  for (let i = start; i < end; i += 1) {
    if (lines[i].trim().startsWith("|") && lines[i + 1] && SEPARATOR.test(lines[i + 1])) {
      head = i;
      break;
    }
  }
  if (head < 0) {
    const sep = KINDS[kind].header.replace(/[^|]/g, "-").replace(/-+/g, "---");
    let at = end;
    while (at > start && !lines[at - 1].trim()) at -= 1;
    lines.splice(at, 0, "", KINDS[kind].header, sep);
    return insertRow(lines.join("\n"), section, kind, values, now);
  }
  const fields = cells(lines[head]).map(fieldOf);
  const vals = { ...values, date: values.date || now.toISOString().slice(0, 10) };
  const row = `| ${fields.map((f) => esc(f ? vals[f] : "")).join(" | ")} |`;
  let last = head + 1;
  while (last + 1 < end && lines[last + 1].trim().startsWith("|")) last += 1;
  const tableRowsRange = lines.slice(head + 2, last + 1);
  if (tableRowsRange.some((l) => l.trim() === row)) return { text, row, duplicate: true };
  const kept = tableRowsRange.filter((l) => !isFullyPlaceholder(l));
  lines.splice(head + 2, tableRowsRange.length, ...kept, row);
  return { text: lines.join("\n"), row, duplicate: false };
}

export function learn(root, kind, values, { global = false, now = new Date() } = {}) {
  const k = KINDS[kind];
  if (!k) throw new Error(`learn: kind must be one of ${Object.keys(KINDS).join(", ")}`);
  for (const r of k.required) if (!values[r]) throw new Error(`learn ${kind}: --${r} is required`);
  let file;
  let section;
  if (global) {
    if (!k.file) throw new Error("learn decision is project-only — architecture decisions belong to .ai-dev/context.md");
    const dir = globalKnowledgeDir();
    fs.mkdirSync(dir, { recursive: true });
    file = path.join(dir, k.file);
    section = null;
  } else {
    file = projectPaths(root).context;
    if (!fs.existsSync(file)) throw new Error("No .ai-dev/context.md — run /ai-dev-init first (or use --global)");
    section = k.section;
  }
  const before = read(file) || `# ${kind === "note" ? "Aprendizados" : "Gotchas"}\n\n${k.intro}\n\n${k.header}\n${k.header.replace(/[^|]/g, "-").replace(/-+/g, "---")}\n`;
  const r = insertRow(before, section, kind, values, now);
  if (!r.duplicate) fs.writeFileSync(file, r.text.endsWith("\n") ? r.text : `${r.text}\n`);
  return { file, row: r.row, duplicate: r.duplicate };
}
