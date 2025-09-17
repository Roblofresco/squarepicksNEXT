# Rule: Context7 Usage

## 1. Primary Directive
Use Context7 MCP to fetch authoritative, up-to-date library documentation before adding or changing dependencies.

## 2. Planning Phase
1. Identify the library and task (e.g., router, auth, forms, payments).
2. Run `resolve-library-id` with the package name.
3. Run `get-library-docs` for relevant topics (e.g., routing, hooks, API reference).

## 3. Implementation Phase
1. Confirm versions and install commands per docs.
2. Follow documented patterns; avoid guessing APIs.
3. Link the Context7 doc sections used in PR descriptions. 