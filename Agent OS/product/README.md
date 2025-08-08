# Product Docs

Single source of truth for strategy and planning.

## Files
- `mission.md`: Vision, goals (rarely changes)
- `roadmap.md`: Epics, user stories, statuses ([ ] → [~] → [x])
- `tech_stack.md`: Dependencies and platforms

## Cadence
- Update `roadmap.md` weekly (planning); update statuses on merge
- Update `tech_stack.md` on dependency/platform changes

## Governance
- Treat `product/**` as CODEOWNED; require review for changes
- PRs touching features must link related roadmap items 