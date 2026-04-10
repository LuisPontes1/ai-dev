#!/usr/bin/env bash
# install.sh — AI-Dev Planning System installer
# Sets up ~/CLAUDE.md globally so every repo on this machine inherits planning-first behavior.
# Usage: bash install.sh [--dry-run]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GLOBAL_CLAUDE="$HOME/CLAUDE.md"
CLAUDE_COMMANDS_DIR="$HOME/.claude/commands"
CLAUDE_AIDEV_DIR="$HOME/.claude/ai-dev"
COPILOT_PLUGIN_DIR="$HOME/.claude/plugins/copilot-plugin-cc"
MARKER_START="<!-- ai-dev:start -->"
MARKER_END="<!-- ai-dev:end -->"
DRY_RUN=false

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
    python3 - "$GLOBAL_CLAUDE" "$src" "$MARKER_START" "$MARKER_END" <<'EOF'
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
  else
    warn "  Would install: ~/.claude/ai-dev/planning.md"
    warn "  Would install: ~/.claude/ai-dev/execution.md"
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

# ── 4. Check Copilot plugin ──────────────────────────────────────────────────
check_copilot_plugin() {
  echo ""
  if [[ -d "$COPILOT_PLUGIN_DIR" ]]; then
    local companion="$COPILOT_PLUGIN_DIR/plugins/copilot/scripts/copilot-companion.mjs"
    if [[ -f "$companion" ]]; then
      success "Copilot plugin found: $COPILOT_PLUGIN_DIR"
    else
      warn "Plugin directory exists but copilot-companion.mjs not found."
      warn "The plugin may be incomplete. Re-install or check: $COPILOT_PLUGIN_DIR"
    fi
  else
    warn "Copilot plugin (copilot-plugin-cc) NOT found at ~/.claude/plugins/"
    warn "Tasks with 'executor: copilot' will not work without it."
    warn "See docs/copilot-plugin.md for installation instructions."
  fi
}

# ── 5. Summary ───────────────────────────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  AI-Dev installed${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "  ~/CLAUDE.md            — global PM instructions (core)"
  echo "  ~/.claude/ai-dev/      — on-demand protocol files"
  echo "  ~/.claude/commands/    — slash commands (/ai-dev-init)"
  echo ""
  echo "  Next steps:"
  echo "    1. Open any repo in VS Code with Claude Code"
  echo "    2. Claude detects no .ai-dev/ and prompts /ai-dev-init"
  echo "    3. Review .ai-dev/context.md, describe what you want to build"
  echo "    4. Approve the plan — execution begins"
  echo ""
  echo "  Docs: $SCRIPT_DIR/docs/"
  echo ""
}

# ── Run ──────────────────────────────────────────────────────────────────────
install_global_claude
install_protocol_files
install_commands
check_copilot_plugin
print_summary
