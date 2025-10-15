# Team Merge Instructions

## Status
✅ **Completed:**
- Cloud Function updated to read-only (`findTeamByEspn`) with fallback queries
- Next.js config updated (Storage domain in images + CSP)
- Function deployment in progress

⏳ **Manual Steps Required:**
You need to update Firestore docs via Firebase Console because the service account lacks write permissions.

---

## Step 1: Enrich Old Teams with ESPN IDs

Add `externalIds.espn`, `abbrev`, and `sport: 'NFL'` to these old team docs:

### Firebase Console → Firestore → teams collection:

| Team Doc ID | Add Fields |
|-------------|------------|
| `RDnjryTT2mkizKSm9ikl` | `externalIds: {espn: "33"}`, `abbrev: "BAL"`, `sport: "NFL"` |
| `EQIgUZ28Cf6FrITIxWy7` | `externalIds: {espn: "29"}`, `abbrev: "CAR"`, `sport: "NFL"` |
| `WOItYy5G1yRVG0fESSmF` | `externalIds: {espn: "17"}`, `abbrev: "NE"`, `sport: "NFL"` |
| `DjbPCyd97B5OqLNRGsym` | `externalIds: {espn: "7"}`, `abbrev: "DEN"`, `sport: "NFL"` |
| `NGTMc6cY1ZCdDOJx93RP` | `externalIds: {espn: "28"}`, `abbrev: "WSH"`, `sport: "NFL"` |
| `M81pkB3UYIsVdy8YyjlE` | `externalIds: {espn: "34"}`, `abbrev: "HOU"`, `sport: "NFL"` |
| `pOPmOJG8juYhDHPhABTZ` | `externalIds: {espn: "18"}`, `abbrev: "NO"`, `sport: "NFL"` |
| `KP13Gr1Pcl0v1E4beCZg` | `externalIds: {espn: "8"}`, `abbrev: "DET"`, `sport: "NFL"` |
| `kUoV2wNaHKyhoRpzBZZM` | `externalIds: {espn: "3"}`, `abbrev: "CHI"`, `sport: "NFL"` |
| `V4yqAwq5XzJFpTsTB4Fe` | `externalIds: {espn: "15"}`, `abbrev: "MIA"`, `sport: "NFL"` |
| `ABZ1RckHosMndz32YZ1e` | `externalIds: {espn: "11"}`, `abbrev: "IND"`, `sport: "NFL"` |
| `V99Z9G2U2MXSr6E85IBY` | `externalIds: {espn: "14"}`, `abbrev: "LAR"`, `sport: "NFL"` |
| `ItcC7vuurg0AxNlZylsu` | `externalIds: {espn: "9"}`, `abbrev: "GB"`, `sport: "NFL"` |
| `R2h9AzWrdhqH23x3j3NW` | `externalIds: {espn: "4"}`, `abbrev: "CIN"`, `sport: "NFL"` |
| `gVEJIamddUIZtsAPHlXS` | `externalIds: {espn: "27"}`, `abbrev: "TB"`, `sport: "NFL"` |
| `LWxconGs3OxmsVyLx8xM` | `externalIds: {espn: "12"}`, `abbrev: "KC"`, `sport: "NFL"` |
| `NY4cLLiBKYInCKqdUyeH` | `externalIds: {espn: "22"}`, `abbrev: "ARI"`, `sport: "NFL"` |
| `aLErKrB7OpP0tEsJHAvQ` | `externalIds: {espn: "16"}`, `abbrev: "MIN"`, `sport: "NFL"` |
| `apamE1NKkS8ipZLtS158` | `externalIds: {espn: "5"}`, `abbrev: "CLE"`, `sport: "NFL"` |
| `dnaR2Ckv9hDNMsP0vhh3` | `externalIds: {espn: "26"}`, `abbrev: "SEA"`, `sport: "NFL"` |
| `XlimffsRX1wQd3YFTXeH` | `externalIds: {espn: "10"}`, `abbrev: "TEN"`, `sport: "NFL"` |
| `9cPsRpvGcXcXPPY2ZcK8` | `externalIds: {espn: "20"}`, `abbrev: "NYJ"`, `sport: "NFL"` |
| `p2IVSR62MKaK2IFWX0lU` | `externalIds: {espn: "6"}`, `abbrev: "DAL"`, `sport: "NFL"` |
| `nfRohFoPZESru1p0ynXG` | `externalIds: {espn: "19"}`, `abbrev: "NYG"`, `sport: "NFL"` |
| `iz2nI7o69RLo2Upbid3N` | `externalIds: {espn: "30"}`, `abbrev: "JAX"`, `sport: "NFL"` |
| `1m0J9SlMFNkNbtubwAX8` | `externalIds: {espn: "21"}`, `abbrev: "PHI"`, `sport: "NFL"` |
| `RUIBcaJ0TNPQadLB9iu7` | `externalIds: {espn: "25"}`, `abbrev: "SF"`, `sport: "NFL"` |
| `ubbWz7RJZNUJbdGY9daA` | `externalIds: {espn: "1"}`, `abbrev: "ATL"`, `sport: "NFL"` |
| `NfejodWx0OxUQPxBwSfe` | `externalIds: {espn: "23"}`, `abbrev: "PIT"`, `sport: "NFL"` |
| `T222VgdaBavKnSNynsKY` | `externalIds: {espn: "24"}`, `abbrev: "LAC"`, `sport: "NFL"` |
| `q6PZdMtP19lVIi7UUQfr` | `externalIds: {espn: "2"}`, `abbrev: "BUF"`, `sport: "NFL"` |

---

## Step 2: Remap Game Team References

Update `games` collection to point to old team docs instead of new ones:

### Game: `401772923` (DET @ KC)
- `awayTeam`: change from `teams/O80ekrd4Ra0KNUBdnQ3J` → `teams/KP13Gr1Pcl0v1E4beCZg`
- `homeTeam`: change from `teams/YQbBmODVv5xeaFWMMkrn` → `teams/LWxconGs3OxmsVyLx8xM`

### Game: `401772815` (BUF @ ATL)
- `awayTeam`: change from `teams/zfhrIPVFLlNIbFU4IKqA` → `teams/q6PZdMtP19lVIi7UUQfr`
- `homeTeam`: change from `teams/ttlT5U9UcjAJwpY3AcGB` → `teams/ubbWz7RJZNUJbdGY9daA`

*(Repeat for all other `games` docs with `sport: 'NFL'` — check each game's team refs and remap if they point to new team IDs)*

---

## Step 3: Delete New Duplicate Teams

Delete these team docs (created/updated Oct 12+):

```
51vRc3W1qDwSBNVA6LIX, FwEQvJ2d2NCFZiMP8fQI, GG5cJWs1ydU9qHT9qCR4,
HnyE2HWp2WEvQKBbC5rx, L2jzyVnm82FshlVqOXAz, LytgR0vWia3xCsbX5SAw,
O4j0DXGDapOHYloDP5yI, O80ekrd4Ra0KNUBdnQ3J, OxpvLA5Oxl9LY560v7zP,
QyusLutREIDJRqOfCA4A, UbcwegB0R55c7yX4eW1z, Vc3rmthzwzHr8RXpZNPp,
XNOcM3LzgG8xY92l1aId, XTKokiVLJRUXJg2P77Nw, XtTrfHEtD5MJebyeeScK,
YQbBmODVv5xeaFWMMkrn, a9i8KLcbnJR8J0cmz3hf, ahlbQv4L0aUNd8TmUqUP,
dVCOKGl8IsAP7VxBDWnM, dpPvMTHOaLH9vPlxl6Sl, enrtAXUhqGauUoyT8o5n,
fuMY59wlDsj3MkdSLW8k, iUUnAIgOk5aINUj99Hu0, kygW1kEawhvqzDnzlAOq,
oTnSKRUzrIJDSOdhkF47, qBJ0nB1huKhUbgKd1fTd, qELAttOPcrt5HKk5br3m,
ttlT5U9UcjAJwpY3AcGB, u2a10PlOYLg1l81A0aRw, vTV4SNcKOcdahd6QJHU2,
zfhrIPVFLlNIbFU4IKqA
```

**Exception:** Keep `14ZKx8KbtUJUPiTtmVD0` (Las Vegas Raiders) — it was already enriched with both Storage logo AND ESPN ID.

---

## Validation

1. Visit `https://squarepicks.com/lobby?sport=NFL`
2. Verify team logos render (Storage URLs)
3. Run next weekly ingest (Tue 05:00 ET) and confirm no new duplicate teams are created

---

## Rollback

If issues occur:
- Firestore rules allow read of teams/games, so reverting is safe
- Cloud Function can be redeployed to previous version via Firebase Console

