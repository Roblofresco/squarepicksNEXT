# Game Scheduling & Update Plan

## Objectives
- Universal post time: schedule every league ingest for 05:00 Eastern (09:00 UTC).
- Ensure upcoming games for NFL, CFB, NBA, and WNBA are posted in Firestore with enough lead time for board creation.
- Keep `games/{gameId}` documents accurate through kickoff, live play, and final scores.
- Drive existing automation (`ensureGameBoards`, winner settlement) via consistent status and score updates.

## Weekly Posting Cadence

### NFL
- **Post window:** Tuesdays 05:00 ET (09:00 UTC) following the Monday game.
- **Coverage:** Upcoming Thursday–Monday slate for the same NFL week.
- **Mechanism:** Cloud Scheduler → HTTPS `ingestNflGamesByDateHttp?date=YYYYMMDD` for each date in window.
- **Notes:** Persist `week` from ESPN, update `status` to `scheduled`, and rely on `ensureGameBoards` to create price-tier boards.
- **Cron:** Cloud Scheduler job `0 9 * * 2` (09:00 UTC every Tuesday) hits HTTPS endpoint for each date in the upcoming slate (Thu–Mon) to preload games one full week ahead of kickoff.
- **Board lifecycle:** `ensureGameBoards` will create four paid boards (amounts 1/5/10/20). Consider manual creation (or optional automation) for free boards tied to sweepstakes when marketing requires.
- **Weekly game structure:**
  - **Thursday:** One primetime game each week (20:15 ET) plus Thanksgiving triple-header (12:30, 16:30, 20:20 ET) and occasional Black Friday (15:00 ET).
  - **Sunday:**
    - Early window 13:00 ET (bulk of games).
    - Late window 16:05/16:25 ET (selected matchups).
    - Sunday Night Football 20:20 ET.
    - International Series weeks feature 09:30 ET kickoffs (London/Europe) in Weeks 4–6+; occasional Germany games (09:30 ET) or Mexico City (Monday night 20:15 ET).
  - **Monday:** One primetime game 20:15 ET; select weeks include doubleheaders at 19:15 + 20:15 or staggered 19:15 + 22:15 ET.
  - **Saturday (late season):** Weeks 15–18 include flexed Saturday triple-headers (13:00, 16:30, 20:15 ET) or single marquee games.
  - **Bye weeks:** Weeks 5–14, fewer total games; ingest still covers full Thu–Mon window.
  - **Playoffs:** Wild Card through Championship rounds primarily Sat/Sun; adjust live update cron when postseason schedule released.
- **Automation components:**
  - `scheduleIngestNflWeeklySlate` (`onSchedule` 05:00 ET Tue) loops the Thu–Mon slate and calls `ingestNflGamesByDate` internally.
  - `liveUpdateNflGames` (`onSchedule` every minute) checks league windows and updates all `isLive && !isOver` games via shared helpers.
  - Shared helper `ingestGamesForSportDate` powers callable/HTTP/scheduled paths to reduce duplication.

### CFB
- **Post window:** Sundays 05:00 ET (09:00 UTC) after the Saturday slate.
- **Coverage:** Upcoming Monday–Saturday games (regular season) and bowl windows as needed; only ingest matchups where at least one team is ranked in the current AP Top 25.
- **Mechanism:** Scheduler job iterates dates using `getSportPaths('CFB')` with new callable `ingestCollegeFootballByDate` (analogous to NFL ingest) and filters events by AP ranking before upserting.
- **Ranking filter implementation:**
  - Before writing any game, fetch AP Top 25 list (e.g., ESPN rankings endpoint) and cache team IDs for the run.
  - While iterating scoreboard events, check `competitors[].team.rank` or team ID against the cached list; skip games with no ranked participant.
  - Log skipped games for observability (`console.info` with team names and reason).
- **Notes:** Capture conference title/bowl games by extending window when ESPN lists future events.

### NBA
- **Weekly seed:** Sundays 05:00 ET (09:00 UTC) for the next Monday–Sunday window.
  - Select marquee game per team (max one active per team) prioritizing national broadcasts and rivalries.
  - Upsert via new function `seedBasketballWeek({ sport: 'NBA', startDate })` that wraps `upsertGameFromEspnEvent`.
- **Daily roll-forward:** Every morning 05:00 ET evaluate games exactly 7 days out.
  - Use `dailyBasketballTopOff` to ensure teams without an active posted game get one queued.
- **Notes:** NBA schedule density (games nearly every day) requires per-team throttling to avoid board overload.

### WNBA
- **Weekly seed:** Mondays 05:00 ET (09:00 UTC) for the next Tuesday–Monday window (aligns with typical Tue/Fri/Sun cadence).
- **Daily roll-forward:** Same `dailyBasketballTopOff` with `sport: 'WNBA'` but window limited to in-season months (May–Sep), executed at 05:00 ET.
- **Notes:** Apply stricter per-team cap (one active board total) due to shorter schedule.

## Live Score Update Windows
- **NFL:** Thu 19:00–23:59 ET, Sun 12:00–23:59 ET, Mon 19:00–23:59 ET (adjust for playoffs). Scheduler every 60s triggering `liveUpdateLeague({ sport: 'NFL' })`.
- **CFB:** Sat 12:00–23:59 ET plus Thu/Fri specialty games (configure additional cron blocks).
- **NBA/WNBA:** Daily 18:00–00:30 ET (seasonal). Use throttled 60s cron, increase to 30s for playoffs if needed.
- `liveUpdateLeague` fetches scoreboard payload, updates aggregate scores/status, and calls `updateSplitsFromSummary` for in-progress games.

## Cloud Functions & Jobs

| Function | Type | Purpose |
| --- | --- | --- |
| `ingestNflGamesByDate`, `ingestNflGamesByDateHttp` | Callable/HTTPS | Already present; reuse for NFL scheduler. |
| `ingestCollegeFootballByDate` *(new)* | Callable/HTTPS | Clone NFL ingest with `sport='CFB'`. |
| `seedBasketballWeek` *(new)* | Callable | Batch ingest NBA/WNBA weekly windows. |
| `dailyBasketballTopOff` *(new)* | Callable | Ensure per-team coverage 7 days out. |
| `liveUpdateGameOnce` | Callable | Existing single-game refresher used by league updater. |
| `liveUpdateLeague` *(new)* | Callable | Iterate live games and call `liveUpdateGameOnce`. |
| `ensureGameBoards` | Firestore trigger | Already creates boards for scheduled games. |

| Cloud Scheduler Job | Cron (UTC) | Target |
| --- | --- | --- |
| NFL Weekly | `0 9 * * 2` | HTTPS `ingestNflGamesByDateHttp` loop for Thu–Mon dates. |
| CFB Weekly | `0 9 * * 0` | Callable/HTTP ingest for Mon–Sat dates (AP Top 25 filter). |
| NBA Weekly Seed | `0 9 * * 0` | Call `seedBasketballWeek` with next Monday start. |
| NBA Daily Top-off | `0 9 * * *` | Call `dailyBasketballTopOff` (`sport='NBA'`). |
| WNBA Weekly Seed | `0 9 * * 1` | Call `seedBasketballWeek` (`sport='WNBA'`). |
| WNBA Daily Top-off | `0 9 * * *` | Call `dailyBasketballTopOff` (`sport='WNBA'`, seasonal guard). |
| NFL Live Window | `*/1 23-3 * * 4,5,0` etc. | Pub/Sub → `liveUpdateLeague('NFL')`. |
| CFB Live Window | `*/1 16-4 * * 5,6` | Pub/Sub → `liveUpdateLeague('CFB')`. |
| NBA/WNBA Live | `*/1 22-5 * * *` | Pub/Sub → `liveUpdateLeague('NBA'/'WNBA')`. |

*(Adjust cron blocks to league time zones and daylight-saving as needed.)*

## Firestore Field Alignment
- Standardize on camelCase (`homeScore`, `awayScore`, `isLive`, `isOver`) when updating documents.
- Ensure live updater also writes snake_case aliases (`home_score`, `away_score`) until downstream triggers migrate.
- Maintain `homeQ*score`/`awayQ*score` for quarter winners; include OT totals when available.

## Workflow Summary
1. **Weekly schedulers** preload upcoming slates per league, leveraging ESPN scoreboard data.
2. `ensureGameBoards` reacts to new `scheduled` games to create price-tier boards automatically.
3. **Daily basketball top-offs** keep NBA/WNBA boards fresh without duplicating team exposure.
4. **Live updaters** run during broadcast windows, updating status, scores, and splits.
5. Existing triggers (`onGameUpdatedAssignWinners`, `settleBoardFinalPayouts`) finalize payouts once games conclude.

## Outstanding Items
- Implement CFB ingest function and basketball seed/top-off functions.
- Add AP Top 25 poll fetch utility (with memoized cache) for CFB ingest.
- Decide on per-team marquee selection heuristics (current placeholder prioritizes national TV and home games).
- Add monitoring dashboards (Cloud Logging metrics + Firestore counts) for ingest success and board coverage.
- Add diff-aware write safeguards and retry/backoff monitoring for NFL live updater.

