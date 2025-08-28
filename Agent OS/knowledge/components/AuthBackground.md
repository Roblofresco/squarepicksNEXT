# AuthBackground

Wrapper component that renders a themed animated background and centers content.

- Props:
  - `canvasId: string` unique id for the background canvas
  - Children: page content container
- Used by:
  - `reset-password/*` pages
  - `email-verified`, `verify-email`
- Notes:
  - Keeps auth pages visually consistent
  - Avoids duplication of custom canvas/effects 