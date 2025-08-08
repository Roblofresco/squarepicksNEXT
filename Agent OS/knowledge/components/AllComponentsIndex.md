# All Components Index (src/components and components/ui)

## App Shell & Layout
- InAppHeader (`src/components/InAppHeader.tsx`)
  - Used by: `src/app/lobby/page.tsx`
- BottomNav (`src/components/lobby/BottomNav.tsx`)
  - Used by: `src/app/lobby/page.tsx`, `src/app/profile/page.tsx`, `src/app/my-boards/page.tsx`
- BodyScrollManager (`src/components/BodyScrollManager.tsx`)
  - Used by: `src/app/layout.tsx`
- theme-provider (`src/components/theme-provider.tsx`)

## Visual Effects & Branding
- StarfieldBackground (`src/components/effects/StarfieldBackground.tsx`)
  - Used by: `src/app/lobby/page.tsx`, `src/app/wallet-setup/location/page.tsx`
- Logo (`src/components/Logo.tsx`)
- LogoIcon (`src/components/LogoIcon.tsx`)
- LogoWithText (`src/components/LogoWithText.tsx`)
- LogoCube (`src/components/LogoCube.tsx`)
  - Used by: `src/app/loading/page.tsx`, `src/app/login/page.tsx`

## Lobby (Discovery & Entry)
- SportSelector (`src/components/lobby/SportSelector.tsx`)
  - Used by: `src/app/lobby/page.tsx`
- GamesList (`src/components/lobby/GamesList.tsx`)
  - Used by: `src/app/lobby/page.tsx`
- BoardsList (`src/components/lobby/BoardsList.tsx`)
  - Used by: `src/app/lobby/page.tsx`
- BoardCard (`src/components/lobby/BoardCard.tsx`)
- BoardCardExpanded (`src/components/lobby/BoardCardExpanded.tsx`)
- BoardMiniGrid (`src/components/lobby/BoardMiniGrid.tsx`)
- QuickEntrySelector (`src/components/lobby/QuickEntrySelector.tsx`)
- SweepstakesBoardCard (`src/components/lobby/sweepstakes/SweepstakesBoardCard.tsx`)
  - Used by: `src/app/lobby/page.tsx`
- SweepstakesScoreboard (`src/components/lobby/sweepstakes/SweepstakesScoreboard.tsx`)
  - Used by: `src/app/lobby/page.tsx`
- LobbyHeader (`src/components/lobby/LobbyHeader.tsx`)

## My Boards (User Boards & History)
- SquareCard (`src/components/my-boards/SquareCard.tsx`)
  - Used by: `src/app/my-boards/page.tsx`
- BoardGridDisplay (`src/components/my-boards/BoardGridDisplay.tsx`)
- QuarterScoreboard (`src/components/my-boards/QuarterScoreboard.tsx`)

## Notifications
- NotificationIcon (`src/components/notifications/NotificationIcon.tsx`)
- NotificationItem (`src/components/notifications/NotificationItem.tsx`)
- NotificationList (`src/components/notifications/NotificationList.tsx`)

## Signup Flow
- SignupHeader (`src/components/SignupHeader.tsx`)
  - Used by: `src/app/signup/layout.tsx`
- SignupProgressDots (`src/components/SignupProgressDots.tsx`)
  - Used by: `src/app/signup/email/page.tsx`, `src/app/signup/password/page.tsx`, `src/app/signup/identity/page.tsx`, `src/app/signup/username/page.tsx`

## UI (shadcn/ui based)
- alert-dialog (`src/components/ui/alert-dialog.tsx`)
  - Used by: `src/app/wallet-setup/location/page.tsx`
- badge (`src/components/ui/badge.tsx`)
- button (`src/components/ui/button.tsx`)
  - Used by: many pages (`deposit`, `withdraw`, `verify-email`, `game`, `wallet`, etc.)
- card (`src/components/ui/card.tsx`)
- dialog (`src/components/ui/dialog.tsx`)
  - Used by: `src/app/lobby/page.tsx`, `src/app/my-boards/page.tsx`, `src/app/game/[gameId]/page.tsx`
- EmailVerificationBanner (`src/components/ui/EmailVerificationBanner.tsx`)
  - Used by: `src/app/layout.tsx`
- input (`src/components/ui/input.tsx`)
  - Used by: `deposit`, `withdraw`, `wallet-setup/personal-info`
- label (`src/components/ui/label.tsx`)
  - Used by: `deposit`, `withdraw`
- PersonalInfoForm (`src/components/ui/PersonalInfoForm.tsx`)
  - Used by: `src/app/wallet-setup/personal-info/page.tsx`
- progress (`src/components/ui/progress.tsx`)
- ProgressBar (`src/components/ui/ProgressBar.tsx`)
  - Used by: `src/app/wallet-setup/location/page.tsx`, `src/app/wallet-setup/personal-info/page.tsx`
- radio-group (`src/components/ui/radio-group.tsx`)
- select (`src/components/ui/select.tsx`)
  - Used by: `src/app/transactions/page.tsx`
- table (`src/components/ui/table.tsx`)
  - Used by: `src/app/transactions/page.tsx`
- tabs (`src/components/ui/tabs.tsx`)
  - Used by: `src/app/my-boards/page.tsx`

## Additional UI (repo root components)
- MarkdownContent (`components/ui/MarkdownContent.tsx`)

## Notes
- Many lobby components (e.g., `BoardCard`, `QuickEntrySelector`, `BoardMiniGrid`) are composed inside `BoardsList`/`SweepstakesBoardCard`, and thus indirectly used by `/lobby`.
- The Game Page renders its own grid with UI primitives rather than reusing lobby grid components. 