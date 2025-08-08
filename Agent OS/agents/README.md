# Agents

Lightweight roles to run SOPs.

- `DocsAgent`: Maintains knowledge base and indexes
- `UIAgent`: Enforces shadcn/ui via MCP and integrates UI
- `IntegrationAgent`: Uses Context7 and BMAD to plan/validate changes
- `CIAgent`: Maintains CI checks for documentation and PR hygiene

Usage: reference these agents in stories and assign owners. 