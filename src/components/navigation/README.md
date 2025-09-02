# Navigation System

This directory contains a comprehensive navigation system for SquarePicks that follows Next.js and React best practices.

## Components

### Navigation
A flexible navigation component with two variants:
- `home`: For the homepage with login/signup buttons
- `app`: For authenticated app pages with mobile menu support

**Features:**
- Responsive design with mobile hamburger menu
- Active state management
- Accessibility support (ARIA labels, keyboard navigation)
- Smooth animations with Framer Motion

**Usage:**
```tsx
import { Navigation } from '@/components/navigation';

// Homepage navigation
<Navigation variant="home" />

// App navigation
<Navigation variant="app" />
```

### ActionButton
A versatile button component for call-to-action elements with built-in navigation support.

**Features:**
- Multiple variants: `primary`, `secondary`, `outline`
- Multiple sizes: `sm`, `md`, `lg`
- Built-in loading states and navigation handling
- Automatic fallback for cross-browser compatibility
- Support for internal routes, external links, and scroll-to-element

**Usage:**
```tsx
import { ActionButton } from '@/components/navigation';

// Internal navigation
<ActionButton href="/signup" variant="primary" size="lg">
  Get Started
</ActionButton>

// Scroll to element
<ActionButton href="#how-to-play" variant="outline">
  How It Works
</ActionButton>

// Custom click handler
<ActionButton onClick={handleSubmit} variant="primary">
  Submit
</ActionButton>
```

### Breadcrumbs
Navigation breadcrumbs for complex page hierarchies.

## Best Practices

### 1. Navigation Patterns

**Use Next.js Link for internal navigation:**
```tsx
import Link from 'next/link';

<Link href="/dashboard">Dashboard</Link>
```

**Use ActionButton for complex interactions:**
```tsx
<ActionButton href="/signup" variant="primary">
  Sign Up
</ActionButton>
```

**Use useRouter for programmatic navigation:**
```tsx
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/dashboard');
```

### 2. Accessibility

- Always provide `aria-label` for buttons
- Use semantic HTML elements (`nav`, `button`)
- Support keyboard navigation
- Include loading states with `aria-busy`

### 3. Performance

- Leverage Next.js automatic prefetching
- Use `prefetch={false}` for rarely visited routes
- Implement loading boundaries for dynamic routes

### 4. Cross-Browser Compatibility

- Provide fallbacks for Edge browser
- Test navigation in multiple browsers
- Use progressive enhancement

### 5. Error Handling

- Implement proper error boundaries
- Provide fallback navigation methods
- Log navigation errors for debugging

## Implementation Details

### Navigation State Management
- Uses React hooks for local state
- Implements proper cleanup in useEffect
- Handles loading and error states

### Animation System
- Framer Motion for smooth transitions
- Consistent animation patterns
- Performance-optimized animations

### Mobile Responsiveness
- Mobile-first design approach
- Touch-friendly interactions
- Collapsible navigation menus

## File Structure

```
src/components/navigation/
├── index.ts              # Export all components
├── Navigation.tsx        # Main navigation component
├── ActionButton.tsx      # CTA button component
├── Breadcrumbs.tsx       # Breadcrumb navigation
└── README.md            # This documentation
```

## Testing

Test navigation components across:
- Different browsers (Chrome, Firefox, Safari, Edge)
- Mobile and desktop devices
- Various screen sizes
- Accessibility tools (screen readers, keyboard navigation)

## Future Enhancements

- Add navigation analytics tracking
- Implement breadcrumb generation from route structure
- Add support for nested navigation menus
- Implement navigation history management
- Add support for deep linking


