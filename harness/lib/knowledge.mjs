// knowledge.mjs — the knowledge map.
//
// Two layers:
//   map.generated.md  — machine inventory (this module): directories, sizes,
//                       languages, entrypoints, commands. Rebuilt any time.
//   map.md            — curated by agents: what each module is for, where to
//                       look for what, invariants, links to features.
//
// `checkMap` keeps the curated layer honest: it reports paths the map
// mentions that no longer exist (stale) and top-level modules it never
// mentions (uncovered).

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const IGNORE_DIRS = new Set([
  ".git", "node_modules", ".ai-dev", "dist", "build", ".venv", "venv", "__pycache__",
  ".next", ".turbo", "coverage", "target", ".idea", ".vscode", ".pytest_cache", ".mypy_cache",
]);

const LANG_BY_EXT = {
  ".js": "JavaScript", ".mjs": "JavaScript", ".cjs": "JavaScript", ".jsx": "JavaScript",
  ".ts": "TypeScript", ".tsx": "TypeScript", ".py": "Python", ".ipynb": "Notebook",
  ".go": "Go", ".rs": "Rust", ".java": "Java", ".kt": "Kotlin", ".rb": "Ruby", ".php": "PHP",
  ".cs": "C#", ".c": "C", ".h": "C", ".cpp": "C++", ".sql": "SQL", ".sh": "Shell",
  ".md": "Markdown", ".json": "JSON", ".yml": "YAML", ".yaml": "YAML", ".toml": "TOML",
  ".html": "HTML", ".css": "CSS", ".scss": "CSS", ".vue": "Vue", ".svelte": "Svelte", ".tf": "Terraform",
};

const ENTRYPOINT_NAMES = new Set([
  "package.json", "pyproject.toml", "setup.py", "requirements.txt", "Makefile", "Dockerfile",
  "docker-compose.yml", "compose.yml", "databricks.yml", "go.mod", "Cargo.toml", "pom.xml",
  "build.gradle", "manage.py", "main.py", "app.py", "index.js", "index.ts", "main.ts", "server.js",
  "server.ts", "vite.config.ts", "vite.config.js", "next.config.js", "next.config.mjs", "tsconfig.json",
  "pytest.ini", "jest.config.js", "vitest.config.ts", "playwright.config.ts", "install.sh", "init.sh",
]);

export function listFiles(root) {
  try {
    const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    });
    const files = out.split("\n").filter(Boolean);
    return files.filter((f) => !f.split("/").some((part) => IGNORE_DIRS.has(part)));
  } catch {
    return walk(root, "");
  }
}

function walk(root, rel) {
  const out = [];
  let entries = [];
  try {
    entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const p = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(root, p));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

function countLines(file) {
  try {
    const st = fs.statSync(file);
    if (st.size > 2 * 1024 * 1024) return 0;
    const buf = fs.readFileSync(file);
    if (buf.includes(0)) return 0; // binary
    let n = 0;
    for (const b of buf) if (b === 10) n += 1;
    return n;
  } catch {
    return 0;
  }
}

export function scan(root, { depth = 2 } = {}) {
  const files = listFiles(root).sort();
  const modules = new Map();
  const languages = {};
  const entrypoints = [];
  for (const rel of files) {
    const parts = rel.split("/");
    const key = parts.length === 1 ? "." : parts.slice(0, Math.min(depth, parts.length - 1)).join("/");
    const lines = countLines(path.join(root, rel));
    const lang = LANG_BY_EXT[path.extname(rel).toLowerCase()];
    if (lang) languages[lang] = (languages[lang] || 0) + lines;
    const m = modules.get(key) || { path: key, files: 0, lines: 0, languages: {} };
    m.files += 1;
    m.lines += lines;
    if (lang) m.languages[lang] = (m.languages[lang] || 0) + 1;
    modules.set(key, m);
    if (ENTRYPOINT_NAMES.has(parts[parts.length - 1]) || /(^|\/)(tests?|__tests__|e2e|spec)\//.test(rel) && parts.length <= 3 && /test|spec/.test(parts[parts.length - 1])) {
      entrypoints.push(rel);
    }
  }
  return {
    root,
    fileCount: files.length,
    modules: [...modules.values()].sort((a, b) => a.path.localeCompare(b.path)),
    languages,
    entrypoints: entrypoints.slice(0, 60),
    commands: detectCommands(root),
  };
}

export function detectCommands(root) {
  const cmds = [];
  const pkg = path.join(root, "package.json");
  if (fs.existsSync(pkg)) {
    try {
      const scripts = JSON.parse(fs.readFileSync(pkg, "utf8")).scripts || {};
      for (const [name, cmd] of Object.entries(scripts)) cmds.push({ source: "package.json", name, cmd: `npm run ${name}`, runs: cmd });
    } catch { /* ignore malformed package.json */ }
  }
  const mk = path.join(root, "Makefile");
  if (fs.existsSync(mk)) {
    for (const m of fs.readFileSync(mk, "utf8").matchAll(/^([A-Za-z0-9_.-]+):(?!=)/gm)) {
      if (!m[1].startsWith(".")) cmds.push({ source: "Makefile", name: m[1], cmd: `make ${m[1]}` });
    }
  }
  const py = path.join(root, "pyproject.toml");
  if (fs.existsSync(py)) {
    const text = fs.readFileSync(py, "utf8");
    if (/\[tool\.pytest/.test(text) || fs.existsSync(path.join(root, "tests"))) cmds.push({ source: "pyproject.toml", name: "test", cmd: "pytest" });
    const sec = text.match(/\[project\.scripts\]([\s\S]*?)(\n\[|$)/);
    if (sec) for (const m of sec[1].matchAll(/^\s*([\w.-]+)\s*=/gm)) cmds.push({ source: "pyproject.toml", name: m[1], cmd: m[1] });
  }
  if (fs.existsSync(path.join(root, "databricks.yml"))) {
    cmds.push({ source: "databricks.yml", name: "validate", cmd: "databricks bundle validate" });
  }
  return cmds;
}

export function renderGenerated(inv, now = new Date()) {
  const langs = Object.entries(inv.languages).sort((a, b) => b[1] - a[1]);
  const out = [
    "# Knowledge map — generated inventory",
    "",
    `> Generated by \`aidev map\` on ${now.toISOString().slice(0, 16).replace("T", " ")}. Do not edit — rerun to refresh.`,
    "> The curated map lives in `map.md`. This file is the ground truth it is checked against.",
    "",
    `**Files:** ${inv.fileCount}`,
    "",
    "## Languages (lines)",
    "",
    ...(langs.length ? langs.map(([l, n]) => `- ${l}: ${n}`) : ["- (none detected)"]),
    "",
    "## Modules",
    "",
    "| Path | Files | Lines | Main languages |",
    "|------|------:|------:|----------------|",
    ...inv.modules.map((m) => {
      const top = Object.entries(m.languages).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l).join(", ");
      return `| \`${m.path}\` | ${m.files} | ${m.lines} | ${top || "-"} |`;
    }),
    "",
    "## Entrypoints and config",
    "",
    ...(inv.entrypoints.length ? inv.entrypoints.map((e) => `- \`${e}\``) : ["- (none detected)"]),
    "",
    "## Commands",
    "",
    ...(inv.commands.length
      ? inv.commands.map((c) => `- \`${c.cmd}\` (${c.source}${c.runs ? `: ${c.runs}` : ""})`)
      : ["- (none detected — document them in init.sh)"]),
    "",
  ];
  return out.join("\n");
}

// Paths in backticks that look like repo paths: contain a slash or a dot-extension.
export function extractPaths(markdown) {
  const out = new Set();
  for (const m of markdown.matchAll(/`([^`\s]+)`/g)) {
    let p = m[1].replace(/:\d+(-\d+)?$/, "").replace(/\/$/, "");
    if (/^(https?:|~|\$|-|\.ai-dev)/.test(p)) continue;
    if (/[*?<>{}|[\]]/.test(p) || p.includes("...")) continue; // globs and placeholders
    if (!/\//.test(p) && !/\.[A-Za-z0-9]{1,6}$/.test(p)) continue;
    out.add(p.replace(/^\.\//, ""));
  }
  return [...out];
}

export function checkMap(root, mapText, inv, { knowledgeDir = path.join(root, ".ai-dev", "knowledge") } = {}) {
  const mentioned = extractPaths(mapText);
  // A path may be repo-relative or a sibling note in the knowledge dir (e.g. `map.generated.md`).
  const stale = mentioned.filter((p) => !fs.existsSync(path.join(root, p)) && !fs.existsSync(path.join(knowledgeDir, p)));
  const topLevel = [...new Set(inv.modules.map((m) => m.path.split("/")[0]).filter((p) => p !== "."))];
  const uncovered = topLevel.filter((t) => !mentioned.some((p) => p === t || p.startsWith(`${t}/`)));
  return { mentioned: mentioned.length, stale, uncovered };
}
