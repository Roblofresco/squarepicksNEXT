# Knowledge: SquareCard Component (`@/components/my-boards/SquareCard.tsx`)

## 1. Overview & Purpose
- Card representation of a user’s board for Active/History lists on My Boards page.

## 2. Key Responsibilities & Functionality
- Displays teams, date/time, status, and user-picked squares count.
- Clickable; parent handles navigation to the game’s detailed page.

## 3. Props (as used)
- `board: AppBoard`
- `onClick: (boardId: string) => void`

## 4. Where Used
- `src/app/my-boards/page.tsx` within Tabs (Active/History). 