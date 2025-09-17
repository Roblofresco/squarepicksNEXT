# Games & Scores Backend Operations

## Purpose
Define how SquarePicks fetches upcoming games, posts games to Firestore, updates live scores, and finalizes winners.

## Data Sources
- Primary (dev/test): ESPN scoreboard endpoints per league (NFL, NBA, CFB, WNBA).
- Production: provider-agnostic; mapper normalizes to our `games/{gameId}` schema.

## Collections (Database Schema)

### games
- Path: `games/{gameId}`
- Purpose: single source of truth for a game and its quarter splits for winner calculation
- Indexes: `(sport, status, startTime)`, `(sport, gameDate)`, `(status, startTime)`

Fields:
```
gameID               string      // external/API id
sport                string      // NFL | NBA | CFB | WNBA
homeTeam             reference   // teams/{teamId}
awayTeam             reference   // teams/{teamId}
startTime            Timestamp   // UTC
endTime              Timestamp
gameDate             string      // YYYY-MM-DD 
season               string
week                 number
broadcastProvider    string
status               string      // scheduled | live | final
statusState          string      // pre | in | post
statusDetail         string
lastUpdated          Timestamp
created              Timestamp
quarter              string
timeRemaining        string
clock                string
isLive               boolean
isOver               boolean
homeScore            number
awayScore            number
homeQ1score          number
homeQ2score          number
homeQ3score          number
homeFscore           number      // final
awayQ1score          number
awayQ2score          number
awayQ3score          number
awayFscore           number
homeOTscore          number
awayOTscore          number
```

### teams
- Path: `teams/{teamId}`
- Purpose: canonical team metadata per league
- Indexes: `(sport, abbrev)`

Fields:
```
city           string
sport          string
name           string
abbrev         string
full_name      string
logo           string
color          string
seccolor       string
externalIds    object      // provider ids
created_time   Timestamp
updated_time   Timestamp
```

Notes: games reference teams, and denormalize `name/abbrev/logo` into game docs for render speed and historical accuracy.

---

### boards
- Path: `boards/{boardId}`
- Purpose: contest boards per game and entry tier
- Indexes: `(gameID, status)`, `(status)`, `(created_time)`

Fields (from current data):
```
amount            number      // entry tier amount (0, 1, 5, 10, 20)
created_time      Timestamp
gameID            string      // '/games/{gameId}' (string path)
pot               number      // multiply .amount by 80
payout            number      // multiply .amount by 20
selected_indexes  number[]    // taken squares 0-99
status            string      // open | closed | canceled | settled
sweepstakesID     string|null
updated_time      Timestamp
```

Subcollection: `boards/{boardId}/squares/{docId}`
```
boardId          string
created_time     Timestamp
gameId           string      // '{gameId}'
index            number      // 0-99
updated_time     Timestamp
userID           string      // '/users/{userId}'
amount           number
```

---

### transactions
- Path: `transactions/{id}`
- Purpose: payment and entry transactions

Fields (from current data):
```
amount         number      // negative for debits
boardID        string
currency       string      // 'USD'
description    string
squareIndexes  number[]
status         string      // completed | failed | pending
timestamp      Timestamp
type           string      // purchase | refund | promo
userID         string      // '/users/{userId}'
```

---

### notifications
- Path: `notifications/{id}`
- Purpose: user notifications for purchases and status changes

Fields (from current data):
```
boardId        string
isRead         boolean
message        string
relatedID      string
squareIndexes  number[]
created_time   Timestamp
title          string
type           string      // purchase | payout | system
userID         string      // '/users/{userId}'
```

---

### sweepstakes
- Path: `sweepstakes/{id}` with subcollection `participants`
- Purpose: free-entry sweepstakes configuration

Fields (from current data):
```
boardIDs       string[]
count          number
created_time   Timestamp
gameID         string      // '/games/{gameId}'
participants   any[]       // plus subcollection for details
status         string      // active | closed
title          string
updated_time   Timestamp
winning_prize  number
```

Subcollection: `sweepstakes/{id}/participants/{participantId}`
```
created_time     Timestamp
userID         reference   // '/users/{userId}'
```

---

### schedules
- Path: `schedules/{sport}/{YYYY-MM-DD}`
- Purpose: curated daily lobby lists without flooding

Fields:
```
gameIds        string[]
lastUpdated    Timestamp
```

## Posting Games (Preload)
- Goal: ensure upcoming games exist so boards can open.
- Schedule by sport:
  - NFL: weekly post on Tuesday (after MNF) for full Thu–Mon slate.
  - CFB: weekly post on Sunday for Mon–Sat slate (primary Sat).
  - NBA/WNBA: weekly seed + daily roll-forward (details below).
- Action: upsert minimal docs per game:
  - identity (gameID, sport), teams (refs + denorm name/abbrev/logo), startTime, gameDate, season, week, status='scheduled', broadcastProvider.
  - avoid quarter fields until live.

### NBA/WNBA Posting Policy (Weekly + Daily Overlay)
- Weekly seed (primary):
  - Seed weekly on the first featured day (Sun 07:00) for the next Mon–Sun.
  - For each team, select at most one “weekly pick” game for that window (optionally two for top-signal teams in future).
- Daily roll-forward (secondary):
  - Daily (07:00) evaluate games exactly 7 days out.
  - If a team has no posted game within the past 7 days (cooldown), pick its highest‑priority game within a week and schedule it.
- Per-team cap:
  - ≤1 active at a time; weekly pick takes precedence over daily marquee.
- Tie-breakers:
  - Prefer home game; then national TV; then earlier start time.
- Global caps:
  - Maintain NBA/WNBA total board caps, tier limits, and refill rules.
- Board lifecycle:
  - Boards open the moment games are posted. 1 board active per amount (1, 5, 10, 20).

## Live Score Updates
- Frequency: every 30s during active windows; otherwise idle.
- Trigger windows per league (example US ET windows):
  - NFL: Thu 19:30–23:59, Sun 12:30–23:59, Mon 19:30–23:59 (expand for playoffs).
  - NBA/WNBA: 18:30–23:59 daily in season.
  - CFB: Sat 12:00–23:59; occasional Thu/Fri bowls.
- Logic:
  1) Query games with `status in ['scheduled','live']` and `startTime within ±6h`.
  2) Fetch league payloads; map game by id; apply diff-only updates (reduce writes).
  3) Write `homeScore/awayScore`, quarter splits, `quarter`, `timeRemaining`, flags `isLive`/`isOver`.
  4) Persist `broadcastProvider` if provided.

## Provider Integration (ESPN)

- Endpoints
  - NFL: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=YYYYMMDD`
  - NBA: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD`
  - CFB: `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=YYYYMMDD`
  - WNBA: `https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard?dates=YYYYMMDD`
  - Summary (for linescores/OT): `https://site.api.espn.com/apis/site/v2/sports/{sportPath}/{league}/summary?event={gameID}`

- Preload mapping (per game)
  - Resolve teams → `teams/{teamId}` (match by `teams.externalIds.espn` or `abbrev/sport`); create if missing.
  - Upsert `games/{gameId}` fields:
    - `gameID, sport, homeTeam(ref), awayTeam(ref)`
    - `startTime` (UTC from `event.date`), `gameDate` (YYYY-MM-DD in league-local TZ)
    - `season`, `week` (if available)
    - `broadcastProvider` (from `competitions[].broadcasts[]`)
    - `status` (`status.type.name`), `statusState` (`status.type.state`), `statusDetail` (`status.type.detail`)
    - `quarter` (string of `status.period`), `timeRemaining` (`status.displayClock`)
    - `isLive` (statusState == 'in'), `isOver` (status == 'final')
    - `homeScore/awayScore` (numbers)
    - `lastUpdated`, `created`

- Quarter/OT splits (winners)
  - Call summary per game; map linescores to:
    - `homeQ1score/homeQ2score/homeQ3score/homeFscore`
    - `awayQ1score/awayQ2score/awayQ3score/awayFscore`
    - `homeOTscore/awayOTscore` (sum OT periods when present)
  - Write diff-only (skip if unchanged).

- Live refresh
  - In league windows, fetch scoreboard; for in-play/near-start games update status, `quarter`, `timeRemaining`, aggregate scores.
  - For in-play games also fetch summary to keep splits current; diff-only writes.
  - On `final`, set `isOver=true`, `endTime=now`, ensure final splits persisted.

- Schedules (optional)
  - Write curated lists to `schedules/{sport}/{YYYY-MM-DD}` as `{ gameIds[], lastUpdated }` for lobby performance.

- Reliability & rate limits
  - Batch by league/date; keep concurrency small (≤5); add 200–500ms jitter between summary calls.
  - Retries with exponential backoff; circuit-break per sport on sustained failures.
  - Idempotent updates using field diffs; update `lastUpdated` on change.

- Team canonicalization
  - Maintain `teams.externalIds.espn` and `teams.sport` for stable joins.
  - Games store references only; denorm optional for UI.

---

## Cloud Functions Inventory

### Current (from `functions/index.js`)
- onGameUpdatedAssignWinners (Firestore onUpdate: `games/{gameId}`)
  - Detects Q1→Q2, Q2→Q3, Q3→Q4, and final; assigns winners per board via last‑digit match.
- settleBoardFinalPayouts (Firestore onUpdate: `boards/{boardId}`)
  - Pays final winners, creates transactions/notifications, marks board settled.
- ensureGameBoards (Firestore onWrite: `games/{gameId}`)
  - Auto‑creates standard boards (amounts: 1,5,10,20) when a game becomes `scheduled`.
- handleBoardFull (Firestore onUpdate: `boards/{boardID}`)
  - When board fills: assign axis numbers, update squares with XY, notify users, optionally create next board.
- getBoardUserSelections (Callable)
  - Returns indices the authenticated user owns on a board.
- enterBoard (Callable)
  - Validates purchase, writes squares, updates board, creates transaction + notification; supports free sweepstakes rule.
- checkSweepstakesParticipation (Callable)
  - Checks if user already joined a sweepstakes (participants subcollection).
- checkUsernameUnique / checkEmailUnique (HTTPS onRequest)
  - Existence checks against `users` collection.
- checkAuthEmailExists (HTTPS onRequest)
  - Verifies Auth user existence and password provider.
- createPayPalOrder / capturePayPalOrder (Callable)
  - PayPal deposit flow, creates transactions and notifications.
- requestWithdrawal (Callable)
  - Validates, debits balance, writes pending withdrawal transaction + notification.
- sendNotifications (Firestore onWrite: `notifications/{notificationId}`)
  - Sends email (Resend), SMS (Twilio), FCM push; cleans bad tokens.

### Planned (ESPN Integration)
- seedWeeklyBasketball (Scheduler: Sun 07:00)
  - For NBA/WNBA Mon–Sun window: select ≤1 game per team; write to `games` and schedule boards; update `schedules/{sport}/{YYYY-MM-DD}`.
- dailyRollForwardBasketball (Scheduler: 07:00 daily)
  - Evaluate games exactly +7 days; if team has no post in past 7 days, schedule its highest‑priority game.
- preloadBySport (Scheduler)
  - NFL (Tue 07:00): Thu–Mon slate; CFB (Sun 07:00): Mon–Sat; upsert `games`.
- liveUpdaterBySport (Scheduler: every 30s during windows)
  - Per sport window, fetch scoreboard; update status, quarter, timeRemaining, aggregate scores; call summary for splits.
  - Finalization: set `isOver`, `endTime`; winners pipeline continues via existing triggers.

Cron examples (Cloud Scheduler → Pub/Sub → Functions v2 or `onSchedule`):
```
# UTC examples (adjust to league locale if needed)
# Weekly seed (Sun 07:00 local → convert to UTC)
0 11 * * 0   # example: 07:00 EDT = 11:00 UTC

# Daily roll-forward (07:00 local)
0 11 * * *

# Live windows (example NBA daily 18:30–24:00 local, every 30s)
*/30 22-23 * * *   # hour block 18:00–19:59 local converted to UTC (example)
```

Implementation notes
- Use Functions v2 `onSchedule` for cron; small batch concurrency; diff‑only writes.
- Prefer DocumentReferences for joins (games, users); keep string denorms only if required for UI logs.

## Lobby UX Policy (NBA/WNBA)
- Tabs: Today, Tomorrow, This Week.
- Ordering: Favorites (user-followed teams) → Marquee (primetime/rivalry/standings impact) → All (collapsible groups by start time).
- Limits: Show top N (e.g., 10) with "Show more" to expand; 1 board per price tier (up to 3 tiers) per game to reduce clutter.
- Caching: optional `schedules/{sport}/{YYYY-MM-DD}` for fast lists/filters; hydrate details from `games` on demand.

## Finalization
- Detect end-of-game: provider status `final` OR zero clock with period terminal.
- Set `isOver=true`, lock scores, persist final quarter splits and `endTime`.
- Emit event (pub/sub or Firestore doc flag) for winner processing.

## Winner Processing (Existing Function)
- Consumes `games/{gameId}` quarter splits to compute last-digit winners for Q1, HT, Q3, Final.
- Writes payouts and board updates; idempotent (guard on already-paid markers).

## Error Handling
- Retries with exponential backoff on network/non-2xx.
- Circuit breaker per league if repeated failures.
- Log diffs, not full payloads.

## Indexes
- Composite: (league, status, startTime), (league, gameDate), (status, startTime).

## Time Zones
- Store `startTime` as UTC Timestamp; store `gameDate` (YYYY-MM-DD) in league local if needed for lobby grouping.

## Security
- Clients read-only on `games/*`, `boards/*`, `teams/*`, `sweepstakes/*`, `notifications/*`; writes via Functions/Admin only.

## Open Questions
- Team sync cadence (use `teams` collection for canonical; denormalize for game render).
- Schedules collection necessity (opt-in for heavy lobby traffic).


