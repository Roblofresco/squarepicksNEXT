# Story: Knowledge Coverage & Index Enforcement

## Goal
Ensure all pages/components are documented; keep indexes accurate.

## Tasks
- Audit `src/app/**` pages; list missing docs; create stubs
- Audit `src/components/**` and `components/ui/**`; update `AllComponentsIndex.md`
- Create or update docs to include required sections
- Update `knowledge/INDEX.md`
- Add CI check (follow-up) to block PRs that add pages/components without docs

## Acceptance Criteria
- 100% pages under `src/app/` have a `knowledge/pages/*.md`
- All components indexed in `AllComponentsIndex.md`
- `knowledge/INDEX.md` reflects current set
- No duplicates 