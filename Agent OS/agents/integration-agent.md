# IntegrationAgent

## Mission
Use Context7 and BMAD to plan/validate architecture and dependencies.

## Responsibilities
- Resolve and fetch docs before dep/API changes
- Follow BMAD templates/checklists for planning and delivery

## Commands
- `commands/context7.md`
- `commands/bmad-method.md`
- `commands/awesome-claude-code.md` 

## Status
- Reset password flow complete (Firebase Auth):
  - `sendPasswordResetEmail` with `actionCodeSettings.url = /reset-password/confirm`
  - Redirect handler for `mode=resetPassword` → `/reset-password/confirm?oobCode=...`
  - Confirm page verifies `oobCode` and updates password
  - Playwright e2e scaffold: `tests/e2e/reset-password.spec.ts`

## Next
- Link docs via Context7 (Firebase Auth):
  - Password reset, email verification, ActionCodeSettings
- Add negative-path tests (expired/invalid `oobCode`) and localization (`setLanguageCode`)
- Ensure `NEXT_PUBLIC_FUNCTIONS_BASE_URL` documented; verify `checkAuthEmailExists` is reachable in dev/prod
- Add CI step to run Playwright smoke on PRs (gated by label) 