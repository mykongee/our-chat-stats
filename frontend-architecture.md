# Frontend Architecture

This document records architectural decisions, design choices, and technical deliberations for the Our Chat Stats project.

---

## CSS Theming System

### Decision: CSS-in-CSS with Data Attributes

**Date:** 2025-10-16

### Summary

1. CSS imports in JS modules are globally loaded - When Vite processes import './design-system/themes/love-letter.css' in main.js, it includes that CSS in the bundle and loads it into the document's stylesheet
2. CSS custom properties inherit - The love-letter.css file defines variables under [data-theme="love-letter"] selector. Since <html data-theme="love-letter"> matches this selector, all those CSS variables are set on the root element
3. Descendants can access them - Any element in the DOM tree can use var(--color-border) and it will resolve to the value defined in the theme CSS file because CSS custom properties cascade down the DOM tree
4. The component uses those variables - The FileUpload component has styles like border: 2px dashed var(--color-border), which will automatically resolve to #FFE4E9 (the value from love-letter.css)

### Architecture

Themes are defined as pure CSS files using CSS custom properties (CSS variables). Theme switching is accomplished via a `data-theme` attribute on the `<html>` element.

### How It Works

1. **Theme Definition**: Each theme is a separate CSS file (e.g., `love-letter.css`) that defines CSS custom properties scoped to a `[data-theme="theme-id"]` selector

```css
[data-theme="love-letter"] {
  --color-primary: #FFB6C1;
  --color-border: #FFE4E9;
  /* ... more tokens */
}
```

2. **CSS Import**: Theme CSS files are imported in `main.js` as ES modules
```js
import './design-system/themes/love-letter.css'
```

3. **Global Availability**: Vite processes the import and includes the CSS in the bundle, making it globally available in the document stylesheet

4. **Theme Activation**: Set `data-theme` attribute on the HTML element
```html
<html data-theme="love-letter">
```

5. **Component Usage**: Components reference CSS variables using `var()` function
```css
.upload-zone {
  border: 2px dashed var(--color-border);
}
```

6. **Cascading Resolution**: Because `<html data-theme="love-letter">` matches the `[data-theme="love-letter"]` selector in the CSS, all custom properties defined there are set on the root element. These cascade down the DOM tree, making them accessible to all descendant elements.

### Why This Approach

**Benefits:**
- **Simple**: No JavaScript overhead for theming logic
- **Performant**: Native CSS, no runtime processing
- **Maintainable**: Plain CSS files anyone can edit
- **Standard**: Uses web platform features (CSS custom properties, attribute selectors)
- **Developer Experience**: Adding a theme = create one CSS file

**Trade-offs:**
- All theme CSS is loaded upfront (acceptable for 3-5 themes)
- No runtime theme generation (not needed for our use case)
- Requires understanding of CSS custom property inheritance (standard knowledge)

### File Structure

```
src/design-system/
├── themes/
│   ├── love-letter.css
│   ├── minimal.css
│   └── dark.css
└── themes.js              # Theme metadata (names, descriptions)
```

### Adding New Themes

1. Create new CSS file in `src/design-system/themes/`
2. Define all required custom properties under `[data-theme="new-theme-id"]`
3. Import in `main.js`
4. Add metadata to `themes.js`

That's it. No build configuration, no complex tooling.

---

## Testing Environment

### Decision: Happy-DOM over JSDOM

**Date:** 2025-10-16

### Rationale

We use Happy-DOM as our test environment for Vue component testing with Vitest.

**Why Happy-DOM:**

1. **Performance**: Happy-DOM is significantly faster than JSDOM. Test suite execution time matters for developer feedback loops.

2. **Lightweight**: Smaller footprint (~4MB vs JSDOM's ~20MB). Faster installation, less disk space, quicker CI runs.

3. **Modern**: Built specifically for modern web APIs. Better support for newer DOM features without legacy baggage.

4. **Vite/Vitest Integration**: First-class support in Vitest. Zero configuration needed - just `environment: 'happy-dom'` in config.

5. **Sufficient for Our Needs**: We're testing Vue component logic, user interactions, and DOM manipulation. We don't need a full browser engine or complex browser APIs like WebGL, Service Workers, or complex layout calculations.

**What We're NOT Testing:**
- Visual rendering (no screenshot tests)
- Browser-specific quirks (we target modern browsers)
- Complex browser APIs beyond basic DOM manipulation
- Performance in real browsers

**When We'd Need JSDOM:**
- If we needed more complete browser API coverage
- If we were testing complex browser-specific behaviors
- If Happy-DOM lacked support for APIs we depend on

**When We'd Need Real Browsers (Playwright/Cypress):**
- E2E testing critical user flows
- Visual regression testing
- Testing browser-specific rendering bugs
- Performance testing under real conditions

### Configuration

```js
// vite.config.js
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
  },
})
```

### Testing Philosophy

We test:
- ✅ Component logic and behavior
- ✅ User interactions (clicks, uploads, drag-and-drop)
- ✅ Security validations (file type, size checks)
- ✅ Accessibility (ARIA attributes, semantic HTML)
- ✅ Edge cases in data processing

We don't test:
- ❌ Framework internals
- ❌ Trivial implementations
- ❌ Visual styling (that's what design tokens are for)
- ❌ Third-party library internals

---

## User Configuration vs Hardcoded Values

### Decision: User-Controlled Emoji Filtering

**Date:** 2025-10-16

### The Problem

Some emojis appear in usernames (e.g., "Mike 🌹") and shouldn't count toward emoji statistics. Initially, we could hardcode these:

```javascript
// ❌ BAD: Hardcoded filtering
function extractEmojis(text) {
  const emojis = text.match(emojiRegex) || []
  return emojis.filter(emoji => emoji !== '🌹') // Hardcoded!
}
```

**Problems with this approach:**
- Only works for this specific case
- User has no control
- Requires code changes for different usernames
- Developer assumes what should be filtered

### The Solution: User-Controlled Configuration

Let users decide which emojis to ignore via a simple input field.

**Benefits:**
- Works for any username emoji
- User has full control
- No code changes needed for different cases
- Respects user intent over developer assumptions

### Implementation Architecture

**1. State Management**
```javascript
const ignoredEmojis = ref(new Set()) // Reactive set of emojis to ignore
```

**2. User Interface**
- Small, cute input box in "Emoji Usage Comparison" section
- User types emojis to ignore (e.g., "🌹❤️")
- Emojis are extracted from input and added to ignore set
- Changes trigger immediate recalculation

**3. Filtering Logic**
```javascript
function extractEmojis(text, ignoreSet = new Set()) {
  const emojis = text.match(emojiRegex) || []
  return emojis.filter(emoji => !ignoreSet.has(emoji))
}
```

**4. Reactive Recalculation**
- When `ignoredEmojis` changes
- Refilter all message emojis
- Recalculate statistics
- UI updates automatically (Vue reactivity)

### Why This Pattern Matters

**User Configuration > Developer Hardcoding**

Whenever you're tempted to hardcode a value, ask:
- "Will this be different for other users?"
- "Should users control this?"
- "Am I making assumptions about user intent?"

If yes to any, make it configurable.

**Examples in this project:**
- ✅ Emoji filtering - User controlled
- ✅ Theme selection - User controlled
- ✅ File upload - User controlled
- ❌ CSS token values - Developer controlled (appropriate)
- ❌ Parser selectors - Developer controlled (appropriate)

### The Golden Rule

**Make behavior configurable when it relates to user data or preferences.**
**Make implementation details fixed when they're about "how" not "what".**

---

## Future Sections

- Component Architecture
- State Management Strategy
- Data Processing Pipeline
- Performance Optimizations
