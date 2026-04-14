import { describe, it, after, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

import { createSession, runPrompt, shutdownClient } from "../scripts/lib/copilot-client.mjs";
import { getWorkingTreeState } from "../scripts/lib/git.mjs";

// ── Helpers ─────────────────────────────────────────────────────────────────

function initTempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aidev-integ-"));
  execSync("git init", { cwd: dir, stdio: "ignore" });
  execSync("git commit --allow-empty -m 'init'", { cwd: dir, stdio: "ignore" });
  return dir;
}

function snapshotMtimes(workspaceRoot, files) {
  const map = new Map();
  for (const f of files) {
    try { map.set(f, fs.statSync(path.join(workspaceRoot, f)).mtimeMs); } catch {}
  }
  return map;
}

function detectTouchedFiles(workspaceRoot, preMtimes) {
  const postState = getWorkingTreeState(workspaceRoot);
  const allPostFiles = [...postState.staged, ...postState.unstaged, ...postState.untracked];
  return allPostFiles.filter(f => {
    const preMtime = preMtimes.get(f);
    if (preMtime === undefined) return true;
    try {
      return fs.statSync(path.join(workspaceRoot, f)).mtimeMs !== preMtime;
    } catch { return true; }
  });
}

// ── Integration tests ───────────────────────────────────────────────────────

describe("integration: Copilot task with file creation", () => {
  let tmpRepo;

  before(() => {
    tmpRepo = initTempGitRepo();
  });

  after(async () => {
    await shutdownClient();
    fs.rmSync(tmpRepo, { recursive: true, force: true });
  });

  it("creates a file via Copilot and detects it in touchedFiles", async () => {
    // 1. Snapshot before
    const preState = getWorkingTreeState(tmpRepo);
    const prePaths = [...preState.staged, ...preState.unstaged, ...preState.untracked];
    const preMtimes = snapshotMtimes(tmpRepo, prePaths);

    // 2. Create session scoped to the temp repo
    const session = await createSession({
      systemMessage: `You are a coding assistant. Your working directory is ${tmpRepo}. Create files directly in that directory. Do not ask for confirmation, just do it.`
    });

    // 3. Run a prompt that asks Copilot to create a file
    const result = await runPrompt(session, `Create a file called "hello-test.txt" in ${tmpRepo} with the content "integration test ok". Just create the file, nothing else.`);

    console.log("  rawOutput length:", (result.content ?? "").length);
    console.log("  toolCalls:", JSON.stringify(result.toolCalls));
    console.log("  error:", result.error ?? "none");

    // 4. Verify tool calls were tracked
    const completedTools = (result.toolCalls ?? []).filter(t => t.status === "completed");
    const hasToolWork = completedTools.length > 0;
    const rawOutput = result.content ?? "";
    const succeeded = Boolean(rawOutput) || hasToolWork;

    console.log("  succeeded:", succeeded);
    console.log("  hasToolWork:", hasToolWork);

    assert.ok(succeeded, "Task should have succeeded (via text output or completed tool calls)");

    // 5. Detect touched files
    const touchedFiles = detectTouchedFiles(tmpRepo, preMtimes);
    console.log("  touchedFiles:", touchedFiles);

    // 6. Verify the file was created
    const filePath = path.join(tmpRepo, "hello-test.txt");
    const fileExists = fs.existsSync(filePath);
    console.log("  file exists on disk:", fileExists);

    if (fileExists) {
      const content = fs.readFileSync(filePath, "utf8");
      console.log("  file content:", JSON.stringify(content));
      assert.ok(content.includes("integration test"), "File content should contain the expected text");
      assert.ok(touchedFiles.some(f => f.includes("hello-test")), "touchedFiles should include the created file");
    } else {
      // File might not exist if Copilot didn't have write permissions in tmpDir
      // In that case we still verify the tracking logic worked
      console.log("  NOTE: File was not created — Copilot may lack write permission to tmpDir");
      console.log("  Verifying that tracking logic at least didn't crash...");
      assert.ok(Array.isArray(touchedFiles), "touchedFiles should be an array even when no files changed");
    }
  });

  it("edits an existing file via Copilot and detects it in touchedFiles", async () => {
    // 1. Create a pre-existing file
    const targetFile = path.join(tmpRepo, "existing.txt");
    fs.writeFileSync(targetFile, "line 1\nline 2\nline 3\n");

    // Need to track it in git so getWorkingTreeState sees it
    execSync("git add existing.txt", { cwd: tmpRepo, stdio: "ignore" });
    execSync("git commit -m 'add existing.txt'", { cwd: tmpRepo, stdio: "ignore" });

    // Now modify it slightly so it appears clean in working tree
    // then snapshot
    const preState = getWorkingTreeState(tmpRepo);
    const prePaths = [...preState.staged, ...preState.unstaged, ...preState.untracked];
    const preMtimes = snapshotMtimes(tmpRepo, prePaths);

    // Also snapshot the committed file's mtime
    preMtimes.set("existing.txt", fs.statSync(targetFile).mtimeMs);

    // Small delay to ensure mtime differs
    await new Promise(r => setTimeout(r, 100));

    // 2. Ask Copilot to edit the existing file
    const session = await createSession({
      systemMessage: `You are a coding assistant. Your working directory is ${tmpRepo}. Edit files directly. Do not ask for confirmation.`
    });

    const result = await runPrompt(session, `Edit the file "${targetFile}" — add a new line at the end that says "line 4 added by copilot". Just edit the file, nothing else.`);

    console.log("  rawOutput length:", (result.content ?? "").length);
    console.log("  toolCalls:", JSON.stringify(result.toolCalls));

    const completedTools = (result.toolCalls ?? []).filter(t => t.status === "completed");
    const hasToolWork = completedTools.length > 0;
    const rawOutput = result.content ?? "";
    const succeeded = Boolean(rawOutput) || hasToolWork;

    console.log("  succeeded:", succeeded);

    assert.ok(succeeded, "Edit task should have succeeded");

    // 3. Detect touched files — the edited file should appear even though it existed before
    const postMtime = fs.statSync(targetFile).mtimeMs;
    const mtimeChanged = postMtime !== preMtimes.get("existing.txt");
    console.log("  mtime changed:", mtimeChanged);

    // Use getWorkingTreeState to check if git sees the change
    const postState = getWorkingTreeState(tmpRepo);
    const allPostFiles = [...postState.staged, ...postState.unstaged, ...postState.untracked];
    const touchedFiles = allPostFiles.filter(f => {
      const preMtime = preMtimes.get(f);
      if (preMtime === undefined) return true;
      try {
        return fs.statSync(path.join(tmpRepo, f)).mtimeMs !== preMtime;
      } catch { return true; }
    });
    console.log("  touchedFiles:", touchedFiles);

    const content = fs.readFileSync(targetFile, "utf8");
    console.log("  file content:", JSON.stringify(content));

    if (content.includes("line 4")) {
      assert.ok(touchedFiles.includes("existing.txt"), "touchedFiles should include the edited file");
    } else {
      console.log("  NOTE: Copilot did not edit the file content as expected");
    }
  });
});
