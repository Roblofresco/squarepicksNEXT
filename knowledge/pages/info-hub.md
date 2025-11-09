# Information Page: Hub

**Route:** `/information-and-support`

**Purpose:** Central hub page providing organized navigation to all information and support resources. Serves as the entry point for users seeking help, guidelines, or policy information.

---

## Components Used

### Custom Components
- `InfoPageShell` - Wrapper with constellation canvas background
- `SectionCard` - Interactive cards for navigation

---

## APIs Called

None. This is a static navigation page.

---

## Data Flow

```
Page Load
↓
Render section headers and cards
↓
User clicks card
↓
Navigate to selected information page
```

---

## Key Features

### 1. **Two Main Sections**

**Getting Started:**
- How to Play
- Account Guide
- FAQ

**Policies & Guidelines:**
- Terms & Conditions
- Privacy Policy
- Responsible Gaming

### 2. **Section Cards**
Each card includes:
- Icon (from lucide-react)
- Title
- Description
- Link to dedicated page

---

## Sections Configuration

```typescript
const sections = [
  {
    title: 'Getting Started',
    items: [
      {
        title: 'How to Play',
        description: 'Learn the basics of playing SquarePicks',
        href: '/information-and-support/how-to-play',
        iconName: 'BookOpen'
      },
      {
        title: 'Account Guide',
        description: 'Managing your SquarePicks account',
        href: '/information-and-support/account-guide',
        iconName: 'HelpCircle'
      },
      {
        title: 'FAQ',
        description: 'Frequently asked questions',
        href: '/information-and-support/faq',
        iconName: 'Info'
      }
    ]
  },
  {
    title: 'Policies & Guidelines',
    items: [
      {
        title: 'Terms & Conditions',
        description: 'Our terms of service',
        href: '/information-and-support/terms',
        iconName: 'FileText'
      },
      {
        title: 'Privacy Policy',
        description: 'How we handle your data',
        href: '/information-and-support/privacy',
        iconName: 'ShieldCheck'
      },
      {
        title: 'Responsible Gaming',
        description: 'Gaming safely and responsibly',
        href: '/information-and-support/responsible-gaming',
        iconName: 'Scale'
      }
    ]
  }
]
```

---

## Visual Design

### Layout
- Max width: 4xl
- Centered content
- Grid layout for cards
- Responsive (2 columns on sm, 3 on lg)

### Cards
- Hover effects
- Click interactions
- Icon on left
- Description below title

### Background
- Constellation canvas (animated stars)
- Dark theme
- Gradient overlays

---

## Navigation

All links use Next.js `Link` component for client-side routing.

---

## Accessibility

- Semantic HTML structure
- Clear section headers
- Descriptive link text
- Icon labels

