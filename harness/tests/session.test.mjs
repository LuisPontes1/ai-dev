import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  activePersona, checkpoint, compactionInstructions, planSummary, readHandoff, readTasks, recordSummary,
  restoreBlock, sessionLogTail, setHandoff, transcriptDigest,
} from "../lib/session.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, "..", "..");
const CLI = path.join(HERE, "..", "aidev.mjs");
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));

let root;
let home;
const ai = (...p) => path.join(root, ".ai-dev", ...p);

function task(id, title, status, persona = "none", executor = "claude-code") {
  fs.writeFileSync(ai("tasks", `${id}.md`), `# Task ${id.slice(5)} — ${title}\n\nStatus: ${status}\n<!-- pending | in-progress -->\n\nType: implementation\n\n- **Agente:** \`${executor}\`\n- **Persona:** \`${persona}\`\n`);
}

function transcript(file) {
  const lines = [
    { type: "user", message: { role: "user", content: "vamos fazer o login com JWT" } },
    { type: "assistant", message: { content: [{ type: "tool_use", name: "Read", input: { file_path: "/home/u/.claude/ai-dev/planning.md" } }] } },
    { type: "user", message: { role: "user", content: [{ type: "tool_result", content: "…" }] } },
    { type: "user", isMeta: true, message: { role: "user", content: "meta stuff" } },
    { type: "user", message: { role: "user", content: "<system-reminder>noise</system-reminder>" } },
    { type: "assistant", message: { content: [{ type: "tool_use", name: "Read", input: { file_path: "/home/u/.claude/ai-dev/personas/security.md" } }, { type: "tool_use", name: "Skill", input: { skill: "superpowers:systematic-debugging" } }] } },
    { type: "user", message: { role: "user", content: [{ type: "text", text: "não usa cookie, só header Authorization" }] } },
  ];
  fs.writeFileSync(file, `{"truncated line\n${lines.map((l) => JSON.stringify(l)).join("\n")}\n`);
}

beforeEach(() => {
  root = tmp("aidev-sess-");
  home = tmp("aidev-home-");
  process.env.AIDEV_HOME = home;
  process.env.AIDEV_KNOWLEDGE_DIR = tmp("aidev-gen-");
  fs.mkdirSync(path.join(home, "personas"), { recursive: true });
  fs.copyFileSync(path.join(REPO, "install", "personas", "security.md"), path.join(home, "personas", "security.md"));
  fs.mkdirSync(ai("tasks"), { recursive: true });
  fs.copyFileSync(path.join(REPO, "templates", "context.md"), ai("context.md"));
  fs.copyFileSync(path.join(REPO, "templates", "session-log.md"), ai("session-log.md"));
  fs.writeFileSync(ai("plan.md"), "# Plan\n\nStatus: approved\n");
  task("task-001", "Criar modelo User", "done");
  task("task-002", "Criar middleware JWT", "in-progress", "security");
  task("task-003", "Testes de integração", "pending", "tdd", "copilot");
  fs.writeFileSync(ai("tasks", "task-002-prompt.md"), "prompt");
});

describe("plan, tasks, session log", () => {
  it("reads tasks (skipping prompt files) and summarizes the plan", () => {
    assert.deepEqual(readTasks(root).map((t) => t.id), ["task-001", "task-002", "task-003"]);
    const s = planSummary(root);
    assert.match(s, /Plan: approved · 3 tasks: 1 done, 1 in-progress, 1 pending/);
    assert.match(s, /running : task-002 — Criar middleware JWT \(claude-code · persona security\)/);
    assert.match(s, /next {4}: task-003/);
  });
  it("tails real session-log entries, both table rows and [ts] lines, skipping template examples", () => {
    const log = ai("session-log.md");
    fs.appendFileSync(log, "[2026-11-07 10:00] Subagent task-001 completed. Status: done.\n");
    assert.equal(sessionLogTail(root), "[2026-11-07 10:00] Subagent task-001 completed. Status: done.");
  });
});

describe("handoff", () => {
  it("sets fields, keeps others, rejects unknown ones", () => {
    setHandoff(root, { foco: "task-002 — middleware JWT", proximo: "rodar testes" }, new Date("2026-11-07T10:00:00Z"));
    setHandoff(root, { aguardando: "aprovar uso de RS256" });
    const { state } = readHandoff(root);
    assert.equal(state.foco, "task-002 — middleware JWT");
    assert.equal(state.proximo, "rodar testes");
    assert.equal(state.aguardando, "aprovar uso de RS256");
    assert.throws(() => setHandoff(root, { humor: "bom" }), /unknown field/);
  });
  it("active persona: handoff wins, else the running task's persona, with the persona text", () => {
    let p = activePersona(root);
    assert.equal(p.name, "security");
    assert.equal(p.task, "task-002");
    assert.match(p.text, /OWASP|security/i);
    setHandoff(root, { persona: "none" });
    assert.equal(activePersona(root).name, "security");
  });
});

describe("transcript digest", () => {
  it("extracts user words, loaded protocols and skills; ignores tool results, meta and reminders", () => {
    const f = path.join(root, "t.jsonl");
    transcript(f);
    const d = transcriptDigest(f);
    assert.deepEqual(d.user, ["vamos fazer o login com JWT", "não usa cookie, só header Authorization"]);
    assert.deepEqual(d.protocols, ["~/.claude/ai-dev/planning.md", "~/.claude/ai-dev/personas/security.md"]);
    assert.deepEqual(d.skills, ["superpowers:systematic-debugging"]);
  });
  it("is empty for a missing transcript", () => assert.deepEqual(transcriptDigest(null).user, []));
});

describe("compaction cycle", () => {
  it("checkpoint → instructions → summary check → restore", () => {
    const f = path.join(root, "t.jsonl");
    transcript(f);
    setHandoff(root, { foco: "task-002 — middleware JWT", aguardando: "aprovar RS256" });
    const info = checkpoint(root, { trigger: "auto", transcriptPath: f });
    const h = fs.readFileSync(ai("handoff.md"), "utf8");
    assert.match(h, /## Snapshot automático[\s\S]*Persona ativa:\*\* security \(task-002\)/);
    assert.match(h, /não usa cookie, só header Authorization/);
    assert.match(fs.readFileSync(ai("session-log.md"), "utf8"), /\| \d{4}-\d{2}-\d{2} \d{2}:\d{2} \| Compaction \(auto\) — checkpoint saved/);

    const instr = compactionInstructions(root, info);
    for (const s of ["ai-dev PM", "task-002", "security", "never turn a pending question into an approval", "planning.md", "aprovar RS256", "read .ai-dev/handoff.md"]) assert.ok(instr.includes(s), s);
    assert.ok(instr.length < 10000);

    const bad = recordSummary(root, "We discussed some code changes.");
    assert.deepEqual(bad.missing, ["ai-dev / PM role", 'focus "task-002 — middleware JWT"', 'persona "security"']);
    const good = recordSummary(root, "ai-dev PM. Working on task-002 with the security persona.");
    assert.deepEqual(good.missing, []);
    recordSummary(root, "lost everything");

    const r = restoreBlock(root, "compact");
    for (const s of ["você é o PM do ai-dev", "Releia antes de agir", "planning.md", "A compactação perdeu", "aprovar RS256", "Persona ativa: security", "OWASP", "task-002 — Criar middleware JWT", "não usa cookie"]) assert.ok(r.includes(s), s);
  });
  it("startup restore has handoff and plan but no identity block or full persona text", () => {
    setHandoff(root, { foco: "task-002" });
    const r = restoreBlock(root, "startup");
    assert.ok(!r.includes("Restauração"));
    assert.match(r, /Handoff[\s\S]*task-002/);
    assert.ok(!r.includes("OWASP"));
  });
});

describe("hooks via CLI", () => {
  const hook = (args, input) => spawnSync(process.execPath, [CLI, ...args], {
    input: JSON.stringify(input), encoding: "utf8", env: { ...process.env, AIDEV_HOME: home },
  });
  beforeEach(() => fs.writeFileSync(path.join(home, "enabled"), ""));

  it("PreCompact prints plain-text instructions and saves the snapshot; PostCompact stores the summary", () => {
    const f = path.join(root, "t.jsonl");
    transcript(f);
    const pre = hook(["compact", "pre", "--hook"], { cwd: path.join(root, ".ai-dev"), hook_event_name: "PreCompact", trigger: "manual", transcript_path: f });
    assert.equal(pre.status, 0);
    assert.match(pre.stdout, /^This conversation runs the ai-dev system/);
    assert.ok(fs.existsSync(ai("handoff.md")));
    const post = hook(["compact", "post", "--hook"], { cwd: root, hook_event_name: "PostCompact", compact_summary: "short" });
    assert.equal(post.status, 0);
    assert.match(fs.readFileSync(ai("handoff.md"), "utf8"), /## Último resumo de compactação[\s\S]*short/);
  });
  it("SessionStart(compact) restores state first and stays under the 10k cap", () => {
    for (let i = 0; i < 300; i += 1) fs.appendFileSync(ai("context.md"), "");
    const r = hook(["brief", "--hook"], { cwd: root, hook_event_name: "SessionStart", source: "compact" });
    const ctx = JSON.parse(r.stdout).hookSpecificOutput;
    assert.equal(ctx.hookEventName, "SessionStart");
    assert.ok(ctx.additionalContext.indexOf("você é o PM") < ctx.additionalContext.indexOf("Plano"));
    assert.ok(ctx.additionalContext.length <= 9500);
  });
  it("SubagentStart injects subagent context, not the PM identity", () => {
    fs.writeFileSync(ai("context.md"), "## Objetivo do projeto\n\nAPI de pedidos.\n");
    const r = hook(["brief", "--hook"], { cwd: root, hook_event_name: "SubagentStart", agent_type: "general-purpose" });
    const ctx = JSON.parse(r.stdout).hookSpecificOutput;
    assert.equal(ctx.hookEventName, "SubagentStart");
    assert.match(ctx.additionalContext, /subagente do ai-dev[\s\S]*API de pedidos/);
    assert.ok(!ctx.additionalContext.includes("você é o PM"));
  });
  it("all hooks are silent outside an .ai-dev project and never fail", () => {
    const elsewhere = tmp("aidev-none-");
    for (const args of [["brief", "--hook"], ["compact", "pre", "--hook"], ["compact", "post", "--hook"]]) {
      const r = hook(args, { cwd: elsewhere, source: "compact" });
      assert.equal(r.status, 0);
      assert.equal(r.stdout, "");
    }
  });
});
