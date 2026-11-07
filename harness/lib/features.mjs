// features.mjs — the feature list is the contract between sessions.
//
// Rules enforced here (from "Effective harnesses for long-running agents"):
//   - every feature starts as passes:false
//   - a session may only change the *state* fields of a feature
//   - features are never deleted or reworded to make them "pass"
//   - passes:true requires evidence of an end-to-end check
//
// The definition fields of each feature are hashed into features.lock.json
// when the user approves the list ("freeze"). `guard` compares the current
// file against that lock and fails on any removal or edit.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const STATE_FIELDS = Object.freeze([
  "passes",
  "evidence",
  "attempts",
  "blocked",
  "last_session",
  "notes",
]);

export const DEFINITION_FIELDS = Object.freeze([
  "id",
  "category",
  "priority",
  "description",
  "steps",
  "verify",
  "touches",
]);

export const VERIFY_METHODS = Object.freeze(["browser", "api", "cli", "unit", "manual"]);
export const DEFAULT_MAX_ATTEMPTS = 3;

export function harnessPaths(root) {
  const base = path.join(root, ".ai-dev", "harness");
  return {
    base,
    features: path.join(base, "features.json"),
    lock: path.join(base, "features.lock.json"),
    progress: path.join(base, "progress.md"),
    init: path.join(base, "init.sh"),
    context: path.join(root, ".ai-dev", "context.md"),
    discovery: path.join(root, ".ai-dev", "discovery"),
  };
}

export function loadFeatures(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Feature list not found: ${file}. Run /ai-dev-harness first.`);
  }
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`features.json is not valid JSON: ${err.message}`);
  }
  // Accept the bare-array form from the article as well as the wrapped form.
  if (Array.isArray(doc)) doc = { version: 1, features: doc };
  return doc;
}

export function saveFeatures(file, doc) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(doc, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

export function validate(doc) {
  const errors = [];
  if (!doc || !Array.isArray(doc.features)) {
    return ["features.json must be an array or an object with a \"features\" array"];
  }
  const seen = new Set();
  doc.features.forEach((f, i) => {
    const where = `features[${i}]${f && f.id ? ` (${f.id})` : ""}`;
    if (!f || typeof f !== "object") {
      errors.push(`${where}: must be an object`);
      return;
    }
    if (typeof f.id !== "string" || !f.id) errors.push(`${where}: "id" is required`);
    else if (seen.has(f.id)) errors.push(`${where}: duplicate id`);
    else seen.add(f.id);
    if (typeof f.description !== "string" || !f.description.trim()) {
      errors.push(`${where}: "description" is required`);
    }
    if (!Array.isArray(f.steps) || f.steps.length === 0) {
      errors.push(`${where}: "steps" must list the end-to-end test steps`);
    }
    if (typeof f.passes !== "boolean") errors.push(`${where}: "passes" must be true or false`);
    if (f.priority !== undefined && !Number.isFinite(f.priority)) {
      errors.push(`${where}: "priority" must be a number (1 = highest)`);
    }
    if (f.verify !== undefined && !VERIFY_METHODS.includes(f.verify)) {
      errors.push(`${where}: "verify" must be one of ${VERIFY_METHODS.join(", ")}`);
    }
    if (f.passes === true && !hasEvidence(f)) {
      errors.push(`${where}: passes is true but "evidence" is empty — a feature only passes after an end-to-end check`);
    }
  });
  return errors;
}

function hasEvidence(f) {
  if (typeof f.evidence === "string") return f.evidence.trim().length > 0;
  if (Array.isArray(f.evidence)) return f.evidence.length > 0;
  return false;
}

export function definitionOf(feature) {
  const def = {};
  for (const k of DEFINITION_FIELDS) {
    if (feature[k] !== undefined) def[k] = feature[k];
  }
  return def;
}

export function hashFeature(feature) {
  return createHash("sha256").update(stableStringify(definitionOf(feature))).digest("hex");
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function buildLock(doc, now = new Date()) {
  const hashes = {};
  for (const f of doc.features) hashes[f.id] = hashFeature(f);
  return { frozen_at: now.toISOString(), count: doc.features.length, hashes };
}

// Compare the current list against the frozen lock.
// Returns { ok, removed, edited, added } — added features are allowed
// (discoveries) but must start as passes:false.
export function guard(doc, lock) {
  const current = new Map(doc.features.map((f) => [f.id, f]));
  const removed = [];
  const edited = [];
  for (const [id, hash] of Object.entries(lock.hashes || {})) {
    const f = current.get(id);
    if (!f) removed.push(id);
    else if (hashFeature(f) !== hash) edited.push(id);
  }
  const added = doc.features.filter((f) => !(f.id in (lock.hashes || {})));
  const addedPassing = added.filter((f) => f.passes === true).map((f) => f.id);
  const ok = removed.length === 0 && edited.length === 0 && addedPassing.length === 0;
  return { ok, removed, edited, added: added.map((f) => f.id), addedPassing };
}

function priorityOf(f) {
  return Number.isFinite(f.priority) ? f.priority : Number.MAX_SAFE_INTEGER;
}

// Highest-priority feature that is not passing and not blocked.
// Ties keep file order — the initializer writes the list in build order.
export function nextFeature(doc) {
  let best = null;
  let bestIdx = -1;
  doc.features.forEach((f, i) => {
    if (f.passes || f.blocked) return;
    if (!best || priorityOf(f) < priorityOf(best) || (priorityOf(f) === priorityOf(best) && i < bestIdx)) {
      best = f;
      bestIdx = i;
    }
  });
  return best;
}

export function summarize(doc) {
  const total = doc.features.length;
  const passing = doc.features.filter((f) => f.passes).length;
  const blocked = doc.features.filter((f) => !f.passes && f.blocked).length;
  const byCategory = {};
  for (const f of doc.features) {
    const c = f.category || "uncategorized";
    byCategory[c] ??= { total: 0, passing: 0 };
    byCategory[c].total += 1;
    if (f.passes) byCategory[c].passing += 1;
  }
  return { total, passing, failing: total - passing - blocked, blocked, byCategory, next: nextFeature(doc) };
}

function find(doc, id) {
  const f = doc.features.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown feature id: ${id}`);
  return f;
}

export function markPass(doc, id, { evidence, session } = {}) {
  if (!evidence || !String(evidence).trim()) {
    throw new Error("--evidence is required: point to a screenshot, log, or test output proving the end-to-end check");
  }
  const f = find(doc, id);
  f.passes = true;
  f.blocked = false;
  f.evidence = evidence;
  if (session !== undefined) f.last_session = session;
  return f;
}

export function markFail(doc, id, { note, session, maxAttempts = DEFAULT_MAX_ATTEMPTS } = {}) {
  const f = find(doc, id);
  f.passes = false;
  f.attempts = (f.attempts || 0) + 1;
  if (note) f.notes = note;
  if (session !== undefined) f.last_session = session;
  if (f.attempts >= maxAttempts) f.blocked = true;
  return f;
}

// A feature that used to pass broke (found by the smoke test or a later session).
export function markRegressed(doc, id, { note, session } = {}) {
  const f = find(doc, id);
  f.passes = false;
  f.evidence = null;
  f.notes = note ? `REGRESSION: ${note}` : "REGRESSION";
  if (session !== undefined) f.last_session = session;
  return f;
}

export function unblock(doc, id) {
  const f = find(doc, id);
  f.blocked = false;
  f.attempts = 0;
  return f;
}
