import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brief, insertRow, learn, recall, sections, tableRows } from "../lib/memory.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "..", "aidev.mjs");
const TEMPLATES = path.join(HERE, "..", "..", "templates");
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));

let root;
let home;
let general;
const ctxFile = () => path.join(root, ".ai-dev", "context.md");

beforeEach(() => {
  root = tmp("aidev-proj-");
  home = tmp("aidev-home-");
  general = tmp("aidev-general-");
  process.env.AIDEV_HOME = home;
  process.env.AIDEV_KNOWLEDGE_DIR = general;
  fs.mkdirSync(path.join(root, ".ai-dev", "discovery"), { recursive: true });
  fs.mkdirSync(path.join(root, ".ai-dev", "reports"), { recursive: true });
  fs.copyFileSync(path.join(TEMPLATES, "context.md"), ctxFile());
});

describe("markdown helpers", () => {
  it("splits sections and skips template placeholders in tables", () => {
    const md = "## A\nx\n## B\n| H | I |\n|---|---|\n| `src/a.ts` | [what it owns] |\n| `src/b.ts` | uses arr[0] |";
    assert.equal(sections(md).A, "x");
    assert.deepEqual(tableRows(md).map((r) => r.row), ["| `src/b.ts` | uses arr[0] |"]);
  });
});

describe("learn → existing .ai-dev/context.md", () => {
  it("writes a decision into 'Decisões de arquitetura' and drops the template row", () => {
    learn(root, "decision", { decision: "SQLite em dev", why: "zero setup", rejected: "Postgres local" }, { now: new Date("2026-03-01") });
    const dec = sections(fs.readFileSync(ctxFile(), "utf8"))["Decisões de arquitetura"];
    assert.match(dec, /\| 2026-03-01 \| SQLite em dev \| zero setup \| Postgres local \| - \|/);
    assert.doesNotMatch(dec, /FastAPI/);
  });
  it("keeps half-filled starter rows and maps to old 2-column tables", () => {
    fs.writeFileSync(ctxFile(), "# C\n\n## Decisões de arquitetura\n\n| Decisão | Justificativa |\n|---|---|\n| Medallion | [TODO] |\n\n## Restrições\n\nnone\n");
    learn(root, "decision", { decision: "Unity Catalog", why: "governança", rejected: "hive" });
    const dec = sections(fs.readFileSync(ctxFile(), "utf8"))["Decisões de arquitetura"];
    assert.match(dec, /\| Medallion \| \[TODO\] \|\n\| Unity Catalog \| governança \|/);
    assert.ok(fs.readFileSync(ctxFile(), "utf8").includes("## Restrições"));
  });
  it("writes gotchas and notes into their sections, dedupes, escapes pipes", () => {
    learn(root, "gotcha", { symptom: "tests hang", cause: "pool | open", fix: "close pool" });
    assert.equal(learn(root, "gotcha", { symptom: "tests hang", cause: "pool | open", fix: "close pool" }).duplicate, true);
    learn(root, "note", { learning: "API usa paginação por cursor" });
    const secs = sections(fs.readFileSync(ctxFile(), "utf8"));
    assert.match(secs.Gotchas, /\| tests hang \| pool \\\| open \| close pool \| - \|/);
    assert.match(secs.Aprendizados, /paginação por cursor/);
  });
  it("creates the section in an older context.md that lacks it", () => {
    fs.writeFileSync(ctxFile(), "# C\n\n## Objetivo do projeto\n\nX\n");
    learn(root, "gotcha", { symptom: "s1", fix: "f1" });
    assert.match(fs.readFileSync(ctxFile(), "utf8"), /## Gotchas[\s\S]*\| s1 \| - \| f1 \| - \|/);
  });
  it("requires context.md and key fields; decisions are project-only", () => {
    assert.throws(() => learn(root, "decision", { decision: "x" }), /--why/);
    assert.throws(() => learn(root, "decision", { decision: "x", why: "y" }, { global: true }), /project-only/);
    fs.rmSync(ctxFile());
    assert.throws(() => learn(root, "gotcha", { symptom: "a", fix: "b" }), /ai-dev-init/);
  });
});

describe("learn --global → ai-dev repo knowledge/", () => {
  it("writes into the repo files", () => {
    fs.copyFileSync(path.join(HERE, "..", "..", "knowledge", "learnings.md"), path.join(general, "learnings.md"));
    const r = learn(root, "note", { learning: "databricks CLI precisa de --profile", applies: "databricks" }, { global: true });
    assert.equal(r.file, path.join(general, "learnings.md"));
    assert.match(fs.readFileSync(r.file, "utf8"), /\| databricks CLI precisa de --profile \| databricks \| - \|$/m);
  });
});

describe("insertRow", () => {
  it("adds a table to a section that has none", () => {
    const r = insertRow("## Gotchas\n\nsome text\n\n## Next\n", "Gotchas", "gotcha", { symptom: "a", fix: "b" });
    assert.match(r.text, /some text\n\n\| Sintoma \| Causa \| Correção \| Origem \|\n\|---\|---\|---\|---\|\n\| a \| - \| b \| - \|\n\n## Next/);
  });
});

describe("brief", () => {
  it("is empty for an untouched context template", () => assert.equal(brief(root), ""));
  it("draws from context.md, reports, discovery, plan and general knowledge", () => {
    let ctx = fs.readFileSync(ctxFile(), "utf8");
    ctx = ctx.replace("[What this project does, why it exists, and what problem it solves]", "API de pedidos para o time de vendas.")
      .replace("- **Language:**", "- **Language:** Python on Databricks");
    fs.writeFileSync(ctxFile(), ctx);
    learn(root, "gotcha", { symptom: "port 3000 busy", fix: "kill old server" });
    learn(root, "decision", { decision: "SQLite em dev", why: "zero setup" });
    fs.writeFileSync(path.join(root, ".ai-dev", "plan.md"), "# Plan\nStatus: approved\n");
    fs.writeFileSync(path.join(root, ".ai-dev", "discovery", "tables-findings.md"), "x");
    fs.writeFileSync(path.join(root, ".ai-dev", "reports", "delivery-001.md"), "## O que foi feito\nx\n## Conhecimento\n\n- **Gotcha:** cluster demora 6 min para subir\n\n## Observações\n");
    learn(root, "note", { learning: "rode bundle validate antes de deploy", applies: "databricks" }, { global: true });
    learn(root, "note", { learning: "use pnpm", applies: "frontend" }, { global: true });
    learn(root, "note", { learning: "commits em pt-BR", applies: "all" }, { global: true });
    const b = brief(root, { harnessStatus: "Features 3/10 passing" });
    for (const s of ["API de pedidos", "port 3000 busy", "SQLite em dev", "cluster demora 6 min", "approved", "tables-findings.md", "bundle validate", "pt-BR", "3/10"]) assert.ok(b.includes(s), s);
    assert.ok(!b.includes("use pnpm"), "irrelevant general learning filtered out");
    assert.ok(!b.includes("Credenciais"), "credentials section never injected");
  });
  it("respects the size budget", () => {
    for (let i = 0; i < 200; i += 1) learn(root, "gotcha", { symptom: `symptom number ${i} `.repeat(5), fix: "f" });
    assert.ok(brief(root, { maxChars: 3000 }).length <= 3100);
  });
});

describe("recall", () => {
  it("searches the whole .ai-dev and general knowledge, ranked", () => {
    learn(root, "gotcha", { symptom: "login redirect loop", cause: "cookie samesite", fix: "SameSite=Lax" });
    fs.writeFileSync(path.join(root, ".ai-dev", "discovery", "auth-findings.md"), "## Auth\n\nLogin uses a session cookie set by the gateway.\n");
    learn(root, "gotcha", { symptom: "cookie lost behind proxy", fix: "trust proxy" }, { global: true });
    const hits = recall(root, "login cookie");
    assert.equal(hits[0].scope, "context");
    assert.match(hits[0].text, /redirect loop/);
    assert.ok(hits.some((h) => h.scope === "discovery"));
    assert.ok(hits.some((h) => h.scope === "geral"));
  });
});

describe("SessionStart hook", () => {
  const hook = (input) => spawnSync(process.execPath, [CLI, "brief", "--hook"], {
    input: JSON.stringify(input), encoding: "utf8", env: { ...process.env, AIDEV_HOME: home, AIDEV_KNOWLEDGE_DIR: general },
  });
  it("is silent when ai-dev is OFF", () => {
    learn(root, "gotcha", { symptom: "x y", fix: "z" });
    assert.equal(hook({ cwd: root, source: "startup" }).stdout, "");
  });
  it("emits additionalContext when ON, from a subfolder, and marks compaction", () => {
    fs.writeFileSync(path.join(home, "enabled"), "");
    learn(root, "gotcha", { symptom: "flaky e2e", fix: "wait for network idle" });
    fs.mkdirSync(path.join(root, "src", "deep"), { recursive: true });
    const json = JSON.parse(hook({ cwd: path.join(root, "src", "deep"), source: "compact" }).stdout);
    assert.equal(json.hookSpecificOutput.hookEventName, "SessionStart");
    assert.match(json.hookSpecificOutput.additionalContext, /compaction[\s\S]*flaky e2e/);
  });
});

describe("aidev sync", () => {
  it("commits general knowledge in its git repo without pushing", () => {
    const repo = tmp("aidev-repo-");
    const git = (...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8" });
    git("init", "-q");
    git("config", "user.email", "t@t");
    git("config", "user.name", "t");
    fs.mkdirSync(path.join(repo, "knowledge"));
    const env = { ...process.env, AIDEV_HOME: home, AIDEV_KNOWLEDGE_DIR: path.join(repo, "knowledge") };
    spawnSync(process.execPath, [CLI, "learn", "note", "--global", "--learning", "x", "--root", root], { env });
    const r = spawnSync(process.execPath, [CLI, "sync", "--no-push"], { env, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    assert.match(git("log", "--oneline"), /knowledge:/);
    const again = spawnSync(process.execPath, [CLI, "sync", "--no-push"], { env, encoding: "utf8" });
    assert.match(again.stdout, /nothing new/);
  });
});
