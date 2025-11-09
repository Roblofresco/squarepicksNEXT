# Utilities Documentation

## Overview
Core utility functions for SquarePicks application including styling helpers and date calculations.

## Available Utilities

### Styling
- **[cn() - Class Name Utility](./cn-utility.md)** - Intelligent Tailwind CSS class merging

### Date & Time
- **[Date Utilities](./date-utils.md)** - NFL week calculations and Firestore timestamp conversion

## Quick Reference

| Utility | Purpose | Key Features |
|---------|---------|--------------|
| `cn()` | Class merging | Conflict resolution, conditional classes |
| `getNFLWeekRange()` | Week calculation | Tuesday-Monday NFL weeks |
| `getFirestoreTimestampRange()` | Timestamp conversion | Firestore query support |
| `formatDateRange()` | Date formatting | Human-readable ranges |

## Common Usage Patterns

### Component Styling
```typescript
import { cn } from '@/lib/utils';

function Button({ variant, size, className }) {
  return (
    <button
      className={cn(
        'rounded font-medium',
        variant === 'primary' && 'bg-blue-500',
        variant === 'secondary' && 'bg-gray-200',
        className
      )}
    />
  );
}
```

### Week-Based Queries
```typescript
import { getFirestoreTimestampRange } from '@/lib/date-utils';

const { startTimestamp, endTimestamp } = getFirestoreTimestampRange();

const games = await getDocs(
  query(
    collection(db, 'games'),
    where('scheduledDate', '>=', startTimestamp),
    where('scheduledDate', '<=', endTimestamp)
  )
);
```

## Dependencies

- `clsx`: Conditional class names
- `tailwind-merge`: Tailwind conflict resolution
- `firebase/firestore`: Timestamp type

## Best Practices

1. **Use cn() for all Tailwind classes**: Ensures proper conflict resolution
2. **Cache date calculations**: NFL week changes only once per week
3. **Type safety**: All utilities have TypeScript definitions
4. **Composition**: Combine utilities for complex operations

## Related Documentation

- [Hooks](../hooks/README.md)
- [Integrations](../integrations/README.md)
- [Security](../security/README.md)

