#!/usr/bin/env node
// aidev — deterministic helpers for the ai-dev long-running harness.
//
// Agents call this instead of hand-editing the harness state, so the rules
// (one feature at a time, no edited tests, evidence before "passes") are
// enforced by code instead of by prompt.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  buildLock, guard, harnessPaths, loadFeatures, markFail, markPass, markRegressed,
  nextFeature, saveFeatures, summarize, unblock, validate,
} from "./lib/features.mjs";
import { appendEntry, tail } from "./lib/progress.mjs";
import { checkMap, renderGenerated, scan } from "./lib/knowledge.mjs";
import { aidevHome, brief, globalKnowledgeDir, learn, recall } from "./lib/memory.mjs";

const USAGE = `aidev — ai-dev long-running harness

Feature list (.ai-dev/harness/features.json):
  aidev status [--json]                 progress summary + next feature
  aidev next [--json]                   highest-priority feature not passing/blocked
  aidev validate                        schema check
  aidev freeze                          lock feature definitions (after user approval)
  aidev guard                           fail if any feature was removed or edited since freeze
  aidev pass <id> --evidence <ref> [--session N]
  aidev fail <id> --note <why> [--session N] [--max-attempts 3]
  aidev regress <id> --note <what broke> [--session N]
  aidev unblock <id>

Progress log (.ai-dev/harness/progress.md):
  aidev progress tail [-n 3]
  aidev progress add --feature <id> --result <passed|failed|blocked|fixed-env>
                     --summary <text> --state <text> --next <text>
                     [--gotchas <text>] [--commit <sha>] [--session N]

Code map (inside .ai-dev — no separate store):
  aidev map [--depth 2]                 write .ai-dev/discovery/inventory.md (modules, languages, entrypoints, commands)
  aidev map --check                     stale paths / uncovered modules in .ai-dev/context.md

Knowledge (project = .ai-dev/ · general = <ai-dev repo>/knowledge/):
  aidev brief [--max-chars 9000]        compact knowledge digest (what the SessionStart hook injects)
  aidev brief --hook                    hook mode: reads hook JSON on stdin, prints additionalContext
  aidev recall <terms...> [--limit 8]   ranked search: context, discovery, reports, tasks, plan, logs, general knowledge
  aidev learn gotcha   --symptom <s> --fix <f> [--cause <c>] [--source <s>] [--global]
  aidev learn decision --decision <d> --why <w> [--rejected <r>] [--source <s>]   (project only)
  aidev learn note     --learning <l> [--applies <scope>] [--source <s>] [--global]
                     project → .ai-dev/context.md (Gotchas · Decisões de arquitetura · Aprendizados)
                     --global → ai-dev repo knowledge/ (gotchas.md · learnings.md)
  aidev sync [--no-push]                commit general knowledge in the ai-dev repo, pull --rebase, push

Health:
  aidev doctor [--json]                 everything the PM checks after a session

Global: --root <dir> (default: cwd)`;

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "-n") flags.n = argv[++i];
    else if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      if (val === undefined || val.startsWith("--")) flags[key] = true;
      else {
        flags[key] = val;
        i += 1;
      }
    } else positional.push(a);
  }
  return { positional, flags };
}

function sessionArg(flags) {
  return flags.session === undefined ? undefined : Number(flags.session);
}

function out(obj, asJson, text) {
  process.stdout.write(asJson ? `${JSON.stringify(obj, null, 2)}\n` : `${text}\n`);
}

function bar(passing, total, width = 24) {
  const filled = total ? Math.round((passing / total) * width) : 0;
  return `${"█".repeat(filled)}${"░".repeat(width - filled)}`;
}

function describe(f) {
  if (!f) return "none — every feature passes or is blocked";
  return `${f.id} — ${f.description}${f.category ? ` [${f.category}]` : ""}${f.priority !== undefined ? ` (p${f.priority})` : ""}`;
}

function cmdStatus(p, flags) {
  const doc = loadFeatures(p.features);
  const s = summarize(doc);
  const lines = [
    `Features: ${s.passing}/${s.total} passing  ${bar(s.passing, s.total)}  ${s.total ? Math.round((s.passing / s.total) * 100) : 0}%`,
    `Blocked: ${s.blocked}`,
    "",
    ...Object.entries(s.byCategory).map(([c, v]) => `  ${c.padEnd(22)} ${v.passing}/${v.total}`),
    "",
    `Next: ${describe(s.next)}`,
  ];
  const blocked = doc.features.filter((f) => f.blocked && !f.passes);
  if (blocked.length) lines.push("", "Blocked features (need a human decision):", ...blocked.map((f) => `  ${f.id} — ${f.notes || f.description}`));
  out({ ...s, next: s.next?.id ?? null }, flags.json, lines.join("\n"));
}

function cmdNext(p, flags) {
  const f = nextFeature(loadFeatures(p.features));
  if (flags.json) out(f, true);
  else out(null, false, f ? JSON.stringify(f, null, 2) : "none");
  if (!f) process.exitCode = 3;
}

function cmdValidate(p) {
  const errors = validate(loadFeatures(p.features));
  if (errors.length) {
    process.stderr.write(`features.json invalid:\n${errors.map((e) => `  - ${e}`).join("\n")}\n`);
    process.exitCode = 1;
  } else out(null, false, "features.json valid");
}

function cmdFreeze(p) {
  const doc = loadFeatures(p.features);
  const errors = validate(doc);
  if (errors.length) throw new Error(`Refusing to freeze an invalid list:\n${errors.join("\n")}`);
  fs.writeFileSync(p.lock, `${JSON.stringify(buildLock(doc), null, 2)}\n`);
  out(null, false, `Frozen ${doc.features.length} feature definitions → ${path.relative(process.cwd(), p.lock) || p.lock}`);
}

function runGuard(p) {
  if (!fs.existsSync(p.lock)) return { ok: false, error: "No features.lock.json — run `aidev freeze` after the user approves the list." };
  const lock = JSON.parse(fs.readFileSync(p.lock, "utf8"));
  return guard(loadFeatures(p.features), lock);
}

function cmdGuard(p, flags) {
  const r = runGuard(p);
  if (r.error) {
    process.stderr.write(`${r.error}\n`);
    process.exitCode = 1;
    return;
  }
  const lines = [r.ok ? "guard: OK — no feature removed or edited" : "guard: VIOLATION"];
  if (r.removed.length) lines.push(`  removed: ${r.removed.join(", ")}`);
  if (r.edited.length) lines.push(`  edited:  ${r.edited.join(", ")}  (only state fields may change)`);
  if (r.addedPassing.length) lines.push(`  added already passing: ${r.addedPassing.join(", ")}`);
  if (r.added.length) lines.push(`  added (allowed, need user review): ${r.added.join(", ")}`);
  out(r, flags.json, lines.join("\n"));
  if (!r.ok) process.exitCode = 2;
}

function mutate(p, fn) {
  const doc = loadFeatures(p.features);
  const f = fn(doc);
  saveFeatures(p.features, doc);
  return f;
}

function cmdProgress(p, positional, flags) {
  const sub = positional[1];
  if (sub === "tail") {
    const text = fs.existsSync(p.progress) ? fs.readFileSync(p.progress, "utf8") : "";
    out(null, false, tail(text, Number(flags.n || 3)) || "(no sessions yet)");
    return;
  }
  if (sub === "add") {
    for (const k of ["feature", "result", "summary", "state", "next"]) {
      if (!flags[k] || flags[k] === true) throw new Error(`progress add: --${k} is required`);
    }
    const { session } = appendEntry(p.progress, {
      session: sessionArg(flags),
      feature: flags.feature,
      result: flags.result,
      summary: flags.summary,
      state: flags.state,
      next: flags.next,
      gotchas: flags.gotchas === true ? undefined : flags.gotchas,
      commit: flags.commit === true ? undefined : flags.commit,
    });
    out(null, false, `progress: session ${session} recorded`);
    return;
  }
  throw new Error("usage: aidev progress tail|add");
}

function cmdMap(root, p, flags) {
  const inv = scan(root, { depth: Number(flags.depth || 2) });
  if (flags.check) {
    if (!fs.existsSync(p.context)) {
      process.stderr.write("No .ai-dev/context.md — run /ai-dev-init.\n");
      process.exitCode = 1;
      return;
    }
    const r = checkMap(root, fs.readFileSync(p.context, "utf8"), inv);
    const lines = [`context.md mentions ${r.mentioned} paths`];
    lines.push(r.stale.length ? `  stale (no longer exist): ${r.stale.join(", ")}` : "  stale: none");
    lines.push(r.uncovered.length ? `  uncovered top-level modules: ${r.uncovered.join(", ")}` : "  uncovered: none");
    out(r, flags.json, lines.join("\n"));
    if (r.stale.length) process.exitCode = 2;
    return;
  }
  fs.mkdirSync(p.discovery, { recursive: true });
  const target = path.join(p.discovery, "inventory.md");
  fs.writeFileSync(target, renderGenerated(inv));
  out(null, false, `map: ${inv.fileCount} files, ${inv.modules.length} modules → ${path.relative(process.cwd(), target) || target}`);
}

function cmdDoctor(root, p, flags) {
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok, detail });
  const harness = fs.existsSync(p.base);
  if (harness) {
    add("features.json exists", fs.existsSync(p.features), p.features);
    add("init.sh exists", fs.existsSync(p.init), p.init);
    add("progress.md exists", fs.existsSync(p.progress), p.progress);
  }
  if (fs.existsSync(p.features)) {
    const errors = validate(loadFeatures(p.features));
    add("features.json valid", errors.length === 0, errors.join("; ") || "ok");
    const g = runGuard(p);
    add("guard", !g.error && g.ok, g.error || [g.removed.length && `removed ${g.removed}`, g.edited.length && `edited ${g.edited}`, g.addedPassing.length && `added passing ${g.addedPassing}`].filter(Boolean).join("; ") || "ok");
  }
  if (fs.existsSync(p.context)) {
    const r = checkMap(root, fs.readFileSync(p.context, "utf8"), scan(root));
    add("context.md map fresh", r.stale.length === 0, `stale: ${r.stale.join(", ")}`);
    if (r.uncovered.length) checks.push({ name: `context.md doesn't mention: ${r.uncovered.join(", ")}`, ok: true, warn: true });
  } else add("context.md exists", false, p.context);
  const allOk = checks.every((c) => c.ok);
  out({ ok: allOk, checks }, flags.json, checks.map((c) => `${c.warn ? "⚠️ " : c.ok ? "✅" : "❌"} ${c.name}${c.ok ? "" : ` — ${c.detail}`}`).join("\n"));
  if (!allOk) process.exitCode = 1;
}

// Walk up from dir to the nearest folder that has .ai-dev/ (the user may open a subfolder).
function findProjectRoot(dir) {
  let cur = path.resolve(dir);
  for (;;) {
    if (fs.existsSync(path.join(cur, ".ai-dev"))) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) return null;
    cur = parent;
  }
}

function harnessDigest(p) {
  if (!fs.existsSync(p.features)) return { status: null, tail: "" };
  try {
    const s = summarize(loadFeatures(p.features));
    const status = `Features ${s.passing}/${s.total} passing · blocked ${s.blocked} · next: ${s.next ? `${s.next.id} — ${s.next.description}` : "none"}`;
    return { status, tail: fs.existsSync(p.progress) ? tail(fs.readFileSync(p.progress, "utf8"), 1) : "" };
  } catch (err) {
    return { status: `features.json unreadable: ${err.message}`, tail: "" };
  }
}

function cmdBrief(rootArg, flags) {
  let cwd = rootArg;
  let source = "manual";
  if (flags.hook) {
    // Hook contract: JSON on stdin with cwd + source; stay silent when ai-dev is OFF.
    if (!fs.existsSync(path.join(aidevHome(), "enabled"))) return;
    if (!process.stdin.isTTY) {
      try {
        const input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
        cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || cwd;
        source = input.source || source;
      } catch { /* no/invalid stdin — keep cwd */ }
    }
  }
  const root = findProjectRoot(cwd) || cwd;
  const h = harnessDigest(harnessPaths(root));
  let text = brief(root, { maxChars: Number(flags["max-chars"] || 9000), harnessStatus: h.status, progressTail: h.tail });
  if (flags.hook) {
    if (!text) return;
    if (source === "compact") text = `(Re-injected after context compaction.)\n${text}`;
    process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: text } })}\n`);
    return;
  }
  out(null, false, text || "(no knowledge yet — fill .ai-dev/context.md (/ai-dev-knowledge), or record with `aidev learn`)");
}

function cmdRecall(root, positional, flags) {
  const query = positional.slice(1).join(" ");
  if (!query) throw new Error("usage: aidev recall <terms...>");
  const hits = recall(findProjectRoot(root) || root, query, { limit: Number(flags.limit || 8) });
  if (flags.json) return out(hits, true);
  if (!hits.length) return out(null, false, `no matches for "${query}"`);
  out(null, false, hits.map((h) => `[${h.scope}] ${path.relative(root, h.file) || h.file}:${h.line}\n${h.header ? `${h.header.trim()}\n` : ""}${h.text}`).join("\n\n"));
}

function cmdLearn(root, positional, flags) {
  const kind = positional[1];
  const values = Object.fromEntries(Object.entries(flags).filter(([, v]) => v !== true));
  const r = learn(findProjectRoot(root) || root, kind, values, { global: Boolean(flags.global) });
  out(null, false, r.duplicate ? `learn: already recorded in ${r.file}` : `learn: ${kind} → ${r.file}${flags.global ? "  (run `aidev sync` to share it across machines)" : ""}`);
}

// General knowledge lives in the ai-dev repo: commit it there and sync with the remote.
function cmdSync(flags) {
  const dir = globalKnowledgeDir();
  const run = (cwd, args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  let top;
  try {
    top = run(dir, ["rev-parse", "--show-toplevel"]);
  } catch {
    throw new Error(`${dir} is not inside a git repo — reinstall from a clone of ai-dev (bash install.sh) to version general knowledge`);
  }
  const rel = path.relative(fs.realpathSync(top), fs.realpathSync(dir)) || ".";
  const git = (...args) => run(top, args); // pathspecs relative to the repo root
  git("add", "--", rel);
  const staged = git("diff", "--cached", "--name-only", "--", rel);
  if (staged) {
    const n = git("diff", "--cached", "--numstat", "--", rel).split("\n").reduce((a, l) => a + (Number(l.split("\t")[0]) || 0), 0);
    git("commit", "-m", `knowledge: ${n} new line(s) of general knowledge`, "--", rel);
  }
  const lines = [staged ? `committed: ${staged.split("\n").join(", ")}` : "nothing new to commit"];
  if (!flags["no-push"]) {
    try {
      git("pull", "--rebase", "--autostash");
      git("push");
      lines.push("pulled and pushed");
    } catch (err) {
      lines.push(`sync with remote failed — resolve in ${top}: ${String(err.stderr || err.message).split("\n")[0]}`);
      process.exitCode = 1;
    }
  }
  out(null, false, `ai-dev knowledge (${top}/${rel})\n${lines.join("\n")}`);
}

export function main(argv = process.argv.slice(2)) {
  const { positional, flags } = parseArgs(argv);
  const root = path.resolve(flags.root && flags.root !== true ? flags.root : process.cwd());
  const p = harnessPaths(root);
  const cmd = positional[0];
  const id = positional[1];
  switch (cmd) {
    case "status": return cmdStatus(p, flags);
    case "next": return cmdNext(p, flags);
    case "validate": return cmdValidate(p);
    case "freeze": return cmdFreeze(p);
    case "guard": return cmdGuard(p, flags);
    case "pass": {
      const f = mutate(p, (d) => markPass(d, id, { evidence: flags.evidence === true ? "" : flags.evidence, session: sessionArg(flags) }));
      return out(null, false, `${f.id}: passes=true`);
    }
    case "fail": {
      const f = mutate(p, (d) => markFail(d, id, { note: flags.note, session: sessionArg(flags), maxAttempts: Number(flags["max-attempts"] || 3) }));
      return out(null, false, `${f.id}: attempts=${f.attempts}${f.blocked ? " → BLOCKED (needs a human decision)" : ""}`);
    }
    case "regress": {
      const f = mutate(p, (d) => markRegressed(d, id, { note: flags.note, session: sessionArg(flags) }));
      return out(null, false, `${f.id}: regressed → passes=false`);
    }
    case "unblock": {
      const f = mutate(p, (d) => unblock(d, id));
      return out(null, false, `${f.id}: unblocked`);
    }
    case "progress": return cmdProgress(p, positional, flags);
    case "map": return cmdMap(root, p, flags);
    case "doctor": return cmdDoctor(root, p, flags);
    case "brief": return cmdBrief(root, flags);
    case "recall": return cmdRecall(root, positional, flags);
    case "learn": return cmdLearn(root, positional, flags);
    case "sync": return cmdSync(flags);
    case undefined:
    case "help":
    case "--help":
      return out(null, false, USAGE);
    default:
      throw new Error(`Unknown command: ${cmd}\n\n${USAGE}`);
  }
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (invokedDirectly) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`aidev: ${err.message}\n`);
    process.exitCode = 1;
  }
}
