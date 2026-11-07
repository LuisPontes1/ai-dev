import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "aidev.mjs");
const run = (root, ...args) => spawnSync(process.execPath, [CLI, ...args, "--root", root], { encoding: "utf8" });

function project() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aidev-cli-"));
  const h = path.join(root, ".ai-dev", "harness");
  fs.mkdirSync(h, { recursive: true });
  fs.writeFileSync(path.join(h, "features.json"), JSON.stringify([
    { id: "F-001", priority: 1, description: "user can sign up", steps: ["open /signup"], passes: false },
    { id: "F-002", priority: 2, description: "user can log in", steps: ["open /login"], passes: false },
  ]));
  fs.writeFileSync(path.join(h, "init.sh"), "#!/usr/bin/env bash\n");
  return root;
}

describe("aidev CLI", () => {
  it("runs the full session loop", () => {
    const root = project();
    assert.equal(run(root, "validate").status, 0);
    assert.equal(run(root, "freeze").status, 0);
    assert.match(run(root, "next").stdout, /F-001/);
    assert.notEqual(run(root, "pass", "F-001").status, 0, "pass without evidence must fail");
    assert.equal(run(root, "pass", "F-001", "--evidence", "shots/f1.png", "--session", "1").status, 0);
    assert.equal(run(root, "guard").status, 0);
    assert.equal(run(root, "progress", "add", "--feature", "F-001", "--result", "passed", "--summary", "signup", "--state", "clean", "--next", "F-002").status, 0);
    assert.match(run(root, "progress", "tail").stdout, /Session 1/);
    const status = JSON.parse(run(root, "status", "--json").stdout);
    assert.equal(status.passing, 1);
    assert.equal(status.next, "F-002");
  });
  it("guard exits 2 when a test is rewritten", () => {
    const root = project();
    run(root, "freeze");
    const file = path.join(root, ".ai-dev", "harness", "features.json");
    const doc = JSON.parse(fs.readFileSync(file, "utf8"));
    doc[1].steps = ["skip"];
    fs.writeFileSync(file, JSON.stringify(doc));
    const r = run(root, "guard");
    assert.equal(r.status, 2);
    assert.match(r.stdout, /edited:\s+F-002/);
  });
  it("doctor reports missing context.md, then checks its paths", () => {
    const root = project();
    run(root, "freeze");
    let r = run(root, "doctor");
    assert.equal(r.status, 1);
    assert.match(r.stdout, /context\.md exists/);
    fs.writeFileSync(path.join(root, ".ai-dev", "context.md"), "## Estrutura do repositório\n\n`src/gone.js` used to be here\n");
    r = run(root, "doctor");
    assert.match(r.stdout, /stale: src\/gone\.js/);
    run(root, "map");
    assert.ok(fs.existsSync(path.join(root, ".ai-dev", "discovery", "inventory.md")));
  });
});
