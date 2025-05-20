# SquarePicks LLC - Brand Guidelines (Internal Use)

**Purpose:** To define the visual and verbal identity of SquarePicks, ensuring consistency across all internal and external communications, marketing materials, and the application interface.

**Last Updated:** 4/10/2025

---

## 1. Logo

*   **Primary Logo:**
    *   [Insert Image/Link to Primary Logo File(s) - SVG, PNG]
    *   **Usage:** Use the primary logo on website headers, major marketing materials, official documents.
    *   **Clear Space:** Maintain a minimum clear space around the logo equal to [Specify Measurement, e.g., the height of the 'S' in SquarePicks]. Do not crowd the logo.
    *   **Minimum Size:** Do not scale the logo below [Specify Minimum Width/Height, e.g., 24px height] to ensure legibility.
*   **App Icon:**
    *   [Insert Image/Link to App Icon File(s) - Required Sizes]
    *   **Usage:** Use exclusively as the application icon on device home screens and in app stores.
*   **Incorrect Usage:**
    *   Do not stretch or distort the logo.
    *   Do not change the logo colors.
    *   Do not add effects (shadows, glows) to the logo.
    *   Do not place the logo on visually cluttered backgrounds without proper contrast.

---

## 2. Color Palette

*   **Themeable Colors (Backgrounds & Text):**
    *   **Dark Mode (Default):**
        *   `background-primary`: `#0a0e1b`
        *   `background-secondary`: `#1f2937`
        *   `text-primary`: `#eeeeee`
        *   `text-secondary`: `#64748b`
    *   **Light Mode:** (Currently uses the same values as Dark Mode via CSS variables, but can be customized)
    *   These colors are typically applied using CSS variables (`--color-...`) defined in `src/app/globals.css` and linked in `tailwind.config.js` to support potential theme switching.
*   **Accent Colors:**
    *   `accent-1` (Light Blue): `#1bb0f2`
    *   `accent-2` (Purple): `#5855e4`
    *   `accent-3` (Pink): `#d43dae`
    *   `accent-4` (Dark Blue): `#5c5ddb`
    *   **Usage:** Used for highlights, calls-to-action, gradients, and decorative elements.
*   **Gradients:**
    *   `gradient-accent1-accent4`: Linear gradient from `accent-1` (#1bb0f2) to `accent-4` (#5c5ddb).
    *   `gradient-accent2-accent3`: Linear gradient from `accent-2` (#5855e4) to `accent-3` (#d43dae).
*   **Usage Notes:** Ensure sufficient color contrast for accessibility (WCAG AA minimum). Dark mode support is built-in via CSS variables.

---

## 3. Typography

*   **Primary Font Family:**
    *   `Epilogue`
    *   **Source/Link:** Google Fonts (https://fonts.google.com/specimen/Epilogue)
    *   **Usage:** Used for both headings and body text throughout the application.
*   **Font Weights:** Use [Specify available weights loaded via CSS, e.g., Regular 400, Medium 500, Semibold 600, Bold 700] consistently for appropriate hierarchy.
*   **Fallback Font:** `sans-serif` (as defined in Tailwind config).
*   **Sizing:** Establish a consistent type scale for different elements (e.g., H1: 32px, H2: 24px, Body: 16px). Document in UI Kit/Design System or Tailwind theme extensions.

---

## 4. Tagline

*   **Primary Tagline:** `Square Up.`
*   **Usage:**
    *   Use prominently in marketing headlines, website footers, app loading screens (optional).
    *   Always include the period (`.`).
    *   Can stand alone or follow the brand name (e.g., "SquarePicks: Square Up.").
    *   Use sentence case or title case depending on context, but maintain the single word "Up".

---

## 5. Tone of Voice

*   **Overall:** Confident, Straightforward, Engaging, Trustworthy, Simple.
*   **Key Attributes:**
    *   **Confident:** We know our game and provide a solid platform.
    *   **Straightforward:** We explain rules and processes clearly and directly. No confusing jargon.
    *   **Engaging:** We want users to feel part of the excitement. Use active voice.
    *   **Trustworthy:** We are transparent and fair. Emphasize security and compliance where appropriate.
    *   **Simple:** Easy to understand, especially for users of all ages (21+) and tech-savviness.
*   **Things to Avoid:**
    *   Overly technical language.
    *   Exaggerated hype or unrealistic promises.
    *   Casual slang that might exclude or confuse.
    *   Negative or blaming language.
    *   Referring to sweepstakes as "betting" or "gambling" (use "entry fee," "play," "prize").

---

## 6. Imagery & Graphics

*   **Style:** [Describe style, e.g., Clean vector illustrations, High-quality sports photography (generic), Abstract geometric patterns].
*   **Usage:** Ensure images are relevant, high-quality, and align with the brand's confident and straightforward tone. Avoid generic stock photos where possible.
*   **Permissions:** Only use images and graphics for which SquarePicks has the appropriate licenses.

---

**Contact:** For questions or access to brand assets, contact [Name/Role, e.g., Marketing Manager, Designer]. 