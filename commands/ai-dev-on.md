Enable the ai-dev planning system for this Claude Code session and all future sessions.

## What to do

1. Create the file `~/.claude/ai-dev/enabled` (empty file — its presence is the flag):
   ```bash
   mkdir -p ~/.claude/ai-dev && touch ~/.claude/ai-dev/enabled
   ```

2. Confirm to the user:
   "AI-Dev is now **ON**. Planning-first mode active from this session forward.
   I'll check for `.ai-dev/` at the start of every session and operate as Project Manager."

3. If the current directory does not have `.ai-dev/`, offer to initialize:
   "This directory has no `.ai-dev/` yet. Run `/ai-dev-init` to set it up."

4. If the current directory already has `.ai-dev/`, read it and show the project status dashboard immediately.
