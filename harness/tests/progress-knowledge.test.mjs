import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { appendEntry, nextSessionNumber, tail } from "../lib/progress.mjs";
import { checkMap, extractPaths, renderGenerated, scan } from "../lib/knowledge.mjs";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "aidev-"));

describe("progress", () => {
  it("numbers sessions and tails the last N", () => {
    const dir = tmp();
    const file = path.join(dir, "progress.md");
    for (let i = 0; i < 4; i += 1) {
      appendEntry(file, { feature: `F-00${i}`, result: "passed", summary: "s", state: "clean", next: "n" });
    }
    const text = fs.readFileSync(file, "utf8");
    assert.equal(nextSessionNumber(text), 5);
    const t = tail(text, 2);
    assert.match(t, /^## Session 3/);
    assert.match(t, /## Session 4/);
    assert.doesNotMatch(t, /## Session 2/);
  });
  it("tail of empty log is empty", () => assert.equal(tail("# Progress log\n"), ""));
});

describe("knowledge map", () => {
  it("extracts repo-looking paths only", () => {
    const md = "See `src/auth/login.ts:12`, `README.md`, `npm test`, `https://x.y`, `~/.claude/x`, `src/*`, `src/...`.";
    assert.deepEqual(extractPaths(md).sort(), ["README.md", "src/auth/login.ts"]);
  });
  it("scans a directory and checks the curated map", () => {
    const dir = tmp();
    fs.mkdirSync(path.join(dir, "src", "api"), { recursive: true });
    fs.mkdirSync(path.join(dir, "web"));
    fs.writeFileSync(path.join(dir, "src", "api", "server.js"), "a\nb\n");
    fs.writeFileSync(path.join(dir, "web", "index.html"), "<p>\n");
    fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ scripts: { test: "node --test" } }));
    const inv = scan(dir);
    assert.equal(inv.fileCount, 3);
    assert.ok(inv.commands.some((c) => c.cmd === "npm run test"));
    assert.match(renderGenerated(inv), /src\/api/);
    fs.mkdirSync(path.join(dir, ".ai-dev", "discovery"), { recursive: true });
    fs.writeFileSync(path.join(dir, ".ai-dev", "discovery", "inventory.md"), "");
    const r = checkMap(dir, "API lives in `src/api/server.js`; old code was `src/legacy/x.js`; see `discovery/inventory.md`.", inv);
    assert.deepEqual(r.stale, ["src/legacy/x.js"]);
    assert.deepEqual(r.uncovered, ["web"]);
  });
});
