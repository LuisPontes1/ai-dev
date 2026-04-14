import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

// ── renderTaskResult ────────────────────────────────────────────────────────

// Import render directly — it has no heavy deps
import { renderTaskResult } from "../scripts/lib/render.mjs";

describe("renderTaskResult", () => {
  it("returns rawOutput when present", () => {
    const result = renderTaskResult(
      { rawOutput: "Files created successfully.", failureMessage: "" },
      { title: "Task", write: true }
    );
    assert.equal(result, "Files created successfully.\n");
  });

  it("does not double-append newline when rawOutput already ends with one", () => {
    const result = renderTaskResult(
      { rawOutput: "Done.\n", failureMessage: "" },
      { title: "Task", write: false }
    );
    assert.equal(result, "Done.\n");
  });

  it("returns tool execution message when no rawOutput but tools executed", () => {
    const result = renderTaskResult(
      { rawOutput: "", failureMessage: "", toolsExecuted: true },
      { title: "Task", write: true }
    );
    assert.equal(result, "Task completed via tool execution.\n");
  });

  it("returns failure message when no rawOutput and no tools", () => {
    const result = renderTaskResult(
      { rawOutput: "", failureMessage: "Something went wrong." },
      { title: "Task", write: false }
    );
    assert.equal(result, "Something went wrong.\n");
  });

  it("returns default failure when no rawOutput, no tools, no failureMessage", () => {
    const result = renderTaskResult(
      { rawOutput: "", failureMessage: "" },
      { title: "Task", write: false }
    );
    assert.equal(result, "Copilot did not return a final message.\n");
  });

  it("does not treat toolsExecuted=false as success", () => {
    const result = renderTaskResult(
      { rawOutput: "", failureMessage: "", toolsExecuted: false },
      { title: "Task", write: false }
    );
    assert.equal(result, "Copilot did not return a final message.\n");
  });

  it("handles null parsedResult gracefully", () => {
    const result = renderTaskResult(null, { title: "Task", write: false });
    assert.equal(result, "Copilot did not return a final message.\n");
  });

  it("handles undefined parsedResult gracefully", () => {
    const result = renderTaskResult(undefined, { title: "Task", write: false });
    assert.equal(result, "Copilot did not return a final message.\n");
  });
});

// ── parseStructuredOutput ───────────────────────────────────────────────────

import { parseStructuredOutput } from "../scripts/lib/copilot-client.mjs";

describe("parseStructuredOutput", () => {
  it("parses valid JSON", () => {
    const result = parseStructuredOutput('{"summary":"ok"}');
    assert.deepEqual(result.parsed, { summary: "ok" });
    assert.equal(result.parseError, null);
  });

  it("returns error for empty rawOutput", () => {
    const result = parseStructuredOutput("");
    assert.equal(result.parsed, null);
    assert.equal(result.parseError, "Copilot did not return a final structured message.");
  });

  it("uses fallback.failureMessage when rawOutput is empty", () => {
    const result = parseStructuredOutput("", { failureMessage: "Custom error" });
    assert.equal(result.parseError, "Custom error");
  });

  it("returns parse error for invalid JSON", () => {
    const result = parseStructuredOutput("not json");
    assert.equal(result.parsed, null);
    assert.ok(result.parseError.length > 0);
  });
});

// ── Success detection logic (unit test of the pattern) ──────────────────────

describe("task success detection", () => {
  function computeSuccess(rawOutput, toolCalls) {
    const completedTools = (toolCalls ?? []).filter(t => t.status === "completed");
    const hasToolWork = completedTools.length > 0;
    return Boolean(rawOutput) || hasToolWork;
  }

  it("succeeds with rawOutput only", () => {
    assert.ok(computeSuccess("some output", []));
  });

  it("succeeds with tool calls only (no rawOutput)", () => {
    assert.ok(computeSuccess("", [{ name: "write_file", status: "completed" }]));
  });

  it("succeeds with both rawOutput and tool calls", () => {
    assert.ok(computeSuccess("output", [{ name: "write_file", status: "completed" }]));
  });

  it("fails with no rawOutput and no tool calls", () => {
    assert.ok(!computeSuccess("", []));
  });

  it("fails with no rawOutput and only failed tool calls", () => {
    assert.ok(!computeSuccess("", [{ name: "write_file", status: "failed" }]));
  });

  it("fails with no rawOutput and running (incomplete) tool calls", () => {
    assert.ok(!computeSuccess("", [{ name: "write_file", status: "running" }]));
  });

  it("handles null toolCalls", () => {
    assert.ok(!computeSuccess("", null));
  });

  it("handles undefined toolCalls", () => {
    assert.ok(!computeSuccess("", undefined));
  });

  it("succeeds when mix of completed and failed tools", () => {
    assert.ok(computeSuccess("", [
      { name: "read_file", status: "failed" },
      { name: "write_file", status: "completed" }
    ]));
  });

  it("succeeds with multiple completed tools", () => {
    assert.ok(computeSuccess("", [
      { name: "write_file", status: "completed" },
      { name: "write_file", status: "completed" },
      { name: "edit_file", status: "completed" }
    ]));
  });
});

// ── toolCalls tracking logic (mirrors runPrompt event handling) ─────────────

describe("toolCalls tracking (by toolCallId)", () => {
  function simulateEvents(events) {
    const toolCalls = [];
    for (const event of events) {
      switch (event.type) {
        case "tool.execution_start":
          toolCalls.push({
            id: event.data.toolCallId,
            name: event.data.toolName,
            arguments: event.data.arguments ?? null,
            status: "running"
          });
          break;
        case "tool.execution_complete": {
          const status = event.data.success ? "completed" : "failed";
          const tracked = toolCalls.find(t => t.id === event.data.toolCallId);
          if (tracked) tracked.status = status;
          break;
        }
      }
    }
    return toolCalls;
  }

  it("tracks a single tool start→complete", () => {
    const calls = simulateEvents([
      { type: "tool.execution_start", data: { toolCallId: "c1", toolName: "create" } },
      { type: "tool.execution_complete", data: { toolCallId: "c1", success: true } }
    ]);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].name, "create");
    assert.equal(calls[0].status, "completed");
  });

  it("tracks multiple different tools", () => {
    const calls = simulateEvents([
      { type: "tool.execution_start", data: { toolCallId: "c1", toolName: "view" } },
      { type: "tool.execution_complete", data: { toolCallId: "c1", success: true } },
      { type: "tool.execution_start", data: { toolCallId: "c2", toolName: "create" } },
      { type: "tool.execution_complete", data: { toolCallId: "c2", success: true } }
    ]);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].status, "completed");
    assert.equal(calls[1].status, "completed");
  });

  it("tracks same tool name called twice with different IDs", () => {
    const calls = simulateEvents([
      { type: "tool.execution_start", data: { toolCallId: "c1", toolName: "create" } },
      { type: "tool.execution_complete", data: { toolCallId: "c1", success: true } },
      { type: "tool.execution_start", data: { toolCallId: "c2", toolName: "create" } },
      { type: "tool.execution_complete", data: { toolCallId: "c2", success: false } }
    ]);
    assert.equal(calls[0].status, "completed");
    assert.equal(calls[1].status, "failed");
  });

  it("handles concurrent tools — matches by ID, not by name", () => {
    const calls = simulateEvents([
      { type: "tool.execution_start", data: { toolCallId: "c1", toolName: "view" } },
      { type: "tool.execution_start", data: { toolCallId: "c2", toolName: "create" } },
      { type: "tool.execution_complete", data: { toolCallId: "c1", success: true } },
      { type: "tool.execution_complete", data: { toolCallId: "c2", success: true } }
    ]);
    assert.equal(calls[0].name, "view");
    assert.equal(calls[0].status, "completed");
    assert.equal(calls[1].name, "create");
    assert.equal(calls[1].status, "completed");
  });

  it("concurrent same-name tools resolved correctly by ID", () => {
    const calls = simulateEvents([
      { type: "tool.execution_start", data: { toolCallId: "c1", toolName: "create" } },
      { type: "tool.execution_start", data: { toolCallId: "c2", toolName: "create" } },
      { type: "tool.execution_complete", data: { toolCallId: "c2", success: true } },
      { type: "tool.execution_complete", data: { toolCallId: "c1", success: false } }
    ]);
    assert.equal(calls[0].id, "c1");
    assert.equal(calls[0].status, "failed");
    assert.equal(calls[1].id, "c2");
    assert.equal(calls[1].status, "completed");
  });

  it("tool that starts but never completes stays as running", () => {
    const calls = simulateEvents([
      { type: "tool.execution_start", data: { toolCallId: "c1", toolName: "create" } }
    ]);
    assert.equal(calls[0].status, "running");
  });

  it("complete event without matching start is ignored (no crash)", () => {
    const calls = simulateEvents([
      { type: "tool.execution_complete", data: { toolCallId: "ghost", success: true } }
    ]);
    assert.equal(calls.length, 0);
  });

  it("preserves tool arguments from start event", () => {
    const calls = simulateEvents([
      { type: "tool.execution_start", data: { toolCallId: "c1", toolName: "create", arguments: { path: "/tmp/f.txt", file_text: "hi" } } },
      { type: "tool.execution_complete", data: { toolCallId: "c1", success: true } }
    ]);
    assert.deepEqual(calls[0].arguments, { path: "/tmp/f.txt", file_text: "hi" });
    assert.equal(calls[0].status, "completed");
  });
});

// ── touchedFiles mtime detection (unit test of the pattern) ─────────────────

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("touchedFiles mtime detection", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aidev-test-"));
  });

  function snapshotMtimes(files) {
    const map = new Map();
    for (const f of files) {
      try { map.set(f, fs.statSync(path.join(tmpDir, f)).mtimeMs); } catch {}
    }
    return map;
  }

  function detectTouched(preMtimes, allPostFiles) {
    return allPostFiles.filter(f => {
      const preMtime = preMtimes.get(f);
      if (preMtime === undefined) return true;
      try {
        return fs.statSync(path.join(tmpDir, f)).mtimeMs !== preMtime;
      } catch { return true; }
    });
  }

  it("detects newly created files", () => {
    const pre = snapshotMtimes([]);
    fs.writeFileSync(path.join(tmpDir, "new.txt"), "hello");
    const touched = detectTouched(pre, ["new.txt"]);
    assert.deepEqual(touched, ["new.txt"]);
  });

  it("detects modified files via mtime change", async () => {
    fs.writeFileSync(path.join(tmpDir, "existing.txt"), "v1");
    const pre = snapshotMtimes(["existing.txt"]);

    // need a small delay to guarantee mtime differs
    await new Promise(r => setTimeout(r, 50));
    fs.writeFileSync(path.join(tmpDir, "existing.txt"), "v2");

    const touched = detectTouched(pre, ["existing.txt"]);
    assert.deepEqual(touched, ["existing.txt"]);
  });

  it("excludes untouched files", () => {
    fs.writeFileSync(path.join(tmpDir, "unchanged.txt"), "same");
    const pre = snapshotMtimes(["unchanged.txt"]);
    // don't modify the file
    const touched = detectTouched(pre, ["unchanged.txt"]);
    assert.deepEqual(touched, []);
  });

  it("handles mix of new, modified, and untouched", async () => {
    fs.writeFileSync(path.join(tmpDir, "keep.txt"), "keep");
    fs.writeFileSync(path.join(tmpDir, "edit.txt"), "v1");
    const pre = snapshotMtimes(["keep.txt", "edit.txt"]);

    await new Promise(r => setTimeout(r, 50));
    fs.writeFileSync(path.join(tmpDir, "edit.txt"), "v2");
    fs.writeFileSync(path.join(tmpDir, "brand-new.txt"), "new");

    const touched = detectTouched(pre, ["keep.txt", "edit.txt", "brand-new.txt"]);
    assert.deepEqual(touched.sort(), ["brand-new.txt", "edit.txt"]);
  });

  it("returns empty when no files exist before or after", () => {
    const pre = snapshotMtimes([]);
    const touched = detectTouched(pre, []);
    assert.deepEqual(touched, []);
  });

  it("detects file deleted then recreated as touched", async () => {
    fs.writeFileSync(path.join(tmpDir, "target.txt"), "original");
    const pre = snapshotMtimes(["target.txt"]);

    await new Promise(r => setTimeout(r, 50));
    fs.unlinkSync(path.join(tmpDir, "target.txt"));
    fs.writeFileSync(path.join(tmpDir, "target.txt"), "recreated");

    const touched = detectTouched(pre, ["target.txt"]);
    assert.deepEqual(touched, ["target.txt"]);
  });

  it("treats file that was deleted (no longer stat-able) as touched", () => {
    fs.writeFileSync(path.join(tmpDir, "gone.txt"), "bye");
    const pre = snapshotMtimes(["gone.txt"]);

    fs.unlinkSync(path.join(tmpDir, "gone.txt"));

    // file no longer exists in post but if it were still listed, stat fails → caught
    const touched = detectTouched(pre, ["gone.txt"]);
    assert.deepEqual(touched, ["gone.txt"]);
  });

  it("handles files in subdirectories", async () => {
    fs.mkdirSync(path.join(tmpDir, "src"));
    fs.writeFileSync(path.join(tmpDir, "src", "index.js"), "v1");
    const pre = snapshotMtimes(["src/index.js"]);

    await new Promise(r => setTimeout(r, 50));
    fs.writeFileSync(path.join(tmpDir, "src", "index.js"), "v2");
    fs.mkdirSync(path.join(tmpDir, "src", "lib"));
    fs.writeFileSync(path.join(tmpDir, "src", "lib", "utils.js"), "new");

    const touched = detectTouched(pre, ["src/index.js", "src/lib/utils.js"]);
    assert.deepEqual(touched.sort(), ["src/index.js", "src/lib/utils.js"]);
  });
});
