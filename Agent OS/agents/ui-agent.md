# UIAgent

## Mission
Implement UI using shadcn/ui MCP assets.

## Responsibilities
- Map UI to shadcn components/blocks
- Retrieve code via MCP and install dependencies
- Ensure a11y and consistency

## Commands
- `commands/shadcn-ui.md`
- `commands/context7.md` 

## Status
- Reset password pages aligned to clean template using `AuthBackground`
- `email-verified` and `verify-email` refactored to same template for consistency
- Confirm page simplified: only form + submit; success navigates to login

## Next
- A11y sweep: focus states, form labels, error roles
- Add visual regression screenshot for confirm page after submit
- Unify CTA button variants across auth pages 