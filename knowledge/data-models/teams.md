# Teams Collection

## Overview
Sports team reference data for all supported leagues (NFL, CFB, NBA, WNBA). Provides team names, abbreviations, logos, and external ID mappings.

## Collection Path
`teams/{teamId}`

## Document Structure

### Core Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `full_name` | string | Yes | Full team name (e.g., "Kansas City Chiefs") |
| `city` | string | Yes | Team city (e.g., "Kansas City") |
| `name` | string | Yes | Team name without city (e.g., "Chiefs") |
| `abbrev` | string | Yes | Team abbreviation (e.g., "KC") |
| `sport` | string | Yes | Sport identifier (NFL, CFB, NBA, WNBA) |

### Visual Assets
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `logo_url` | string | No | Team logo image URL |
| `primary_color` | string | No | Primary team color (hex code) |
| `secondary_color` | string | No | Secondary team color (hex code) |

### External IDs
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `externalIds` | map | No | External API ID mappings |
| `externalIds.espn` | string | No | ESPN team ID |
| `team_id` | string | No | Legacy ESPN team ID field |

### League/Conference (College)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `league` | string | No | League name (for college teams) |
| `conference` | string | No | Conference (e.g., "SEC", "Big Ten") |

## Team Lookup Logic

Teams are looked up from ESPN API data using a fallback strategy:

### Lookup Priority
1. **ESPN External ID** (primary): `externalIds.espn`
2. **Sport + Abbreviation**: `sport` + `abbrev`
3. **Legacy Team ID** (fallback): `team_id`

### Implementation
```javascript
async function findTeamByEspn(db, sport, espnTeam) {
  const espnId = String(espnTeam?.id || "");
  const abbrev = String(espnTeam?.abbreviation || espnTeam?.shortDisplayName || "").trim();
  
  // Try by externalIds.espn
  if (espnId) {
    const q1 = await db.collection('teams')
      .where('externalIds.espn', '==', espnId)
      .limit(1)
      .get();
    if (!q1.empty) return q1.docs[0].ref;
  }
  
  // Fallback by sport + abbrev
  if (abbrev) {
    const q2 = await db.collection('teams')
      .where('sport', '==', sport)
      .where('abbrev', '==', abbrev)
      .limit(1)
      .get();
    if (!q2.empty) return q2.docs[0].ref;
  }
  
  // Fallback by legacy team_id
  if (espnId) {
    const q3 = await db.collection('teams')
      .where('team_id', '==', espnId)
      .limit(1)
      .get();
    if (!q3.empty) return q3.docs[0].ref;
  }
  
  // Not found - must be added manually
  throw new Error(
    `Team not found: ${espnTeam?.displayName || abbrev || espnId} (ESPN ID: ${espnId}). ` +
    `Please add this team to Firestore manually.`
  );
}
```

## ESPN Team Mapping

### ESPN Data Structure
```javascript
{
  id: "16",
  abbreviation: "KC",
  displayName: "Kansas City Chiefs",
  shortDisplayName: "Chiefs",
  name: "Chiefs",
  location: "Kansas City",
  logos: [{ href: "https://..." }]
}
```

### Firestore Mapping
```javascript
{
  full_name: "Kansas City Chiefs",
  city: "Kansas City",
  name: "Chiefs",
  abbrev: "KC",
  sport: "NFL",
  externalIds: {
    espn: "16"
  },
  logo_url: "https://..."
}
```

## Document Examples

### NFL Team
```javascript
{
  full_name: "Tampa Bay Buccaneers",
  city: "Tampa Bay",
  name: "Buccaneers",
  abbrev: "TB",
  sport: "NFL",
  externalIds: {
    espn: "27"
  },
  logo_url: "https://a.espncdn.com/i/teamlogos/nfl/500/tb.png",
  primary_color: "#D50A0A",
  secondary_color: "#FF7900"
}
```

### College Football Team
```javascript
{
  full_name: "Alabama Crimson Tide",
  city: "Alabama",
  name: "Crimson Tide",
  abbrev: "ALA",
  sport: "CFB",
  league: "NCAA",
  conference: "SEC",
  externalIds: {
    espn: "333"
  },
  logo_url: "https://a.espncdn.com/i/teamlogos/ncaa/500/333.png",
  primary_color: "#9E1B32",
  secondary_color: "#828A8F"
}
```

### NBA Team
```javascript
{
  full_name: "Los Angeles Lakers",
  city: "Los Angeles",
  name: "Lakers",
  abbrev: "LAL",
  sport: "NBA",
  externalIds: {
    espn: "13"
  },
  logo_url: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
  primary_color: "#552583",
  secondary_color: "#FDB927"
}
```

## Indexes Required
- `externalIds.espn` (ascending) - Primary lookup
- `sport` + `abbrev` (composite) - Fallback lookup
- `team_id` (ascending) - Legacy lookup
- `sport` (ascending) - List teams by sport

## Related Collections
- **games**: Home and away team references
- **boards**: Indirectly via games

## Business Rules

### Read-Only Collection
- Teams are reference data, not modified by users
- Updates only via admin or data import scripts
- Missing teams must be added manually (system will error and halt)

### Required for Game Ingestion
- Games cannot be created without valid team references
- ESPN integration will throw error if team not found
- Error message includes ESPN ID for manual addition

### Unique Constraints
- `sport` + `abbrev` should be unique (enforced by lookup logic)
- `externalIds.espn` should be unique per sport (enforced by lookup logic)

## Team Management

### Adding New Team
```javascript
await db.collection('teams').add({
  full_name: "Team Full Name",
  city: "City",
  name: "Mascot",
  abbrev: "ABC",
  sport: "NFL",
  externalIds: {
    espn: "123"
  },
  logo_url: "https://...",
  primary_color: "#000000",
  secondary_color: "#FFFFFF"
});
```

### Updating Team
```javascript
await db.doc(`teams/${teamId}`).update({
  logo_url: "https://new-logo-url.com",
  primary_color: "#123456",
  updated_time: FieldValue.serverTimestamp()
});
```

### Bulk Import from ESPN
```javascript
// Script to populate teams from ESPN API
const { sportPath, league } = getSportPaths('NFL');
const response = await axios.get(
  `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/${league}/teams`
);

const teams = response.data.sports[0].leagues[0].teams;
const batch = db.batch();

teams.forEach(teamData => {
  const team = teamData.team;
  const teamRef = db.collection('teams').doc();
  
  batch.set(teamRef, {
    full_name: team.displayName,
    city: team.location,
    name: team.name,
    abbrev: team.abbreviation,
    sport: 'NFL',
    externalIds: {
      espn: team.id
    },
    logo_url: team.logos?.[0]?.href || '',
    primary_color: `#${team.color || '000000'}`,
    secondary_color: `#${team.alternateColor || 'FFFFFF'}`
  });
});

await batch.commit();
```

## Query Examples

### Get Team by ID
```javascript
const teamRef = db.doc(`teams/${teamId}`);
const teamSnap = await teamRef.get();
const teamData = teamSnap.data();
```

### Find Team by ESPN ID
```javascript
const teamSnap = await db.collection('teams')
  .where('externalIds.espn', '==', '16')
  .limit(1)
  .get();
```

### Find Team by Sport and Abbreviation
```javascript
const teamSnap = await db.collection('teams')
  .where('sport', '==', 'NFL')
  .where('abbrev', '==', 'KC')
  .limit(1)
  .get();
```

### List All Teams for Sport
```javascript
const teamsSnap = await db.collection('teams')
  .where('sport', '==', 'NFL')
  .orderBy('full_name')
  .get();
```

## Display Usage

### Game Title
```javascript
const gameSnap = await db.doc(`games/${gameId}`).get();
const gameData = gameSnap.data();

const homeTeamSnap = await gameData.homeTeam.get();
const awayTeamSnap = await gameData.awayTeam.get();

const homeTeamName = homeTeamSnap.data().full_name;
const awayTeamName = awayTeamSnap.data().full_name;

const gameTitle = `${awayTeamName} @ ${homeTeamName}`;
// Example: "Tampa Bay Buccaneers @ Kansas City Chiefs"
```

### Short Display
```javascript
const shortDisplay = `${awayTeamData.abbrev} @ ${homeTeamData.abbrev}`;
// Example: "TB @ KC"
```

### Logo Display
```javascript
<img src={teamData.logo_url} alt={teamData.full_name} />
```

### Team Colors
```javascript
const teamColors = {
  primary: teamData.primary_color,
  secondary: teamData.secondary_color
};

// Use in UI theming
<div style={{ 
  backgroundColor: teamColors.primary,
  color: teamColors.secondary 
}}>
  {teamData.abbrev}
</div>
```

## Error Handling

### Team Not Found
When ESPN provides unknown team:
```
Error: Team not found: Tampa Bay Buccaneers (ESPN ID: 27). 
Please add this team to Firestore manually.
```

**Resolution**:
1. Note ESPN ID from error
2. Look up team on ESPN
3. Manually add to Firestore with correct data
4. Retry game ingestion

### Missing Team Reference
```javascript
// Validate team reference exists before use
if (gameData.homeTeam) {
  const teamSnap = await gameData.homeTeam.get();
  if (!teamSnap.exists) {
    console.error('Home team reference invalid');
  }
}
```

## Data Migration

### Adding externalIds Field
```javascript
// Migrate from team_id to externalIds.espn
const teamsSnap = await db.collection('teams')
  .where('team_id', '!=', '')
  .get();

const batch = db.batch();
teamsSnap.docs.forEach(doc => {
  const teamId = doc.data().team_id;
  if (teamId) {
    batch.update(doc.ref, {
      'externalIds.espn': teamId
    });
  }
});

await batch.commit();
```

### Updating Logo URLs
```javascript
// Update logo URLs from ESPN
for (const teamDoc of teamsSnap.docs) {
  const espnId = teamDoc.data().externalIds?.espn;
  if (!espnId) continue;
  
  // Fetch from ESPN
  const logoUrl = `https://a.espncdn.com/i/teamlogos/nfl/500/${teamDoc.data().abbrev.toLowerCase()}.png`;
  
  await teamDoc.ref.update({ logo_url: logoUrl });
}
```

## Performance Considerations

### Caching
- Team data rarely changes
- Cache team lookups in memory during game ingestion
- Client-side caching for team logos and names

### Reference Resolution
- Team references resolved during game creation
- Stored as DocumentReference in game document
- Dereferenced when displaying game details

### Batch Operations
- Use batch writes for bulk team imports
- Limit batches to 500 operations
- Teams should be pre-populated before game ingestion

## Future Enhancements

### Additional Sports
- MLB teams
- NHL teams
- Soccer leagues (MLS, European leagues)

### Team Stats
- Win/loss records
- Rankings
- Roster data

### Historical Data
- Team name changes
- Relocations
- Defunct teams

### Advanced Display
- Alternate logos
- Jersey colors
- Stadium information

