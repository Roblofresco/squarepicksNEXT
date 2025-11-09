# Information Page: Contact Support

**Route:** `/contact-support`

**Purpose:** Simple contact page providing email support information for users who need assistance.

---

## Components Used

### UI Components
- `Mail` - Email icon from lucide-react

### Custom Components
- `InfoPageShell` - Wrapper with constellation canvas background

---

## Content

### Page Elements
1. **Heading:** "Contact Support"
2. **Description:** "If you have any questions or need assistance..."
3. **Email Button:** Interactive mailto link
4. **Response Time:** "We typically respond within 24-48 business hours"

---

## Key Features

### 1. **Email Link**
- **Address:** contact@squarepicks.com
- **Type:** Mailto link
- **Icon:** Mail icon from lucide-react
- **Styling:** Primary accent button

### 2. **Response Time Notice**
- 24-48 business hours
- Displayed below email button
- Gray text for secondary info

### 3. **Clean Design**
- Centered content
- Text shadow on heading
- Simple and direct
- No forms or complex interactions

---

## Visual Design

### Layout
- Centered content
- Max width: 4xl
- Font: sans-serif

### Heading
- Text: 4xl
- Font weight: semibold
- Color: white
- Margin bottom: 8 units
- Text shadow glow effect

### Description
- Text: lg
- Color: gray-300
- Leading: relaxed
- Margin bottom: 6 units

### Email Button
- Inline flex with items centered
- Padding: 6 horizontal, 3 vertical
- Border: transparent
- Font: base, medium
- Rounded: md
- Background: accent-1
- Hover: accent-1/90
- Transition: colors, 200ms
- Icon + text layout

### Response Time
- Text: md
- Color: gray-400
- Leading: relaxed
- Margin top: 8 units
- Margin bottom: 6 units

---

## Interaction

### Email Button Click
```
User clicks button
↓
Opens default email client
↓
Pre-populated with:
  To: contact@squarepicks.com
  Subject: (empty)
  Body: (empty)
```

---

## Navigation

### Back Button
- Provided by InfoPageShell
- Returns to previous page (typically info hub)

### Shell Config
- `canvasId`: "contact-support-constellation-canvas"
- `showBackButton`: false

---

## Accessibility

- Semantic HTML
- Descriptive link text
- Icon with label
- Clear call-to-action
- Keyboard accessible

---

## Content Type

Static page with single interactive element (mailto link).

---

## Target Audience

Users who:
- Need help or assistance
- Have questions
- Encountered issues
- Want to contact the team
- Need customer support

---

## Support Process

1. User clicks email button
2. Email client opens
3. User composes message
4. Sends to contact@squarepicks.com
5. Company responds within 24-48 hours

---

## Alternative Contact Methods

Not provided on this page. Email is the sole contact method displayed.

---

## Response Time Promise

- Typical: 24-48 business hours
- Note: "business hours" implies weekends may take longer
- Sets clear expectation for users

---

## Design Philosophy

- Simplicity over complexity
- Direct communication
- No form submission
- No validation needed
- Leverages native email clients
- Reduces friction

