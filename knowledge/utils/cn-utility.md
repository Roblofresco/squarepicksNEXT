# cn() Utility Function

## Overview
Utility function for intelligently merging Tailwind CSS classes with conflict resolution.

## Location
`src/lib/utils.ts`

## Purpose
Combines `clsx` and `tailwind-merge` to create a powerful class name utility that handles conditional classes and resolves Tailwind CSS class conflicts.

## Function Signature

```typescript
function cn(...inputs: ClassValue[]): string
```

### Parameters
- `inputs`: Variable number of `ClassValue` arguments (strings, objects, arrays, undefined, null, boolean)

### Returns
- `string`: Merged and deduplicated class string

## Usage

### Basic Class Combination
```typescript
import { cn } from '@/lib/utils';

cn('px-4 py-2', 'bg-blue-500 text-white')
// Result: "px-4 py-2 bg-blue-500 text-white"
```

### Conditional Classes
```typescript
cn('base-class', {
  'active-class': isActive,
  'disabled-class': isDisabled
})
// Result: "base-class active-class" (if isActive is true)
```

### Conflicting Tailwind Classes
```typescript
cn('px-2 py-1', 'px-4') 
// Result: "py-1 px-4"
// Later px-4 overrides earlier px-2
```

### Array of Classes
```typescript
cn(['flex items-center', 'gap-2'])
// Result: "flex items-center gap-2"
```

### Undefined/Null Handling
```typescript
cn('base-class', undefined, null, false, 'other-class')
// Result: "base-class other-class"
// Falsy values are filtered out
```

## Common Use Cases

### Component with Variants
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'lg';
  className?: string;
}

function Button({ variant = 'primary', size = 'sm', className }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded font-medium transition-colors',
        {
          'bg-blue-500 text-white hover:bg-blue-600': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'lg',
        },
        className
      )}
    >
      Click me
    </button>
  );
}
```

### Conditional Styling
```typescript
function Card({ isHighlighted, isDisabled, className }) {
  return (
    <div
      className={cn(
        'border rounded-lg p-4',
        isHighlighted && 'border-blue-500 bg-blue-50',
        isDisabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      Content
    </div>
  );
}
```

### Shadcn/ui Component Pattern
```typescript
const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-border',
        destructive: 'border-destructive'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

function Card({ variant, className, ...props }) {
  return (
    <div
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  );
}
```

## How It Works

### Step 1: clsx Processing
`clsx` handles:
- Conditional class application
- Array flattening
- Filtering falsy values
- Object to class string conversion

### Step 2: tailwind-merge Processing
`tailwind-merge` handles:
- Detecting conflicting Tailwind classes
- Keeping the last occurrence of conflicting classes
- Maintaining order of non-conflicting classes

### Example of Conflict Resolution
```typescript
cn('p-4 mt-2', 'p-6')
// clsx result: "p-4 mt-2 p-6"
// tailwind-merge result: "mt-2 p-6"
// (p-6 wins over p-4)
```

## Benefits

1. **Type Safety**: Full TypeScript support with `ClassValue` type
2. **Conflict Resolution**: Automatically resolves Tailwind class conflicts
3. **Flexibility**: Accepts multiple input formats
4. **Performance**: Optimized for common use cases
5. **Component API**: Clean component APIs with className override

## Best Practices

1. **Order Matters**: Place more specific/override classes later
2. **Base Classes First**: Start with base classes, then variants, then custom className
3. **Consistent Patterns**: Use same pattern across all components
4. **Type Hints**: Let TypeScript guide your class names

## Common Patterns

### With CVA (Class Variance Authority)
```typescript
const buttonVariants = cva('base-classes', {
  variants: { /* ... */ }
});

<button className={cn(buttonVariants({ variant }), className)} />
```

### With Conditional Props
```typescript
<div className={cn(
  'base',
  isActive && 'active',
  hasError && 'error',
  className
)} />
```

### With Responsive Classes
```typescript
cn(
  'text-sm md:text-base lg:text-lg',
  'px-2 md:px-4 lg:px-6'
)
```

## Dependencies

- `clsx`: Conditional class name utility
- `tailwind-merge`: Tailwind CSS class merger

## Related Utilities

- `cva` (class-variance-authority): For variant-based components
- Tailwind CSS: The CSS framework this utility is designed for

## Performance Considerations

- Lightweight: Minimal overhead
- Memoization: Consider memoizing in hot paths if needed
- Build-time: No runtime impact on Tailwind classes

## Troubleshooting

### Classes not applying
- Check class name spelling
- Verify Tailwind config includes the utility
- Ensure classes are in Tailwind's purge/content paths

### Unexpected class removal
- Remember tailwind-merge removes conflicting classes
- Last occurrence wins for conflicts
- Check for unintended conflicts (e.g., `p-4` and `px-4` both affect padding)

### TypeScript errors
- Ensure `@types/node` is installed
- Check TypeScript version compatibility
- Verify import path is correct

