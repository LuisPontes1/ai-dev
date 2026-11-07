// progress.mjs — the handoff note between sessions (claude-progress.txt).
//
// Each session appends exactly one entry. Entries are separated by a line
// starting with "## Session". `tail` returns the last N entries so a fresh
// session reads what it needs without loading the whole history.

import fs from "node:fs";

export const ENTRY_PREFIX = "## Session ";

export function nextSessionNumber(text) {
  const nums = [...text.matchAll(/^## Session (\d+)/gm)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

export function formatEntry({ session, date, feature, result, summary, state, next, gotchas, commit }) {
  const lines = [
    `${ENTRY_PREFIX}${session} — ${date}`,
    "",
    `- **Feature:** ${feature || "none"}`,
    `- **Result:** ${result || "unknown"}`,
  ];
  if (commit) lines.push(`- **Commit:** ${commit}`);
  lines.push(`- **Done:** ${summary || "-"}`);
  lines.push(`- **State left:** ${state || "-"}`);
  lines.push(`- **Next session should:** ${next || "-"}`);
  if (gotchas) lines.push(`- **Gotchas:** ${gotchas}`);
  return `${lines.join("\n")}\n`;
}

export function appendEntry(file, fields, now = new Date()) {
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "# Progress log\n";
  const session = fields.session ?? nextSessionNumber(existing);
  const date = fields.date ?? now.toISOString().replace("T", " ").slice(0, 16);
  const entry = formatEntry({ ...fields, session, date });
  const sep = existing.endsWith("\n\n") ? "" : existing.endsWith("\n") ? "\n" : "\n\n";
  fs.writeFileSync(file, `${existing}${sep}${entry}`);
  return { session, entry };
}

export function tail(text, n = 3) {
  const idx = [];
  const re = /^## Session \d+/gm;
  let m;
  while ((m = re.exec(text))) idx.push(m.index);
  if (idx.length === 0) return "";
  const start = idx[Math.max(0, idx.length - n)];
  return text.slice(start).trimEnd() + "\n";
}
