import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brief, learn, recall, sections, tableRows } from "../lib/memory.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "..", "aidev.mjs");
const TEMPLATES = path.join(HERE, "..", "..", "templates", "knowledge");

let root;
let home;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "aidev-mem-"));
  home = fs.mkdtempSync(path.join(os.tmpdir(), "aidev-home-"));
  process.env.AIDEV_HOME = home;
  fs.mkdirSync(path.join(root, ".ai-dev", "knowledge"), { recursive: true });
});

describe("markdown helpers", () => {
  it("splits sections and skips template placeholders in tables", () => {
    const md = "## A\nx\n## B\n| H | I |\n|---|---|\n| `src/a.ts` | [what it owns] |\n| `src/b.ts` | uses arr[0] |";
    assert.equal(sections(md).A, "x");
    const rows = tableRows(md).map((r) => r.row);
    assert.deepEqual(rows, ["| `src/b.ts` | uses arr[0] |"]);
  });
});

describe("learn", () => {
  it("creates the file from a template, appends rows, dedupes", () => {
    const a = learn(root, "gotcha", { symptom: "tests hang", cause: "db pool | open", fix: "close pool" }, { now: new Date("2026-01-02") });
    assert.equal(a.duplicate, false);
    const b = learn(root, "gotcha", { symptom: "tests hang", cause: "db pool | open", fix: "close pool" });
    assert.equal(b.duplicate, true);
    const text = fs.readFileSync(a.file, "utf8");
    assert.match(text, /\| tests hang \| db pool \\\| open \| close pool \| - \|/);
  });
  it("writes global learnings under AIDEV_HOME", () => {
    const r = learn(root, "note", { learning: "databricks CLI needs --profile on every call" }, { global: true });
    assert.ok(r.file.startsWith(home));
  });
  it("requires the key fields", () => {
    assert.throws(() => learn(root, "decision", { decision: "x" }), /--why/);
    assert.throws(() => learn(root, "nope", {}), /kind/);
  });
});

describe("brief", () => {
  it("is empty when there is no knowledge", () => assert.equal(brief(root), ""));
  it("ignores untouched templates", () => {
    for (const f of fs.readdirSync(TEMPLATES)) fs.copyFileSync(path.join(TEMPLATES, f), path.join(root, ".ai-dev", "knowledge", f));
    assert.equal(brief(root), "");
  });
  it("includes map, gotchas, decisions, global learnings and harness state", () => {
    fs.writeFileSync(path.join(root, ".ai-dev", "knowledge", "map.md"),
      "# Map\n\n## One-paragraph architecture\n\nRequests hit `src/api` then `src/db`.\n\n## Invariants (break these)\n\n- all writes go through `src/db/tx.ts`\n");
    learn(root, "gotcha", { symptom: "port 3000 busy", fix: "kill old dev server" });
    learn(root, "decision", { decision: "SQLite for dev", why: "zero setup" });
    learn(root, "note", { learning: "user prefers pt-BR commit messages" }, { global: true });
    const b = brief(root, { harnessStatus: "Features 3/10 passing", progressTail: "## Session 4 — x\n- Next: F-005" });
    for (const s of ["src/api", "src/db/tx.ts", "port 3000 busy", "SQLite for dev", "pt-BR", "3/10", "Session 4"]) assert.ok(b.includes(s), s);
  });
  it("respects the size budget", () => {
    for (let i = 0; i < 200; i += 1) learn(root, "gotcha", { symptom: `symptom number ${i} `.repeat(5), fix: "f" });
    assert.ok(brief(root, { maxChars: 3000 }).length <= 3100);
  });
});

describe("recall", () => {
  it("ranks knowledge rows that match more terms first", () => {
    learn(root, "gotcha", { symptom: "login redirect loop", cause: "cookie samesite", fix: "set SameSite=Lax" });
    learn(root, "gotcha", { symptom: "slow login", fix: "add index" });
    fs.mkdirSync(path.join(root, ".ai-dev", "reports"));
    fs.writeFileSync(path.join(root, ".ai-dev", "reports", "delivery-001.md"), "## O que foi feito\n\nNothing about cookies here.\n");
    const hits = recall(root, "login cookie");
    assert.match(hits[0].text, /redirect loop/);
    assert.ok(hits.some((h) => h.scope === "reports"));
  });
});

describe("SessionStart hook", () => {
  const hook = (input, env = {}) => spawnSync(process.execPath, [CLI, "brief", "--hook"], {
    input: JSON.stringify(input), encoding: "utf8", env: { ...process.env, AIDEV_HOME: home, ...env },
  });
  it("is silent when ai-dev is OFF", () => {
    learn(root, "gotcha", { symptom: "x y", fix: "z" });
    assert.equal(hook({ cwd: root, source: "startup" }).stdout, "");
  });
  it("emits additionalContext when ON, from a subfolder, and marks compaction", () => {
    fs.writeFileSync(path.join(home, "enabled"), "");
    learn(root, "gotcha", { symptom: "flaky e2e", fix: "wait for network idle" });
    fs.mkdirSync(path.join(root, "src", "deep"), { recursive: true });
    const r = hook({ cwd: path.join(root, "src", "deep"), source: "compact" });
    const json = JSON.parse(r.stdout);
    assert.equal(json.hookSpecificOutput.hookEventName, "SessionStart");
    assert.match(json.hookSpecificOutput.additionalContext, /compaction[\s\S]*flaky e2e/);
  });
});
