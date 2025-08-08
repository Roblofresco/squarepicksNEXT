# Story: Enforce BMAD + awesome-claude-code Usage

## Goal
Ensure PRs demonstrate BMAD process and reuse awesome-claude-code resources when relevant.

## Tasks
- Update PR template (done) to include BMAD + awesome checks
- Add contributing note referencing `Agent OS/commands/*`
- Implement CI check to require PR body contains links to BMAD/awesome sources when applicable
- Educate via README updates (done)

## Acceptance Criteria
- PRs missing BMAD/awesome references fail CI (when applicable)
- New contributors can find rules in `Agent OS/commands/README.md` 