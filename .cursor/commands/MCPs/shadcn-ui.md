# Rule: shadcn/ui Usage

This is a persistent rule for all UI-related tasks in the SquarePicks project.

## 1. Primary Directive

When a task requires building or modifying a user interface, you **must** use the tools available in the `shadcn-ui-mcp-server`. Do not attempt to write UI components from scratch if a suitable `shadcn/ui` component exists.

## 2. Planning Phase

Before writing any implementation code, you must follow this planning process:

1.  **Analyze Request:** Break down the user's request into a list of required UI elements (e.g., "login form," "data table," "confirmation dialog").
2.  **List Assets:** Use the `list_components` or `list_blocks` tools from the `shadcn-ui-mcp-server` to see all available assets.
3.  **Prioritize Blocks:** Prioritize using a "block" if it meets the requirements, as they provide larger, pre-composed sets of components.
4.  **Map Components:** Create a clear mapping from the required UI elements to the specific `shadcn/ui` components or blocks that will be used. This mapping should be part of the implementation plan.

## 3. Implementation Phase

When implementing the UI based on the plan, you must follow these steps:

1.  **Get Component Info:** Before installing or using a component, use the `get_component_info` tool to understand its dependencies.
2.  **Retrieve Code:** Use the `get_component_code` tool to retrieve the source code for the component.
3.  **Install & Implement:** Add the component file to the correct directory (`src/components/ui`) and install any necessary dependencies using `pnpm`. Then, integrate the component into the page or feature as described in the plan. 