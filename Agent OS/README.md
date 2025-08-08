# Agent OS

Centralized operational layer for product docs, knowledge, commands, and stories.

## Structure
- `product/`: Mission, roadmap, tech stack
- `knowledge/`: Pages and components knowledge base
- `commands/`: Operational runbooks (rules + procedures)
- `stories/`: Executable stories for sprints
- `agents/`: Role definitions (Docs, UI, Integration, CI)

## Conventions
- Knowledge pages must list: Overview, Responsibilities, Core Components Used, Data Dependencies, Where Used (for components)
- No duplicate docs for the same subject (one file per page/component)
- Keep `AllComponentsIndex.md` and `knowledge/INDEX.md` updated when adding/removing items
- Prefer links to code (`src/app/*`, `src/components/*`) and keep paths accurate

## How we work
- Plan with `product/roadmap.md` and `commands/plan-product.md`
- Create specs with `commands/create-spec.md`
- Execute using `commands/execute-tasks.md`
- Use Context7 before changing deps (`commands/context7.md`)
- Use shadcn/ui MCP for UI work (`commands/shadcn-ui.md`)
- Use BMAD for process/architecture (`commands/bmad-method.md`)
- Use awesome-claude-code for Claude Code workflows (`commands/awesome-claude-code.md`) 