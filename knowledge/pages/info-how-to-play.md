# Information Page: How to Play

**Route:** `/information-and-support/how-to-play`

**Purpose:** Educational guide explaining the mechanics of playing SquarePicks, from finding games to winning prizes.

---

## Components Used

### Custom Components
- `InfoPageShell` - Wrapper with constellation canvas background
- `HowToPlayContent` - Renders markdown content with styled formatting

---

## Content Structure

The page displays markdown content organized into three main sections:

### 1. **Finding Games & Boards**
- Explore the Lobby (Games vs Boards)
- Navigate to Game Pages (from Games or Boards)
- Using the Game Page (entry amount selection)

### 2. **Picking Your Squares**
- Understanding the Grid (10x10, score combinations)
- Making Your Selection (choose entry, click square, confirm)
- Square Status Colors:
  - White: Available
  - Gray: Taken by others
  - Blue: Your selection

### 3. **Winning & Payouts**
- When You Win (Q1, Halftime, Q3, Final)
- Getting Paid:
  - Auto-credited to wallet
  - Withdraw anytime
  - Minimum $5.00 withdrawal

---

## Key Information

### Grid Mechanics
- 10x10 grid = 100 squares
- Top row = one team's score
- Side column = other team's score
- Each square = unique score combination

### Entry Amounts
- $1 (mentioned as default)
- $5
- $10
- $20

### Prize Distribution
- End of 1st Quarter (Q1)
- Halftime
- End of 3rd Quarter (Q3)
- Final Score
- Special event squares (when available)

---

## Visual Design

- Markdown content with styled headings
- Numbered sections
- Bulleted lists
- Clear hierarchy
- Constellation canvas background
- White text on dark theme

---

## Navigation

No explicit navigation controls beyond the InfoPageShell back button.

---

## Content Type

Static markdown rendered as HTML. No dynamic data or user interaction.

---

## Markdown Content

The full markdown guide is embedded as a template string in the component, covering:
- Lobby navigation
- Board selection
- Square picking process
- Winning conditions
- Payout procedures

