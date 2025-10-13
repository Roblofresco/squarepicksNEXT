# Rule: BMAD-METHOD Usage

## 1. Primary Directive
Use the BMAD-METHOD MCP for process, planning, and architecture. Do not invent workflow; follow BMAD artifacts and tasks.

## 2. Planning Phase
1. Define goal (planning, architecture, story, QA).
2. Query docs: use `search_BMAD_METHOD_documentation` with a focused phrase (e.g., "core architecture", "template-format", "create-doc").
3. If code references are needed, use `search_BMAD_METHOD_code`.
4. Fetch sources with `fetch_BMAD_METHOD_documentation` or `fetch_generic_url_content` and extract concrete steps.

## 3. Implementation Phase
1. Map task to BMAD components (agent/team, task, template, checklist).
2. Follow template processing system (see `template-format.md`, `create-doc.md`).
3. For dev work, follow the Core Development Cycle (story → implement → QA/review → done).
4. Capture source links in the PR/issue notes.
