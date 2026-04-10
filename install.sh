#!/usr/bin/env bash
# install.sh — AI-Dev Planning System installer
# Sets up ~/CLAUDE.md globally so every repo on this machine inherits planning-first behavior.
# Usage: bash install.sh [--dry-run]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GLOBAL_CLAUDE="$HOME/CLAUDE.md"
CLAUDE_COMMANDS_DIR="$HOME/.claude/commands"
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

# ── 1. ~/CLAUDE.md ───────────────────────────────────────────────────────────
install_global_claude() {
  local src="$SCRIPT_DIR/install/global-CLAUDE.md"
  [[ ! -f "$src" ]] && { error "Source not found: $src"; exit 1; }

  if [[ -f "$GLOBAL_CLAUDE" ]]; then
    # Check if already installed
    if grep -q "AI-Dev Planning System" "$GLOBAL_CLAUDE" 2>/dev/null; then
      warn "~/CLAUDE.md already contains ai-dev instructions — updating in place"
      if ! $DRY_RUN; then
        # Replace only the ai-dev block (between markers) or append if markers missing
        if grep -q "# AI-Dev Planning System" "$GLOBAL_CLAUDE"; then
          # Full replace of the file section — simplest approach: back up and overwrite if it's the only content
          # Otherwise append a note pointing to the install dir
          cp "$GLOBAL_CLAUDE" "$GLOBAL_CLAUDE.bak"
          cat "$src" > "$GLOBAL_CLAUDE"
          info "Backed up original to ~/CLAUDE.md.bak"
        fi
      fi
    else
      warn "~/CLAUDE.md exists with other content — appending ai-dev section"
      if ! $DRY_RUN; then
        cp "$GLOBAL_CLAUDE" "$GLOBAL_CLAUDE.bak"
        echo -e "\n\n---\n" >> "$GLOBAL_CLAUDE"
        cat "$src" >> "$GLOBAL_CLAUDE"
        info "Backed up original to ~/CLAUDE.md.bak"
      fi
    fi
  else
    info "Creating ~/CLAUDE.md"
    $DRY_RUN || cp "$src" "$GLOBAL_CLAUDE"
  fi

  success "~/CLAUDE.md installed"
}

# ── 2. Slash commands ────────────────────────────────────────────────────────
install_commands() {
  local src_dir="$SCRIPT_DIR/commands"
  [[ ! -d "$src_dir" ]] && { warn "No commands/ directory found — skipping"; return; }

  info "Installing slash commands to $CLAUDE_COMMANDS_DIR"
  if ! $DRY_RUN; then
    mkdir -p "$CLAUDE_COMMANDS_DIR"
    for cmd_file in "$src_dir"/*.md; do
      [[ -f "$cmd_file" ]] || continue
      local dest="$CLAUDE_COMMANDS_DIR/$(basename "$cmd_file")"
      cp "$cmd_file" "$dest"
      success "  Installed: /$(basename "$cmd_file" .md)"
    done
  else
    for cmd_file in "$src_dir"/*.md; do
      [[ -f "$cmd_file" ]] || continue
      warn "  Would install: /$(basename "$cmd_file" .md)"
    done
  fi
}

# ── 3. Summary ───────────────────────────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}  AI-Dev installed successfully${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "  Global CLAUDE.md : ~/CLAUDE.md"
  echo "  Slash commands   : ~/.claude/commands/"
  echo ""
  echo "  Next steps:"
  echo "    1. Open any repo in VS Code with Claude Code"
  echo "    2. Claude will detect no .ai-dev/ and prompt you to run /ai-dev-init"
  echo "    3. Review .ai-dev/context.md and .ai-dev/plan.md"
  echo "    4. Approve the plan — then execution begins"
  echo ""
  echo "  Docs: $(dirname "$SCRIPT_DIR")/docs/"
  echo "  Copilot setup: $(dirname "$SCRIPT_DIR")/docs/copilot-setup.md"
  echo ""
}

# ── Run ──────────────────────────────────────────────────────────────────────
install_global_claude
install_commands
print_summary
