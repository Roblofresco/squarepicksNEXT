# n8n Workflow Setup Guide

## Step 1: Use Existing OAuth2 Credential

**Good news!** You already have OAuth2 credentials configured in your "Firestore Manager" workflow.

The new workflow will automatically use your existing credential:
- **Name**: "Google Firebase Cloud Firestore account 2"
- **ID**: `peFFmhqOncia7Ukw`

**No additional credential setup needed!** ✅

---

## Step 2: Import Workflow

1. In n8n, click **Workflows** in left sidebar
2. Click **Add workflow** → **Import from File**
3. Select the file: `C:\Users\robeo\Documents\squarepicks\n8n-firestore-update-workflow.json`
4. Click **Import**
5. The workflow "Firestore Team Enrichment and Game Remapping" will open

---

## Step 3: Verify Workflow Configuration

The workflow should have these nodes in sequence:

```
Manual Trigger 
  ↓
Set Teams Data (31 teams)
  ↓
Split Out Teams
  ↓
Firestore Upsert Team (updates each team with ESPN ID, abbrev, sport)
  ↓
Set Games Data (13 games)
  ↓
Split Out Games
  ↓
Build Team Refs (creates Firestore references)
  ↓
Firestore Upsert Game (updates awayTeam/homeTeam refs)
```

### Check Firestore Nodes:

1. Click on **"Firestore Upsert Team"** node
2. Verify:
   - Authentication: **OAuth2** (already selected)
   - Credential: **Google Firebase Cloud Firestore account 2** (already linked)
   - Operation: **Create or Update**
   - Project ID: **square-picks-vpbb8d**
   - Collection: **teams**

3. Click on **"Firestore Upsert Game"** node
4. Verify:
   - Authentication: **OAuth2** (already selected)
   - Credential: **Google Firebase Cloud Firestore account 2** (already linked)
   - Operation: **Create or Update**
   - Project ID: **square-picks-vpbb8d**
   - Collection: **games**

**Everything should be pre-configured!** Just import and execute. ✅

---

## Step 4: Execute Workflow

1. Click **Save** button (top right) to save the workflow
2. Click **Execute Workflow** button (top right)
3. Watch the execution:
   - Manual Trigger → Set Teams Data (1 item)
   - Split Out Teams (31 items)
   - Firestore Upsert Team (31 items processed)
   - Set Games Data (1 item)
   - Split Out Games (13 items)
   - Build Team Refs (13 items)
   - Firestore Upsert Game (13 items processed)

**Expected Results:**
- ✅ 31 teams enriched with `externalIds.espn`, `abbrev`, `sport: 'NFL'`
- ✅ 13 games updated with correct team references

**Execution Time:** ~30-60 seconds

---

## Step 5: Verify Results

### Check Firestore Console:

1. Go to: https://console.firebase.google.com/project/square-picks-vpbb8d/firestore/data/~2Fteams
2. Click any team (e.g., `RDnjryTT2mkizKSm9ikl` - Baltimore Ravens)
3. Verify new fields exist:
   - `externalIds` (map) → `espn: "33"`
   - `abbrev: "BAL"`
   - `sport: "NFL"`

4. Go to: https://console.firebase.google.com/project/square-picks-vpbb8d/firestore/data/~2Fgames
5. Click game `401772815` (BUF @ ATL - Monday Night)
6. Verify team references:
   - `awayTeam` → Reference to `teams/q6PZdMtP19lVIi7UUQfr`
   - `homeTeam` → Reference to `teams/ubbWz7RJZNUJbdGY9daA`

### Check Frontend:

1. Visit: https://squarepicks.com/lobby?sport=NFL
2. Verify:
   - Team logos appear (not broken images)
   - Monday night game (BUF @ ATL) shows Buffalo Bills and Atlanta Falcons logos
   - All game cards display correctly

---

## Troubleshooting

### Error: "Missing credentials"
- Go back to Step 1 and configure the Google Service Account credential
- Make sure credential name is exactly: `Firebase Admin - SquarePicks`
- Re-open workflow and select the credential in both Firestore nodes

### Error: "Permission denied" or "PERMISSION_DENIED"
- Verify the `firebase-admin-key.json` file has Firestore write permissions
- Check that the service account has "Firebase Admin" or "Cloud Datastore User" role in GCP IAM

### Error: "Invalid reference format"
- The Firestore reference format in the Code node might need adjustment
- Current format: `projects/square-picks-vpbb8d/databases/(default)/documents/teams/{teamId}`
- This should work with Firestore REST API

### Execution Stuck or Slow:
- n8n processes items sequentially by default
- 31 teams + 13 games = 44 total Firestore operations
- Expected time: 30-60 seconds
- If > 2 minutes, check n8n logs for errors

---

## Alternative: Manual Execution via n8n API

If you prefer to trigger via API:

```bash
curl -X POST "http://your-n8n-instance/webhook/firestore-update" \
  -H "Content-Type: application/json"
```

(Requires adding a Webhook Trigger node to the workflow)

---

## Rollback

If something goes wrong:

1. n8n stores execution history with input/output for each node
2. Click **Executions** tab to view past runs
3. Click on the execution → expand nodes to see what data was written
4. Manually revert via Firebase Console if needed

**Note:** Duplicate teams were already deleted (irreversible). This workflow only enriches and remaps.

---

## Next Steps After Success

1. Delete or disable this workflow (one-time use)
2. Next Tuesday's ESPN ingest will use the `findTeamByEspn` function
3. Function will query by `externalIds.espn` and find existing teams
4. No new duplicates will be created ✅

