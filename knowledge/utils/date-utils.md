# Date Utilities

## Overview
Collection of utility functions for handling NFL week date calculations and Firestore timestamp conversions.

## Location
`src/lib/date-utils.ts`

## Purpose
Provides specialized date utilities for NFL season week calculations, date range formatting, and Firestore timestamp management.

---

## Functions

### getNFLWeekRange()

Calculates the current NFL week's date range based on NFL's Tuesday-to-Monday week structure.

#### Signature
```typescript
function getNFLWeekRange(): NFLWeekRange

interface NFLWeekRange {
  startDate: Date;      // Tuesday 00:00:00
  endDate: Date;        // Following Monday 23:59:59
  weekNumber: number;   // Week number since season start
}
```

#### How It Works

1. **Week Structure**: NFL weeks run Tuesday through Monday
2. **Start Calculation**: Finds the Tuesday that starts the current week
3. **End Calculation**: Adds 6 days to get the following Monday
4. **Week Number**: Calculates weeks elapsed since September 1st

#### Logic Flow
```typescript
// Get current day (0=Sunday, 1=Monday, ..., 6=Saturday)
const currentDay = now.getDay();

// Calculate days until Tuesday
// If today is Monday (1), go back 6 days
// If today is Tuesday (2), use today
// If today is Wed-Sun, go back to previous Tuesday
const daysUntilTuesday = (currentDay < 2 ? -5 : 2) - currentDay;
```

#### Usage Example
```typescript
import { getNFLWeekRange } from '@/lib/date-utils';

const { startDate, endDate, weekNumber } = getNFLWeekRange();

console.log(`NFL Week ${weekNumber}`);
console.log(`From: ${startDate.toLocaleDateString()}`);
console.log(`To: ${endDate.toLocaleDateString()}`);

// Example output:
// NFL Week 10
// From: 11/7/2024
// To: 11/13/2024
```

#### Edge Cases

- **Off-season**: May return negative week numbers before September
- **Season overlap**: Uses current year's September 1st if in season, previous year's if before September
- **Leap years**: Handled by JavaScript Date object

---

### getFirestoreTimestampRange()

Converts NFL week date range to Firestore Timestamp objects for database queries.

#### Signature
```typescript
function getFirestoreTimestampRange(): {
  startTimestamp: Timestamp;
  endTimestamp: Timestamp;
}
```

#### Usage Example
```typescript
import { getFirestoreTimestampRange } from '@/lib/date-utils';
import { collection, query, where } from 'firebase/firestore';

const { startTimestamp, endTimestamp } = getFirestoreTimestampRange();

// Query games for current NFL week
const gamesQuery = query(
  collection(db, 'games'),
  where('scheduledDate', '>=', startTimestamp),
  where('scheduledDate', '<=', endTimestamp)
);
```

#### Common Use Cases

##### Query Current Week's Games
```typescript
const { startTimestamp, endTimestamp } = getFirestoreTimestampRange();

const games = await getDocs(
  query(
    collection(db, 'games'),
    where('scheduledDate', '>=', startTimestamp),
    where('scheduledDate', '<=', endTimestamp)
  )
);
```

##### Filter Boards by Week
```typescript
const { startTimestamp, endTimestamp } = getFirestoreTimestampRange();

const boards = await getDocs(
  query(
    collection(db, 'boards'),
    where('createdAt', '>=', startTimestamp),
    where('createdAt', '<=', endTimestamp),
    where('status', '==', 'open')
  )
);
```

---

### formatDateRange()

Formats a date range into a human-readable string.

#### Signature
```typescript
function formatDateRange(start: Date, end: Date): string
```

#### Format
```
MMM D - MMM D
```

Examples:
- `"Nov 7 - Nov 13"`
- `"Dec 28 - Jan 3"`
- `"Sep 5 - Sep 11"`

#### Usage Example
```typescript
import { getNFLWeekRange, formatDateRange } from '@/lib/date-utils';

const { startDate, endDate, weekNumber } = getNFLWeekRange();
const formattedRange = formatDateRange(startDate, endDate);

console.log(`Week ${weekNumber}: ${formattedRange}`);
// Output: "Week 10: Nov 7 - Nov 13"
```

#### UI Integration
```typescript
function WeekSelector() {
  const { startDate, endDate, weekNumber } = getNFLWeekRange();
  
  return (
    <div>
      <h2>NFL Week {weekNumber}</h2>
      <p>{formatDateRange(startDate, endDate)}</p>
    </div>
  );
}
```

---

## Types

### NFLWeekRange
```typescript
interface NFLWeekRange {
  startDate: Date;      // Tuesday 00:00:00
  endDate: Date;        // Following Monday 23:59:59.999
  weekNumber: number;   // Week number relative to season start
}
```

---

## Constants and Assumptions

### NFL Week Structure
- **Start Day**: Tuesday at 00:00:00
- **End Day**: Following Monday at 23:59:59.999
- **Duration**: 7 days (6 full days + partial Monday)

### Season Start Date
- **Assumed Start**: September 1st of the current season year
- **Year Logic**: 
  - If current month is September or later: Use current year
  - If current month is before September: Use previous year

### Time Settings
```typescript
tuesday.setHours(0, 0, 0, 0);        // Start of day
nextMonday.setHours(23, 59, 59, 999); // End of day
```

---

## Dependencies

- `firebase/firestore`: Timestamp type for Firestore integration

---

## Best Practices

1. **Cache Results**: Week range changes only once per week (on Tuesday)
2. **Timezone Aware**: Uses local timezone; consider UTC for server-side
3. **Season Boundaries**: Handle edge cases at season start/end
4. **Combine Functions**: Use together for complete workflow

---

## Common Patterns

### Lobby Games Filter
```typescript
function useCurrentWeekGames() {
  const [games, setGames] = useState([]);
  
  useEffect(() => {
    const { startTimestamp, endTimestamp } = getFirestoreTimestampRange();
    
    const q = query(
      collection(db, 'games'),
      where('scheduledDate', '>=', startTimestamp),
      where('scheduledDate', '<=', endTimestamp),
      orderBy('scheduledDate', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGames(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    
    return unsubscribe;
  }, []);
  
  return games;
}
```

### Week Navigation Component
```typescript
function WeekNavigator() {
  const { startDate, endDate, weekNumber } = getNFLWeekRange();
  
  return (
    <div className="week-navigator">
      <button>← Previous Week</button>
      <div>
        <strong>Week {weekNumber}</strong>
        <span>{formatDateRange(startDate, endDate)}</span>
      </div>
      <button>Next Week →</button>
    </div>
  );
}
```

### Admin Week Report
```typescript
async function generateWeekReport() {
  const { startDate, endDate, weekNumber } = getNFLWeekRange();
  const { startTimestamp, endTimestamp } = getFirestoreTimestampRange();
  
  const games = await getGamesInRange(startTimestamp, endTimestamp);
  const boards = await getBoardsInRange(startTimestamp, endTimestamp);
  
  return {
    title: `NFL Week ${weekNumber} Report`,
    dateRange: formatDateRange(startDate, endDate),
    totalGames: games.length,
    activeBoards: boards.length,
    // ... more metrics
  };
}
```

---

## Performance Considerations

- **Pure Functions**: No side effects, safe to call repeatedly
- **Lightweight**: Minimal computation required
- **Memoization**: Consider memoizing in components that call frequently
- **Date Object Creation**: Creates new Date objects each call

---

## Troubleshooting

### Week number seems wrong
- Check if season start assumption (Sep 1) matches actual NFL season start
- Verify current date and timezone are correct
- Consider adjusting season start date constant

### Timestamp queries not working
- Ensure Firestore fields are stored as Timestamp type
- Check field names match exactly
- Verify indexes exist for compound queries

### Date range formatting issues
- Check locale settings if format looks unexpected
- Verify browser supports `toLocaleDateString` with options
- Consider using date-fns or dayjs for more control

### Week boundary edge cases
- Test around Tuesday midnight transitions
- Consider UTC vs local timezone implications
- Add buffer time if needed for distributed systems

---

## Future Enhancements

Possible improvements:
- Support for different sports/leagues
- Configurable week start day
- UTC timestamp support
- Week offset navigation
- Playoff week handling
- Season year override parameter

---

## Related Utilities

- `firebase/firestore`: Timestamp and date query operations
- `date-fns`: External library for advanced date operations (not currently used)
- NFL schedule API integrations (ESPN)

