# ESPN API Integration

## Overview
Integration with ESPN's public sports data API for fetching NFL game schedules, scores, and live updates.

## API Details

### Base URL
```
https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/{endpoint}
```

### Endpoints Used

#### Scoreboard
```
GET /apis/site/v2/sports/football/nfl/scoreboard?dates={YYYYMMDD}
```

**Purpose**: Fetch games scheduled for a specific date

**Parameters**:
- `dates` (required): Date in YYYYMMDD format (e.g., `20241114`)

**Response Structure**:
```json
{
  "events": [
    {
      "id": "401671827",
      "name": "Team A at Team B",
      "shortName": "TEAMA @ TEAMB",
      "date": "2024-11-14T20:15Z",
      "status": {
        "type": {
          "name": "STATUS_IN_PROGRESS",
          "state": "in",
          "completed": false
        },
        "period": 2,
        "clock": "3:45"
      },
      "competitions": [
        {
          "competitors": [
            {
              "homeAway": "home",
              "team": {
                "id": "1",
                "displayName": "Team A",
                "abbreviation": "TEAMA"
              },
              "score": "14"
            },
            {
              "homeAway": "away",
              "team": {
                "id": "2",
                "displayName": "Team B",
                "abbreviation": "TEAMB"
              },
              "score": "10"
            }
          ]
        }
      ]
    }
  ]
}
```

## Implementation

### Location
- Test script: `functions/test-espn-api.js`
- Usage: Cloud Functions for game data ingestion and live score updates

### Retry Logic
```javascript
async function axiosGetWithRetry(url, options = {}, attempts = 3, backoffMs = 500) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await axios.get(url, options);
      return response;
    } catch (error) {
      if (i === attempts - 1) throw error;
      console.log(`Attempt ${i + 1} failed, retrying in ${backoffMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      backoffMs *= 2; // Exponential backoff
    }
  }
}
```

### Request Configuration
```javascript
const options = {
  timeout: 15000, // 15 second timeout
  headers: {
    'User-Agent': 'Mozilla/5.0' // Required for some endpoints
  }
};
```

### Fetch Scoreboard Events
```javascript
async function fetchScoreboardEvents(sport, yyyymmdd) {
  const sportPath = 'football';
  const league = 'nfl';
  const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/${league}/scoreboard?dates=${yyyymmdd}`;
  
  const resp = await axiosGetWithRetry(url, options, 3, 600);
  return resp?.data?.events || [];
}
```

## Authentication
**Type**: None (Public API)

ESPN's sports data API is publicly accessible and does not require API keys for the endpoints used.

## Rate Limits

### Observed Limits
- No official rate limit documentation
- Recommended: Max 1 request per second
- Implement exponential backoff for retries

### Best Practices
```javascript
// Throttle requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
await delay(1000); // Wait 1 second between requests
```

## Error Handling

### Common Errors

#### Network Timeout
```javascript
{
  code: 'ECONNABORTED',
  message: 'timeout of 15000ms exceeded'
}
```

**Solution**: Retry with exponential backoff

#### 404 Not Found
```javascript
{
  status: 404,
  message: 'No games found for date'
}
```

**Solution**: Return empty array, valid for dates without games

#### 503 Service Unavailable
```javascript
{
  status: 503,
  message: 'Service temporarily unavailable'
}
```

**Solution**: Retry with longer backoff

### Error Handler Example
```javascript
try {
  const events = await fetchScoreboardEvents('NFL', '20241114');
  console.log(`Found ${events.length} games`);
} catch (error) {
  if (error.code === 'ECONNABORTED') {
    console.error('Request timeout - API may be slow');
  } else if (error.response?.status === 404) {
    console.log('No games found for this date');
  } else {
    console.error('ESPN API error:', error.message);
  }
}
```

## Data Mapping

### Game Status Types
| ESPN Status | Description | SquarePicks Mapping |
|-------------|-------------|---------------------|
| `STATUS_SCHEDULED` | Game not started | `scheduled` |
| `STATUS_IN_PROGRESS` | Game ongoing | `live` |
| `STATUS_HALFTIME` | Halftime break | `halftime` |
| `STATUS_END_PERIOD` | Quarter ended | `live` (with period info) |
| `STATUS_FINAL` | Game completed | `final` |

### Period Mapping
| ESPN Period | Quarter |
|-------------|---------|
| 1 | Q1 |
| 2 | Q2 |
| 3 | Q3 |
| 4 | Q4 |
| 5 | OT |

## Usage Examples

### Fetch Today's Games
```javascript
const today = new Date();
const dateString = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
const games = await fetchScoreboardEvents('NFL', dateString);
```

### Fetch Week's Games
```javascript
async function fetchWeekGames(startDate, endDate) {
  const games = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateString = currentDate.toISOString().split('T')[0].replace(/-/g, '');
    const dayGames = await fetchScoreboardEvents('NFL', dateString);
    games.push(...dayGames);
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Rate limiting
    await delay(1000);
  }
  
  return games;
}
```

### Live Score Polling
```javascript
async function pollLiveScores(gameIds) {
  setInterval(async () => {
    const dateString = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const events = await fetchScoreboardEvents('NFL', dateString);
    
    // Filter for games we're tracking
    const trackedGames = events.filter(e => gameIds.includes(e.id));
    
    // Update Firestore with latest scores
    for (const game of trackedGames) {
      await updateGameScore(game.id, game);
    }
  }, 30000); // Poll every 30 seconds
}
```

## Performance Considerations

### Caching Strategy
```javascript
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

async function fetchWithCache(date) {
  const cached = cache.get(date);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchScoreboardEvents('NFL', date);
  cache.set(date, { data, timestamp: Date.now() });
  
  return data;
}
```

### Batch Processing
```javascript
// Fetch multiple dates in parallel with rate limiting
async function fetchMultipleDates(dates) {
  const results = [];
  
  for (const date of dates) {
    results.push(await fetchScoreboardEvents('NFL', date));
    await delay(1000); // Rate limiting
  }
  
  return results.flat();
}
```

## Dependencies

```json
{
  "axios": "^1.9.0"
}
```

## Environment Variables

None required (public API)

## Related Files

- `functions/test-espn-api.js` - API testing script
- Cloud Functions - Live score ingestion (not shown in current codebase)

## Testing

### Test Script Usage
```bash
cd functions
node test-espn-api.js
```

### Test Multiple Dates
```javascript
const testDates = [
  '20241114', // Thursday
  '20241117', // Sunday
  '20241118', // Monday
];

for (const date of testDates) {
  const events = await fetchScoreboardEvents('NFL', date);
  console.log(`${date}: ${events.length} games`);
}
```

## Troubleshooting

### No games returned
- Verify date format is YYYYMMDD
- Check if date has scheduled NFL games
- Inspect API response for errors

### Inconsistent data
- ESPN data may have delays (30-60 seconds)
- Quarter changes may not be instant
- Final scores may take time to reflect

### Request failures
- Implement retry logic with exponential backoff
- Add request timeout (15-30 seconds)
- Log failed requests for monitoring

## Future Enhancements

- Add support for other sports (NBA, MLB)
- Implement webhook notifications for score changes
- Add team statistics endpoints
- Cache responses in Redis
- Implement request pooling for better performance

## API Limitations

1. **No Authentication**: Cannot access premium data
2. **No Webhooks**: Must poll for updates
3. **Rate Limits**: Undocumented, must be conservative
4. **Data Delays**: 30-60 second delay on live scores
5. **No SLA**: Public API has no uptime guarantee

## Best Practices

1. **Implement Retry Logic**: Use exponential backoff
2. **Cache Responses**: Reduce redundant requests
3. **Rate Limiting**: Don't exceed 1 request/second
4. **Error Handling**: Gracefully handle all error types
5. **Timeout Configuration**: Set reasonable timeouts
6. **User-Agent Header**: Include in all requests
7. **Monitor Usage**: Log all requests for debugging
8. **Fallback Strategy**: Have backup data source if API fails

