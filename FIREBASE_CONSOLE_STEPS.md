# Firebase Console Manual Updates

**Status:** 30 duplicate teams deleted ✅. Now need to fix game refs and enrich old teams.

---

## STEP 1: Fix Game References (13 games) - DO THIS FIRST

**Critical:** Games currently have broken team refs since duplicates were deleted.

Go to: https://console.firebase.google.com/project/square-picks-vpbb8d/firestore/data/~2Fgames

### Click each game doc and UPDATE the team references:

**Game: 401772634** (DEN @ NYJ)
- Click `awayTeam` field → Change reference to: `teams/DjbPCyd97B5OqLNRGsym`
- Click `homeTeam` field → Change reference to: `teams/9cPsRpvGcXcXPPY2ZcK8`

**Game: 401772748** (CLE @ PIT)
- `awayTeam` → `teams/apamE1NKkS8ipZLtS158`
- `homeTeam` → `teams/NfejodWx0OxUQPxBwSfe`

**Game: 401772749** (SF @ TB)
- `awayTeam` → `teams/RUIBcaJ0TNPQadLB9iu7`
- `homeTeam` → `teams/gVEJIamddUIZtsAPHlXS`

**Game: 401772750** (LAC @ MIA)
- `awayTeam` → `teams/T222VgdaBavKnSNynsKY`
- `homeTeam` → `teams/V4yqAwq5XzJFpTsTB4Fe`

**Game: 401772751** (NE @ NO)
- `awayTeam` → `teams/WOItYy5G1yRVG0fESSmF`
- `homeTeam` → `teams/pOPmOJG8juYhDHPhABTZ`

**Game: 401772752** (CIN @ GB)
- `awayTeam` → `teams/R2h9AzWrdhqH23x3j3NW`
- `homeTeam` → `teams/ItcC7vuurg0AxNlZylsu`

**Game: 401772815** (BUF @ ATL) - MONDAY NIGHT
- `awayTeam` → `teams/q6PZdMtP19lVIi7UUQfr`
- `homeTeam` → `teams/ubbWz7RJZNUJbdGY9daA`

**Game: 401772855** (LAR @ BAL)
- `awayTeam` → `teams/V99Z9G2U2MXSr6E85IBY`
- `homeTeam` → `teams/RDnjryTT2mkizKSm9ikl`

**Game: 401772856** (ARI @ IND)
- `awayTeam` → `teams/NY4cLLiBKYInCKqdUyeH`
- `homeTeam` → `teams/ABZ1RckHosMndz32YZ1e`

**Game: 401772857** (SEA @ JAX)
- `awayTeam` → `teams/dnaR2Ckv9hDNMsP0vhh3`
- `homeTeam` → `teams/iz2nI7o69RLo2Upbid3N`

**Game: 401772858** (DAL @ CAR)
- `awayTeam` → `teams/p2IVSR62MKaK2IFWX0lU`
- `homeTeam` → `teams/EQIgUZ28Cf6FrITIxWy7`

**Game: 401772859** (TEN @ LV)
- `awayTeam` → `teams/XlimffsRX1wQd3YFTXeH`
- `homeTeam` → `teams/14ZKx8KbtUJUPiTtmVD0`

**Game: 401772923** (DET @ KC) - SUNDAY NIGHT
- `awayTeam` → `teams/KP13Gr1Pcl0v1E4beCZg`
- `homeTeam` → `teams/LWxconGs3OxmsVyLx8xM`

---

## STEP 2: Enrich Old Teams (31 teams)

Go to: https://console.firebase.google.com/project/square-picks-vpbb8d/firestore/data/~2Fteams

### For each team below, ADD three new fields:

**How to add fields:**
1. Click the team doc ID
2. Click "+ Add field" button
3. Add these 3 fields:
   - Field: `externalIds` (map) → Click "Add field" inside map → `espn` (string) → [ESPN ID from table]
   - Field: `abbrev` (string) → [Abbrev from table]
   - Field: `sport` (string) → `NFL`

| Doc ID (click this) | ESPN ID | Abbrev |
|---------------------|---------|--------|
| RDnjryTT2mkizKSm9ikl | 33 | BAL |
| EQIgUZ28Cf6FrITIxWy7 | 29 | CAR |
| WOItYy5G1yRVG0fESSmF | 17 | NE |
| DjbPCyd97B5OqLNRGsym | 7 | DEN |
| NGTMc6cY1ZCdDOJx93RP | 28 | WSH |
| M81pkB3UYIsVdy8YyjlE | 34 | HOU |
| pOPmOJG8juYhDHPhABTZ | 18 | NO |
| KP13Gr1Pcl0v1E4beCZg | 8 | DET |
| kUoV2wNaHKyhoRpzBZZM | 3 | CHI |
| V4yqAwq5XzJFpTsTB4Fe | 15 | MIA |
| ABZ1RckHosMndz32YZ1e | 11 | IND |
| V99Z9G2U2MXSr6E85IBY | 14 | LAR |
| ItcC7vuurg0AxNlZylsu | 9 | GB |
| R2h9AzWrdhqH23x3j3NW | 4 | CIN |
| gVEJIamddUIZtsAPHlXS | 27 | TB |
| LWxconGs3OxmsVyLx8xM | 12 | KC |
| NY4cLLiBKYInCKqdUyeH | 22 | ARI |
| aLErKrB7OpP0tEsJHAvQ | 16 | MIN |
| apamE1NKkS8ipZLtS158 | 5 | CLE |
| dnaR2Ckv9hDNMsP0vhh3 | 26 | SEA |
| XlimffsRX1wQd3YFTXeH | 10 | TEN |
| 9cPsRpvGcXcXPPY2ZcK8 | 20 | NYJ |
| p2IVSR62MKaK2IFWX0lU | 6 | DAL |
| nfRohFoPZESru1p0ynXG | 19 | NYG |
| iz2nI7o69RLo2Upbid3N | 30 | JAX |
| 1m0J9SlMFNkNbtubwAX8 | 21 | PHI |
| RUIBcaJ0TNPQadLB9iu7 | 25 | SF |
| ubbWz7RJZNUJbdGY9daA | 1 | ATL |
| NfejodWx0OxUQPxBwSfe | 23 | PIT |
| T222VgdaBavKnSNynsKY | 24 | LAC |
| q6PZdMtP19lVIi7UUQfr | 2 | BUF |

---

## VERIFICATION

1. Visit: https://squarepicks.com/lobby?sport=NFL
2. Check that team logos appear (Storage URLs, not broken)
3. Monday night game (BUF @ ATL) should show correct logos
4. Next Tuesday's ingest should NOT create new duplicate teams

---

## Summary

- ✅ Deleted 30 duplicate ESPN-logo teams (automated)
- ⏳ Fix 13 game refs (manual - Step 1)
- ⏳ Enrich 31 old teams (manual - Step 2)
- ✅ Cloud Function updated to read-only (deployed)
- ✅ Next.js config updated (deployed)

