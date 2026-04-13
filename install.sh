#!/usr/bin/env bash
# install.sh — AI-Dev Planning System installer
# Sets up ~/CLAUDE.md globally so every repo on this machine inherits planning-first behavior.
# Usage: bash install.sh [--dry-run]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GLOBAL_CLAUDE="$HOME/CLAUDE.md"
CLAUDE_COMMANDS_DIR="$HOME/.claude/commands"
CLAUDE_AIDEV_DIR="$HOME/.claude/ai-dev"
COPILOT_PLUGIN_DIR="$HOME/.claude/plugins/ai-dev-copilot"
MARKER_START="<!-- ai-dev:start -->"
MARKER_END="<!-- ai-dev:end -->"
DRY_RUN=false

# Detect python binary (needed for safe block replace in CLAUDE.md)
PYTHON_BIN=""
if command -v python3 &>/dev/null; then
  PYTHON_BIN="python3"
elif command -v python &>/dev/null && python -c "import sys; sys.exit(0 if sys.version_info.major==3 else 1)" &>/dev/null; then
  PYTHON_BIN="python"
fi

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[ai-dev]${NC} $*"; }
success() { echo -e "${GREEN}[ai-dev]${NC} $*"; }
warn()    { echo -e "${YELLOW}[ai-dev]${NC} $*"; }
error()   { echo -e "${RED}[ai-dev]${NC} $*" >&2; }

for arg in "$@"; do
  [[ "$arg" == "--dry-run" ]] && DRY_RUN=true
done
$DRY_RUN && warn "DRY RUN — no files will be written"

# ── 1. ~/CLAUDE.md — safe update with block markers ─────────────────────────
install_global_claude() {
  local src="$SCRIPT_DIR/install/global-CLAUDE.md"
  [[ ! -f "$src" ]] && { error "Source not found: $src"; exit 1; }

  if $DRY_RUN; then
    warn "Would install/update ai-dev block in ~/CLAUDE.md"
    return
  fi

  if [[ ! -f "$GLOBAL_CLAUDE" ]]; then
    # Fresh install — create with markers
    { echo "$MARKER_START"; cat "$src"; echo "$MARKER_END"; } > "$GLOBAL_CLAUDE"
    success "Created ~/CLAUDE.md"

  elif grep -qF "$MARKER_START" "$GLOBAL_CLAUDE"; then
    # Block markers exist — replace only the ai-dev section, preserve everything else
    cp "$GLOBAL_CLAUDE" "$GLOBAL_CLAUDE.bak"
    if [[ -n "$PYTHON_BIN" ]]; then
      $PYTHON_BIN - "$GLOBAL_CLAUDE" "$src" "$MARKER_START" "$MARKER_END" <<'EOF'
import re, sys
target, src, start, end = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
content = open(target).read()
new_block = open(src).read()
pattern = re.escape(start) + r'.*?' + re.escape(end)
replacement = f"{start}\n{new_block}\n{end}"
result = re.sub(pattern, replacement, content, flags=re.DOTALL)
open(target, 'w').write(result)
EOF
      success "Updated ai-dev block in ~/CLAUDE.md (backup: ~/CLAUDE.md.bak)"
    else
      warn "python3/python not found — cannot do safe block replace."
      warn "Falling back to append. Remove the old ai-dev block manually if needed."
      printf '\n\n%s\n' "$MARKER_START" >> "$GLOBAL_CLAUDE"
      cat "$src" >> "$GLOBAL_CLAUDE"
      printf '\n%s\n' "$MARKER_END" >> "$GLOBAL_CLAUDE"
      warn "Appended new ai-dev block (backup: ~/CLAUDE.md.bak)"
    fi

  else
    # File exists with other content, no markers — append block safely
    cp "$GLOBAL_CLAUDE" "$GLOBAL_CLAUDE.bak"
    printf '\n\n%s\n' "$MARKER_START" >> "$GLOBAL_CLAUDE"
    cat "$src" >> "$GLOBAL_CLAUDE"
    printf '\n%s\n' "$MARKER_END" >> "$GLOBAL_CLAUDE"
    success "Appended ai-dev block to existing ~/CLAUDE.md (backup: ~/CLAUDE.md.bak)"
  fi
}

# ── 2. On-demand protocol files → ~/.claude/ai-dev/ ─────────────────────────
install_protocol_files() {
  local src_dir="$SCRIPT_DIR/install"
  info "Installing on-demand protocol files to $CLAUDE_AIDEV_DIR"
  if ! $DRY_RUN; then
    mkdir -p "$CLAUDE_AIDEV_DIR"
    for f in planning.md execution.md; do
      [[ -f "$src_dir/$f" ]] || { warn "  Missing: $src_dir/$f — skipping"; continue; }
      cp "$src_dir/$f" "$CLAUDE_AIDEV_DIR/$f"
      success "  Installed: ~/.claude/ai-dev/$f"
    done

    # Install personas
    if [[ -d "$src_dir/personas" ]]; then
      mkdir -p "$CLAUDE_AIDEV_DIR/personas"
      cp "$src_dir/personas"/*.md "$CLAUDE_AIDEV_DIR/personas/" 2>/dev/null || true
      success "  Installed: ~/.claude/ai-dev/personas/ ($(ls "$src_dir/personas"/*.md 2>/dev/null | wc -l | tr -d ' ') personas)"
    fi
  else
    warn "  Would install: ~/.claude/ai-dev/planning.md"
    warn "  Would install: ~/.claude/ai-dev/execution.md"
    warn "  Would install: ~/.claude/ai-dev/personas/"
  fi
}

# ── 3. Slash commands → ~/.claude/commands/ ──────────────────────────────────
install_commands() {
  local src_dir="$SCRIPT_DIR/commands"
  [[ ! -d "$src_dir" ]] && { warn "No commands/ directory — skipping"; return; }

  info "Installing slash commands to $CLAUDE_COMMANDS_DIR"
  if ! $DRY_RUN; then
    mkdir -p "$CLAUDE_COMMANDS_DIR"
    for cmd_file in "$src_dir"/*.md; do
      [[ -f "$cmd_file" ]] || continue
      cp "$cmd_file" "$CLAUDE_COMMANDS_DIR/$(basename "$cmd_file")"
      success "  Installed: /$(basename "$cmd_file" .md)"
    done
  else
    for cmd_file in "$src_dir"/*.md; do
      [[ -f "$cmd_file" ]] || continue
      warn "  Would install: /$(basename "$cmd_file" .md)"
    done
  fi
}

# ── 4. Enable flag (on by default) ──────────────────────────────────────────
install_enable_flag() {
  local flag="$CLAUDE_AIDEV_DIR/enabled"
  if ! $DRY_RUN; then
    mkdir -p "$CLAUDE_AIDEV_DIR"
    if [[ ! -f "$flag" ]]; then
      touch "$flag"
      success "AI-Dev enabled (flag: ~/.claude/ai-dev/enabled)"
    else
      info "AI-Dev already enabled"
    fi
  else
    warn "Would create: ~/.claude/ai-dev/enabled"
  fi
}

# ── 5. Templates → ~/.claude/ai-dev/templates/ ──────────────────────────────
install_templates() {
  local src_dir="$SCRIPT_DIR/templates"
  local dest_dir="$CLAUDE_AIDEV_DIR/templates"
  [[ ! -d "$src_dir" ]] && { warn "No templates/ directory — skipping"; return; }

  info "Installing templates to $dest_dir"
  if ! $DRY_RUN; then
    mkdir -p "$dest_dir"
    cp -r "$src_dir"/. "$dest_dir/"
    success "  Installed templates (starters, tasks, agents, dependencies, reports)"
  else
    warn "  Would install: ~/.claude/ai-dev/templates/"
  fi
}

# ── 6. Copilot plugin → ~/.claude/plugins/ai-dev-copilot/ ───────────────────
install_copilot_plugin() {
  local src_dir="$SCRIPT_DIR/plugins/copilot"
  [[ ! -d "$src_dir" ]] && { warn "No plugins/copilot/ directory — skipping"; return; }

  info "Installing Copilot plugin to $COPILOT_PLUGIN_DIR"

  if $DRY_RUN; then
    warn "  Would copy plugin to: $COPILOT_PLUGIN_DIR"
    warn "  Would run: npm install"
    warn "  Would install slash commands to: ~/.claude/commands/copilot/"
    return
  fi

  # Copy plugin files
  mkdir -p "$COPILOT_PLUGIN_DIR/plugins/copilot"
  cp -r "$src_dir"/. "$COPILOT_PLUGIN_DIR/plugins/copilot/"

  # Copy root package.json to plugin root (for npm install)
  cp "$src_dir/package.json" "$COPILOT_PLUGIN_DIR/package.json"

  # Install npm dependencies
  if command -v node &>/dev/null; then
    if command -v npm &>/dev/null; then
      info "  Running npm install..."
      (cd "$COPILOT_PLUGIN_DIR" && npm install --production 2>&1) | while read -r line; do
        info "    $line"
      done
      success "  npm install complete"
    else
      warn "  npm not found — run 'npm install' manually in $COPILOT_PLUGIN_DIR"
    fi
  else
    warn "  Node.js not found — Copilot plugin requires Node.js >= 18.18"
    warn "  Install Node.js and run: cd $COPILOT_PLUGIN_DIR && npm install"
  fi

  # Install copilot slash commands
  local cmd_dir="$COPILOT_PLUGIN_DIR/plugins/copilot/commands"
  local dest_cmd_dir="$HOME/.claude/commands/copilot"
  if [[ -d "$cmd_dir" ]]; then
    mkdir -p "$dest_cmd_dir"
    for cmd_file in "$cmd_dir"/*.md; do
      [[ -f "$cmd_file" ]] || continue
      cp "$cmd_file" "$dest_cmd_dir/$(basename "$cmd_file")"
    done
    success "  Installed copilot slash commands (/copilot:setup, /copilot:review, ...)"
  fi

  success "Copilot plugin installed"
}

# ── 7. Summary ───────────────────────────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  AI-Dev installed${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "  ~/CLAUDE.md                          — global PM instructions (core)"
  echo "  ~/.claude/ai-dev/enabled             — toggle flag (ai-dev is ON)"
  echo "  ~/.claude/ai-dev/                    — on-demand protocol files + templates"
  echo "  ~/.claude/ai-dev/personas/           — specialist prompt templates (8 personas)"
  echo "  ~/.claude/ai-dev/templates/          — starters, task/agent/report templates"
  echo "  ~/.claude/commands/                  — /ai-dev-init, /ai-dev-on, /ai-dev-off"
  echo "  ~/.claude/plugins/ai-dev-copilot/    — Copilot plugin + SDK"
  echo "  ~/.claude/commands/copilot/          — /copilot:setup, /copilot:review, ..."
  echo ""
  echo "  Next steps:"
  echo "    1. Run /copilot:setup to verify Copilot is working"
  echo "    2. Open any repo in VS Code with Claude Code"
  echo "    3. Claude detects no .ai-dev/ and prompts /ai-dev-init"
  echo "    4. Review .ai-dev/context.md, describe what you want to build"
  echo "    5. Approve the plan — execution begins"
  echo ""
  echo "  Docs: $SCRIPT_DIR/docs/"
  echo ""
}

# ── Run ──────────────────────────────────────────────────────────────────────
install_global_claude
install_protocol_files
install_enable_flag
install_templates
install_commands
install_copilot_plugin
print_summary
