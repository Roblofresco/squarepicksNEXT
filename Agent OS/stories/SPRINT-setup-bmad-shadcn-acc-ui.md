# Story: Enforce BMAD + shadcn for Account UI

## Goal
Apply BMAD core cycle for UI routes and harden shadcn usage.

## Scope
- Pages: `src/app/account-settings`, `src/app/profile`, `src/app/login`, `src/app/signup`.

## Tasks
- Planning
  - Use BMAD MCP: search "core development cycle" and "template-format" to confirm flow.
  - Create mini-spec: list components per page (inputs, forms, toasts, dialogs).
- Implementation
  - For each page, inventory UI and map to shadcn components using shadcn MCP: `list_components`, `get_component_info`.
  - Retrieve needed components code and place under `components/ui/`.
  - Replace ad-hoc UI with shadcn equivalents, preserving behavior.
- QA
  - Run UX review: check consistency, a11y roles/labels, focus states.
  - Record links to sources from both MCPs in PR description.

## Acceptance Criteria
- No custom UI where a shadcn component exists.
- Component inventory doc attached to PR.
- Lint/build/test pass.
