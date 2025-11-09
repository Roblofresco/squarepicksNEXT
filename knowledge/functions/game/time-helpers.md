# Time and Date Helper Functions

## Overview
Pure functions for handling dates, times, and timezone conversions. All NFL game scheduling uses **America/New_York (Eastern Time)** timezone.

---

## formatEtYyyyMmDd

### Type
Pure Transformation Function

### Purpose
Converts a Date object to YYYYMMDD string in America/New_York timezone.

### Input
- **date** (Date): JavaScript Date object

### Output
```javascript
"20241215"  // String in YYYYMMDD format
```

### Logic

#### Step 1: Format in Eastern Time
```javascript
const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).formatToParts(date);
```

**Why 'en-CA' locale?**
- Canada locale uses YYYY-MM-DD format
- Easier to parse than US format (MM/DD/YYYY)
- Consistent with ISO 8601

#### Step 2: Extract Components
```javascript
const y = parts.find(p => p.type === 'year')?.value || '0000';
const m = parts.find(p => p.type === 'month')?.value || '00';
const d = parts.find(p => p.type === 'day')?.value || '00';
```

#### Step 3: Concatenate
```javascript
return `${y}${m}${d}`;  // "20241215"
```

#### Step 4: Fallback to UTC (Error Case)
```javascript
catch {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
```

### Example
```javascript
const date = new Date('2024-12-15T18:30:00Z');  // UTC
formatEtYyyyMmDd(date);  // "20241215" (ET, same day)

const date2 = new Date('2024-12-16T03:30:00Z');  // UTC (late night)
formatEtYyyyMmDd(date2);  // "20241215" (ET, previous day)
```

### Business Rules
- Always uses Eastern Time (America/New_York)
- Critical for game date alignment (MNF games)
- ESPN API uses UTC, but game "day" is ET-based
- Fallback to UTC only on error (should never happen)

### Used By
- `formatEtDashedYyyyMmDd` - Dashed format
- `computeNflWeeklyDates` - Weekly schedule
- ESPN API date parameter construction

---

## formatEtDashedYyyyMmDd

### Type
Pure Transformation Function

### Purpose
Converts a Date object to YYYY-MM-DD string in America/New_York timezone.

### Input
- **date** (Date): JavaScript Date object

### Output
```javascript
"2024-12-15"  // String in YYYY-MM-DD format
```

### Logic
```javascript
const compact = formatEtYyyyMmDd(date);  // "20241215"
return `${compact.slice(0,4)}-${compact.slice(4,6)}-${compact.slice(6,8)}`;
```

### Example
```javascript
const date = new Date('2024-12-15T18:30:00Z');
formatEtDashedYyyyMmDd(date);  // "2024-12-15"
```

### Business Rules
- Uses same ET logic as `formatEtYyyyMmDd`
- Dashed format used for Firestore `gameDate` field
- Human-readable format
- ISO 8601 compatible

### Used By
- `upsertGameFromEspnEvent` - Setting `gameDate` field
- Game document creation

---

## getCurrentNflTuesdayUtc

### Type
Pure Calculation Function

### Purpose
Finds the most recent Tuesday at 05:00 ET (09:00 UTC) relative to the given date. Used as anchor point for NFL weekly schedule.

### Input
- **now** (Date, optional): Reference date (defaults to current time)

### Output
```javascript
Date  // Tuesday at 09:00 UTC (05:00 ET)
```

### Logic

#### Step 1: Start with Reference Date
```javascript
const d = new Date(now.getTime());
```

#### Step 2: Walk Backwards to Tuesday
```javascript
while (
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short'
  }).format(d) !== 'Tue'
) {
  d.setUTCDate(d.getUTCDate() - 1);
}
```

**Why America/New_York?**
- Tuesday in ET, not UTC
- NFL week defined by ET timezone
- Handles DST transitions correctly

#### Step 3: Set to 09:00 UTC (05:00 ET)
```javascript
d.setUTCHours(9, 0, 0, 0);  // 09:00 UTC = 05:00 ET (EST) or 04:00 ET (EDT)
return d;
```

**Note**: 09:00 UTC approximates 05:00 ET
- During EST (Nov-Mar): 09:00 UTC = 04:00 EST
- During EDT (Mar-Nov): 09:00 UTC = 05:00 EDT
- Close enough for weekly boundary

### Example
```javascript
// Called on Friday Dec 15, 2024 at noon ET
const tuesday = getCurrentNflTuesdayUtc(new Date('2024-12-15T17:00:00Z'));
// Returns: Tuesday Dec 12, 2024 09:00 UTC (04:00 EST)

// Called on Monday Dec 18, 2024 at noon ET
const tuesday2 = getCurrentNflTuesdayUtc(new Date('2024-12-18T17:00:00Z'));
// Returns: Tuesday Dec 12, 2024 09:00 UTC (04:00 EST)
// (same Tuesday - week hasn't rolled over yet)

// Called on Tuesday Dec 19, 2024 at 6am ET (after 5am cutoff)
const tuesday3 = getCurrentNflTuesdayUtc(new Date('2024-12-19T11:00:00Z'));
// Returns: Tuesday Dec 19, 2024 09:00 UTC (04:00 EST)
// (new week - past 5am ET Tuesday)
```

### Business Rules
- NFL week runs Tuesday 05:00 ET to Monday 23:59 ET
- Tuesday morning is administrative boundary
- Matches ESPN's week numbering
- Before 05:00 ET Tuesday = previous week
- After 05:00 ET Tuesday = current week

### Used By
- `computeNflWeeklyDates` - Weekly schedule generation
- `getNflSlateDatesForWeek` - Public wrapper

---

## computeNflWeeklyDates

### Type
Pure Calculation Function

### Purpose
Generates the three game days (Thursday, Sunday, Monday) for an NFL week, given the reference Tuesday.

### Input
- **referenceTuesday** (Date): Tuesday at 09:00 UTC (from `getCurrentNflTuesdayUtc`)

### Output
```javascript
["20241212", "20241215", "20241216"]  // Thu, Sun, Mon in YYYYMMDD format
```

### Logic

#### Step 1: Calculate Offsets from Tuesday
```javascript
const base = new Date(referenceTuesday.getTime());
const result = new Set();

// Thursday = Tuesday + 2 days
// Sunday = Tuesday + 5 days  
// Monday = Tuesday + 6 days
const offsets = [2, 5, 6];

for (const days of offsets) {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  result.add(formatEtYyyyMmDd(d));
}
```

#### Step 2: Return Sorted Array
```javascript
return Array.from(result).sort();
```

### Example
```javascript
const tuesday = new Date('2024-12-12T09:00:00Z');  // Dec 12 Tuesday
computeNflWeeklyDates(tuesday);
// Returns: ["20241212", "20241215", "20241216"]
// Thu Dec 12, Sun Dec 15, Mon Dec 16
```

### Business Rules
- Standard NFL week: Thursday Night, Sunday slate, Monday Night
- Always uses ET dates (via `formatEtYyyyMmDd`)
- Handles Saturday games automatically (ESPN returns them on query)
- Handles Friday games automatically (Black Friday)
- Set ensures uniqueness (redundant but safe)

### Game Day Schedule

**Thursday Night Football**
- 1 primetime game
- 20:15 ET start (typically)

**Sunday Games**
- Early games: 13:00 ET
- Late games: 16:05 ET, 16:25 ET
- Sunday Night: 20:20 ET
- International games: 09:30 ET (London)

**Monday Night Football**
- 1-2 primetime games
- 20:15 ET start (typically)

**Saturday Games** (Late Season)
- Not included in standard week
- ESPN API returns them when querying Sunday's date
- System handles automatically

### Used By
- `getNflSlateDatesForWeek` - Public wrapper
- `scheduleIngestNflWeeklySlate` - Weekly ingestion

---

## getNflSlateDatesForWeek

### Type
Public Convenience Function

### Purpose
Returns ESPN API date strings for the current NFL week.

### Input
- **referenceDate** (Date, optional): Reference date (defaults to now)

### Output
```javascript
["20241212", "20241215", "20241216"]  // YYYYMMDD strings for ESPN API
```

### Logic
```javascript
const currentTuesday = getCurrentNflTuesdayUtc(referenceDate);
return computeNflWeeklyDates(currentTuesday);
```

### Example
```javascript
// Called on Dec 15, 2024 (Sunday of Week 15)
getNflSlateDatesForWeek();
// Returns: ["20241212", "20241215", "20241216"]
// Thu Dec 12, Sun Dec 15, Mon Dec 16
```

### Used By
- `scheduleIngestNflWeeklySlate` - Weekly scheduled ingestion
- Admin tools for manual ingestion

---

## getEasternDayInfo

### Type
Pure Extraction Function

### Purpose
Extracts day of week and time information for a given date in America/New_York timezone.

### Input
- **date** (Date, optional): Date to analyze (defaults to now)

### Output
```javascript
{
  weekday: "Sun",  // Short day name: Mon, Tue, Wed, Thu, Fri, Sat, Sun
  hour: 20,        // Hour in 24-hour format (0-23)
  minute: 30       // Minute (0-59)
}
```

### Logic
```javascript
const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false
});

const parts = formatter.formatToParts(date);
const weekday = parts.find(p => p.type === "weekday")?.value || "";
const hour = Number(parts.find(p => p.type === "hour")?.value || "0");
const minute = Number(parts.find(p => p.type === "minute")?.value || "0");

return { weekday, hour, minute };
```

### Example
```javascript
const date = new Date('2024-12-15T20:30:00-05:00');  // Sunday 8:30 PM ET
getEasternDayInfo(date);
// { weekday: "Sun", hour: 20, minute: 30 }

const date2 = new Date('2024-12-16T01:30:00Z');  // Sunday 8:30 PM ET (UTC time)
getEasternDayInfo(date2);
// { weekday: "Sun", hour: 20, minute: 30 }
```

### Business Rules
- Always returns ET day/time regardless of input timezone
- Uses 24-hour format for consistency
- Handles DST transitions automatically

### Used By
- `isWithinNflLiveWindow` - Live game detection

---

## isWithinNflLiveWindow

### Type
Pure Boolean Function

### Purpose
Determines if the given time falls within typical NFL game broadcast windows in Eastern Time.

### Input
- **date** (Date, optional): Date to check (defaults to now)

### Output
```javascript
true  // or false
```

### Logic
```javascript
const { weekday, hour } = getEasternDayInfo(date);

switch (weekday) {
  case "Thu":
    return hour >= 19 && hour <= 23;  // 7 PM - 11 PM ET
    
  case "Fri":
    // Black Friday special (approx 15:00-18:00 ET)
    return hour >= 14 && hour <= 18;
    
  case "Sat":
    // Late-season Saturday slates typically 13:00-23:00 ET
    return hour >= 12 && hour <= 23;
    
  case "Sun":
    // Include Intl games (09:00) through SNF (23:00)
    return hour >= 9 && hour <= 23;
    
  case "Mon":
    return hour >= 19 && hour <= 23;  // 7 PM - 11 PM ET
    
  default:
    return false;
}
```

### Game Windows by Day

#### Thursday (TNF)
- **7:00 PM - 11:00 PM ET**
- Thursday Night Football
- 1 game typical

#### Friday (Special)
- **2:00 PM - 6:00 PM ET**
- Black Friday games (post-Thanksgiving)
- Rare occurrence

#### Saturday (Late Season)
- **12:00 PM - 11:00 PM ET**
- Weeks 15-18 only
- Multiple games possible
- College football season over

#### Sunday (Main Slate)
- **9:00 AM - 11:00 PM ET**
- London/Munich games: 9:30 AM ET
- Early games: 1:00 PM ET
- Late games: 4:05 PM, 4:25 PM ET
- Sunday Night Football: 8:20 PM ET

#### Monday (MNF)
- **7:00 PM - 11:00 PM ET**
- Monday Night Football
- 1-2 games typical

### Business Rules
- Conservative windows (includes pre/post game)
- Used to determine if live update polling needed
- Separate from ESPN status (catches edge cases)
- Not currently used in production (kept for reference)

### Used By
- **NOT CURRENTLY USED**
- Available for future optimizations
- Could gate `liveUpdateNflGames` execution

### Related Documentation
- [Business Rules: Live Updates](../../business-rules/live-updates.md)
- [Function: liveUpdateLeagueGames](./live-updates.md#liveUpdateLeagueGames)

