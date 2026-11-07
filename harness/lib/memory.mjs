// memory.mjs — knowledge that survives sessions and gets used every time.
//
// Two scopes:
//   project  .ai-dev/knowledge/       map.md, decisions.md, gotchas.md (tracked in git)
//   global   ~/.claude/ai-dev/knowledge/   learnings.md, gotchas.md (every project, every session)
//
// Three verbs:
//   brief   compact digest injected automatically by the SessionStart hook
//           (startup, resume, clear, compact) — the model never has to remember to read it
//   recall  ranked search across knowledge, progress notes and delivery reports
//   learn   append a gotcha / decision / learning as one table row, deterministically

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function globalKnowledgeDir() {
  const home = process.env.AIDEV_HOME || path.join(os.homedir(), ".claude", "ai-dev");
  return path.join(home, "knowledge");
}

export function projectKnowledgeDir(root) {
  return path.join(root, ".ai-dev", "knowledge");
}

const read = (f) => {
  try {
    return fs.readFileSync(f, "utf8");
  } catch {
    return "";
  }
};

// ── Markdown helpers ──────────────────────────────────────────────────────

// Template placeholders like "[what it owns]" or "[TODO]" — not "[link](url)", "arr[0]" or "[x]".
const PLACEHOLDER = /\[(?:TODO[^\]\n]*|e\.g\.[^\]\n]*|[A-Za-z][^\]\n]*\s[^\]\n]*)\](?!\()/;
const SEPARATOR = /^\|[\s:|-]+\|\s*$/;

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

function findSection(secs, ...names) {
  const key = Object.keys(secs).find((k) => names.some((n) => k.toLowerCase().startsWith(n.toLowerCase())));
  return key ? secs[key] : "";
}

function clean(text) {
  return text
    .split("\n")
    .filter((l) => !/^\s*>/.test(l)) // blockquote instructions in templates
    .filter((l) => !/^\s*<!--/.test(l))
    .filter((l) => !PLACEHOLDER.test(l))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Data rows of every table in the text (header and separator removed).
export function tableRows(markdown) {
  const rows = [];
  let inTable = false;
  let header = null;
  for (const line of markdown.split("\n")) {
    if (!line.trim().startsWith("|")) {
      inTable = false;
      header = null;
      continue;
    }
    if (!inTable) {
      inTable = true;
      header = line;
      continue;
    }
    if (SEPARATOR.test(line)) continue;
    if (PLACEHOLDER.test(line) || line.includes("...")) continue;
    rows.push({ header, row: line.trim() });
  }
  return rows;
}

function lastRows(markdown, n) {
  const rows = tableRows(markdown);
  if (!rows.length) return "";
  const picked = rows.slice(-n);
  return [picked[0].header.trim(), picked[0].header.replace(/[^|]/g, "-").replace(/-+/g, "---"), ...picked.map((r) => r.row)].join("\n");
}

function clip(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf("\n") > 0 ? cut.lastIndexOf("\n") : max)}\n… (truncated — \`aidev recall\` for more)`;
}

// ── brief ─────────────────────────────────────────────────────────────────

export function brief(root, { maxChars = 9000, harnessStatus = null, progressTail = "" } = {}) {
  const parts = [];
  const g = globalKnowledgeDir();
  const p = projectKnowledgeDir(root);

  const globalLearn = lastRows(read(path.join(g, "learnings.md")), 15);
  const globalGotchas = lastRows(read(path.join(g, "gotchas.md")), 8);
  if (globalLearn || globalGotchas) {
    parts.push(["### Your learnings (all projects)", clip([globalLearn, globalGotchas].filter(Boolean).join("\n\n"), 2000)].join("\n"));
  }

  const mapSecs = sections(read(path.join(p, "map.md")));
  const arch = clean(findSection(mapSecs, "One-paragraph architecture", "Architecture"));
  const where = lastRows(findSection(mapSecs, "Where to look"), 20);
  const inv = clean(findSection(mapSecs, "Invariants"));
  const mods = lastRows(findSection(mapSecs, "Modules"), 25);
  const mapParts = [
    arch && `**Architecture:** ${arch}`,
    mods && `**Modules:**\n${mods}`,
    where && `**Where to look:**\n${where}`,
    inv && `**Invariants (do not break):**\n${inv}`,
  ].filter(Boolean);
  if (mapParts.length) parts.push(["### Project map (.ai-dev/knowledge/map.md)", clip(mapParts.join("\n\n"), 3500)].join("\n"));

  const gotchas = lastRows(read(path.join(p, "gotchas.md")), 12);
  if (gotchas) parts.push(["### Project gotchas", clip(gotchas, 1500)].join("\n"));
  const decisions = lastRows(read(path.join(p, "decisions.md")), 10);
  if (decisions) parts.push(["### Decisions already made (don't undo silently)", clip(decisions, 1500)].join("\n"));

  if (harnessStatus || progressTail) {
    parts.push(["### Long-running harness", harnessStatus, progressTail && clip(progressTail.trim(), 1200)].filter(Boolean).join("\n"));
  }

  if (!parts.length) return "";
  const header = [
    "## ai-dev knowledge brief",
    "Auto-loaded at session start and after compaction. Treat as notes from earlier sessions: use them, and verify against the code before relying on a detail.",
    "Search more: `node ~/.claude/ai-dev/harness/aidev.mjs recall <terms>` · Record: `aidev learn gotcha|decision|note` (add `--global` for cross-project lessons).",
  ].join("\n");
  return clip(`${header}\n\n${parts.join("\n\n")}`, maxChars);
}

// ── recall ────────────────────────────────────────────────────────────────

function sources(root) {
  const out = [];
  const addDir = (dir, scope) => {
    let names = [];
    try {
      names = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const n of names) if (n.endsWith(".md")) out.push({ file: path.join(dir, n), scope });
  };
  addDir(projectKnowledgeDir(root), "project");
  addDir(globalKnowledgeDir(), "global");
  out.push({ file: path.join(root, ".ai-dev", "harness", "progress.md"), scope: "progress" });
  addDir(path.join(root, ".ai-dev", "reports"), "reports");
  return out.filter((s) => fs.existsSync(s.file));
}

// Chunks: each table row (with its header) or each blank-line-separated block.
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
      else if (!SEPARATOR.test(line)) out.push({ line: i + 1, text: line.trim(), header });
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

export function recall(root, query, { limit = 8 } = {}) {
  const terms = [...new Set(query.toLowerCase().split(/[^\p{L}\p{N}_./-]+/u).filter((t) => t.length >= 2))];
  if (!terms.length) return [];
  const hits = [];
  for (const src of sources(root)) {
    for (const c of chunks(read(src.file))) {
      const lower = c.text.toLowerCase();
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
      const weight = src.scope === "project" || src.scope === "global" ? 1.5 : 1;
      hits.push({ score: (distinct * 3 + Math.min(total, 6)) * weight, file: src.file, line: c.line, scope: src.scope, text: c.text, header: c.header });
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ── learn ─────────────────────────────────────────────────────────────────

const TEMPLATES = {
  gotcha: {
    file: "gotchas.md",
    head: "# Gotchas\n\n> Symptom first so it is searchable. Written with `aidev learn gotcha`.\n\n| Symptom | Cause | Fix / workaround | Found in |\n|---------|-------|------------------|----------|\n",
    fields: ["symptom", "cause", "fix", "source"],
  },
  decision: {
    file: "decisions.md",
    head: "# Decisions (ADR log)\n\n> Append-only. Written with `aidev learn decision`.\n\n| Date | Decision | Why | Rejected | Source |\n|------|----------|-----|----------|--------|\n",
    fields: ["date", "decision", "why", "rejected", "source"],
  },
  note: {
    file: "learnings.md",
    head: "# Learnings\n\n> Short lessons worth knowing next time. Written with `aidev learn note`.\n\n| Date | Learning | Applies to | Source |\n|------|----------|------------|--------|\n",
    fields: ["date", "learning", "applies", "source"],
  },
};

const cell = (v) => String(v ?? "-").replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ").trim() || "-";

export function learn(root, kind, values, { global = false, now = new Date() } = {}) {
  const t = TEMPLATES[kind];
  if (!t) throw new Error(`learn: kind must be one of ${Object.keys(TEMPLATES).join(", ")}`);
  const required = { gotcha: ["symptom", "fix"], decision: ["decision", "why"], note: ["learning"] }[kind];
  for (const r of required) if (!values[r]) throw new Error(`learn ${kind}: --${r} is required`);
  const dir = global ? globalKnowledgeDir() : projectKnowledgeDir(root);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, t.file);
  let text = read(file) || t.head;
  const row = `| ${t.fields.map((f) => cell(f === "date" ? values.date || now.toISOString().slice(0, 10) : values[f])).join(" | ")} |`;
  // Dedupe: identical row content already present → no-op.
  if (text.includes(row)) return { file, row, duplicate: true };
  if (!text.endsWith("\n")) text += "\n";
  fs.writeFileSync(file, `${text}${row}\n`);
  return { file, row, duplicate: false };
}
