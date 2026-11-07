import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildLock, guard, markFail, markPass, markRegressed, nextFeature, summarize, unblock, validate,
} from "../lib/features.mjs";

const make = () => ({
  version: 1,
  features: [
    { id: "F-001", category: "auth", priority: 1, description: "user can sign up", steps: ["open /signup", "submit form", "see dashboard"], verify: "browser", passes: false },
    { id: "F-002", category: "auth", priority: 2, description: "user can reset password", steps: ["open /reset"], verify: "browser", passes: false },
    { id: "F-003", category: "chat", priority: 1, description: "new chat button", steps: ["click new chat"], passes: false },
  ],
});

describe("validate", () => {
  it("accepts a well-formed list", () => assert.deepEqual(validate(make()), []));
  it("rejects missing steps, duplicate ids and bad verify", () => {
    const d = make();
    d.features[1].steps = [];
    d.features[2].id = "F-001";
    d.features[0].verify = "vibes";
    const errs = validate(d).join("\n");
    assert.match(errs, /steps/);
    assert.match(errs, /duplicate/);
    assert.match(errs, /verify/);
  });
  it("rejects passes:true without evidence", () => {
    const d = make();
    d.features[0].passes = true;
    assert.match(validate(d).join(), /evidence/);
  });
});

describe("nextFeature", () => {
  it("picks lowest priority number, file order on ties", () => {
    assert.equal(nextFeature(make()).id, "F-001");
  });
  it("skips passing and blocked features", () => {
    const d = make();
    markPass(d, "F-001", { evidence: "shot.png" });
    d.features[2].blocked = true;
    assert.equal(nextFeature(d).id, "F-002");
  });
  it("returns null when nothing is left", () => {
    const d = make();
    for (const f of d.features) markPass(d, f.id, { evidence: "x" });
    assert.equal(nextFeature(d), null);
  });
});

describe("state transitions", () => {
  it("pass requires evidence", () => {
    assert.throws(() => markPass(make(), "F-001", {}), /evidence/);
  });
  it("fail increments attempts and blocks at the limit", () => {
    const d = make();
    markFail(d, "F-002", { note: "a", maxAttempts: 2 });
    assert.equal(d.features[1].blocked, undefined);
    markFail(d, "F-002", { note: "b", maxAttempts: 2 });
    assert.equal(d.features[1].blocked, true);
    unblock(d, "F-002");
    assert.equal(d.features[1].attempts, 0);
  });
  it("regress clears passes and evidence", () => {
    const d = make();
    markPass(d, "F-001", { evidence: "x" });
    markRegressed(d, "F-001", { note: "signup 500s" });
    assert.equal(d.features[0].passes, false);
    assert.equal(d.features[0].evidence, null);
    assert.match(d.features[0].notes, /REGRESSION/);
  });
  it("summarize counts by category", () => {
    const d = make();
    markPass(d, "F-001", { evidence: "x" });
    const s = summarize(d);
    assert.equal(s.passing, 1);
    assert.deepEqual(s.byCategory.auth, { total: 2, passing: 1 });
  });
});

describe("guard", () => {
  it("allows state changes", () => {
    const d = make();
    const lock = buildLock(d);
    markPass(d, "F-001", { evidence: "x", session: 4 });
    markFail(d, "F-002", { note: "n" });
    assert.equal(guard(d, lock).ok, true);
  });
  it("catches a reworded feature", () => {
    const d = make();
    const lock = buildLock(d);
    d.features[1].steps = ["trust me"];
    const r = guard(d, lock);
    assert.equal(r.ok, false);
    assert.deepEqual(r.edited, ["F-002"]);
  });
  it("catches a deleted feature", () => {
    const d = make();
    const lock = buildLock(d);
    d.features.pop();
    assert.deepEqual(guard(d, lock).removed, ["F-003"]);
  });
  it("allows new features only if they start failing", () => {
    const d = make();
    const lock = buildLock(d);
    d.features.push({ id: "F-004", description: "x", steps: ["y"], passes: false });
    assert.equal(guard(d, lock).ok, true);
    d.features[3].passes = true;
    assert.deepEqual(guard(d, lock).addedPassing, ["F-004"]);
  });
  it("is insensitive to key order", () => {
    const d = make();
    const lock = buildLock(d);
    const f = d.features[0];
    d.features[0] = { passes: f.passes, steps: f.steps, verify: f.verify, description: f.description, priority: f.priority, category: f.category, id: f.id };
    assert.equal(guard(d, lock).ok, true);
  });
});
