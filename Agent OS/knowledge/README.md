# Knowledge Base

Authoritative docs for pages and components.

## Add a page doc
- File in `knowledge/pages/*.md`
- Include:
  - Overview & Purpose
  - Responsibilities & Functionality
  - Core Components Used (link to files)
  - Data Dependencies & Hooks

## Add a component doc
- File in `knowledge/components/*.md`
- Include:
  - Overview & Purpose
  - Inputs/Props
  - Where Used (pages)
  - Data Dependencies (if any)

## Indexes
- Update `knowledge/INDEX.md` and `components/AllComponentsIndex.md` when adding/removing entries.

## Rules
- One subject = one file. No duplicates.
- Keep paths accurate to `src/app/*` and `src/components/*`.
- Prefer concise, factual content. 