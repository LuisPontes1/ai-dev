Disable the ai-dev planning system. Claude Code returns to normal behavior in all future sessions.

## What to do

1. Delete the file `~/.claude/ai-dev/enabled`:
   ```bash
   rm -f ~/.claude/ai-dev/enabled
   ```

2. Confirm to the user:
   "AI-Dev is now **OFF**. Normal Claude Code mode active from this session forward.
   The `.ai-dev/` folder in your projects is preserved — run `/ai-dev-on` to re-enable at any time."

## What NOT to do

- Do NOT delete `~/.claude/ai-dev/` — it contains templates and protocol files
- Do NOT delete any `.ai-dev/` project folders
- Do NOT modify `~/CLAUDE.md`
