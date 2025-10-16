# Our Chat Stats - Development Guide

## Project Overview
A web application that analyzes Instagram chat history to reveal communication patterns, emoji usage, and relationship dynamics. Features a customizable theme system with a romantic, delicate design as the default aesthetic.

## Technical Stack
- **Frontend Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Architecture**: Single File Components (SFC)
- **Styling**: CSS Custom Properties (Design Tokens)

## Core Features
1. Instagram chat history file upload
2. Communication habit analysis
3. Emoji usage statistics
4. Comparative communication insights between users
5. Visual data presentation
6. **User-selectable themes with extensible design system**

---

## 🎯 DEVELOPER EXPERIENCE (DX) PHILOSOPHY

**READ THIS FIRST - THIS IS THE MOST IMPORTANT SECTION**

### What is Developer Experience?

**Developer Experience is the sum of friction points between a developer's intent and its implementation.**

Good DX means:
- **Cognitive ease**: Understanding code doesn't require mental gymnastics
- **Predictability**: The system behaves as expected without surprises
- **Discoverability**: Solutions are obvious; patterns emerge naturally
- **Feedback speed**: Changes are visible immediately; errors are caught early
- **Confidence**: Making changes doesn't feel like defusing a bomb
- **Leverage**: Simple changes yield powerful results
- **Debugging clarity**: When things break, it's obvious why and where

### The Core Principle

> **Good DX enables complex features. It doesn't constrain them.**

We are building a balance between **high feature complexity** and **high quality developer experience**.

- Users see sophisticated features
- Developers see maintainable code
- **Both can and should coexist**

### CRITICAL: Understanding the Relationship

**Good DX is the FOUNDATION that EMPOWERS us to build complex features easily.**

It is NOT a reason to avoid building complex features.

### Real Examples from This Project

✅ **DO THIS:**
- Theme switching → Clean CSS foundation makes it trivial to add new themes
- Real-time emoji counter → Pure composable makes it easy to test and extend
- Complex chat parser → Clear structure means adding Instagram/WhatsApp/Telegram is straightforward
- Feature-rich analysis → Well-architected foundation means complex features feel effortless to implement

❌ **DON'T DO THIS:**
- Abstraction for abstraction's sake → Makes simple things hard (destroys DX)
- Over-engineering simple features → Adds cognitive overhead without benefit
- Complex build pipelines for basic tasks → Increases friction unnecessarily
- Tightly coupled code → Makes everything harder to change

### What Good DX Looks Like in Practice

**Adding a new theme should be:**
- Create one CSS file with design tokens
- Done

**NOT:**
- Modify 5 files
- Understand complex build pipeline
- Update type definitions
- Register in 3 different places

**Adding new emoji analysis should be:**
- Write one pure function
- Test it
- Use it in a composable
- Done

**NOT:**
- Untangle tightly coupled code
- Modify multiple stores
- Break existing features
- Debug mysterious side effects

### The Golden Rule

**Use the simplest tool that solves the problem completely.**

- Plain CSS > CSS-in-JS (for our use case)
- Pure functions > Complex class hierarchies
- Direct file uploads > Server-side processing
- Composables > Mixin soup
- Pinia stores > Manual state management

### For Future Developers

When you're about to add a feature, ask:
1. "Does this foundation make my feature easy to build?" (If no, improve the foundation)
2. "Will the next similar feature be even easier?" (If no, you're not building the right abstraction)
3. "Can someone unfamiliar with this codebase understand my change?" (If no, simplify)

**Remember:** Complexity in features is good. Complexity in implementation is debt.

---

## Design System Architecture

### Philosophy
The design system uses **design tokens** to ensure themes are:
- **Customizable**: Easy to create new themes
- **Extensible**: Simple to add new token types
- **Accessible**: Clear structure anyone can modify
- **Maintainable**: Single source of truth

### Theme Structure

#### File Organization
```
src/
├── design-system/
│   ├── tokens/
│   │   ├── index.js           # Theme registry
│   │   ├── love-letter.js     # Default romantic theme
│   │   ├── minimal.js         # Alternative theme example
│   │   └── dark.js            # Alternative theme example
│   ├── useTheme.js            # Theme composable
│   └── types.js               # Theme type definitions
```

#### Token Categories
Every theme must define these token categories:

**Colors**
- `--color-primary`: Main brand color
- `--color-secondary`: Accent color
- `--color-background`: Main background
- `--color-surface`: Card/panel backgrounds
- `--color-text-primary`: Main text
- `--color-text-secondary`: Muted text
- `--color-border`: Border colors
- `--color-success`, `--color-error`, `--color-warning`: Status colors

**Typography**
- `--font-family-primary`: Body text font
- `--font-family-heading`: Heading font
- `--font-size-xs` through `--font-size-2xl`: Size scale
- `--font-weight-normal`, `--font-weight-medium`, `--font-weight-bold`
- `--line-height-tight`, `--line-height-normal`, `--line-height-relaxed`

**Spacing**
- `--spacing-xs` through `--spacing-2xl`: Consistent spacing scale
- `--spacing-unit`: Base unit (usually 4px or 8px)

**Effects**
- `--border-radius-sm`, `--border-radius-md`, `--border-radius-lg`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`: Box shadows
- `--transition-fast`, `--transition-normal`, `--transition-slow`

**Layout**
- `--container-max-width`
- `--content-padding`

### Theme Implementation Example

#### Theme Definition (love-letter.js)
```js
export const loveLetterTheme = {
  id: 'love-letter',
  name: 'Love Letter',
  description: 'Romantic aesthetic with rose-inspired softness',
  tokens: {
    colors: {
      primary: '#FFB6C1',        // Light pink
      secondary: '#E6A8D7',      // Soft lavender
      background: '#FFF9FB',     // Off-white with pink tint
      surface: '#FFFFFF',
      surfaceAlt: '#FFF5F7',
      textPrimary: '#4A4A4A',
      textSecondary: '#8B8B8B',
      border: '#FFE4E9',
      success: '#B8E6B8',
      error: '#FFB4B4',
      warning: '#FFE4B5',
    },
    typography: {
      fontFamilyPrimary: "'Inter', -apple-system, sans-serif",
      fontFamilyHeading: "'Playfair Display', Georgia, serif",
      fontSizeXs: '0.75rem',
      fontSizeSm: '0.875rem',
      fontSizeMd: '1rem',
      fontSizeLg: '1.25rem',
      fontSizeXl: '1.5rem',
      fontSize2xl: '2rem',
      fontWeightNormal: '400',
      fontWeightMedium: '500',
      fontWeightBold: '700',
      lineHeightTight: '1.25',
      lineHeightNormal: '1.5',
      lineHeightRelaxed: '1.75',
    },
    spacing: {
      unit: '4px',
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
    effects: {
      borderRadiusSm: '8px',
      borderRadiusMd: '12px',
      borderRadiusLg: '16px',
      shadowSm: '0 2px 8px rgba(255, 182, 193, 0.15)',
      shadowMd: '0 4px 12px rgba(255, 182, 193, 0.2)',
      shadowLg: '0 8px 24px rgba(255, 182, 193, 0.25)',
      transitionFast: '150ms ease',
      transitionNormal: '250ms ease',
      transitionSlow: '350ms ease',
    },
    layout: {
      containerMaxWidth: '1200px',
      contentPadding: '2rem',
    },
  },
}
```

#### Theme Composable (useTheme.js)
```js
import { computed } from 'vue'
import { useThemeStore } from '@/stores/themeStore'

export function useTheme() {
  const themeStore = useThemeStore()

  const applyTheme = (theme) => {
    const root = document.documentElement

    // Apply color tokens
    Object.entries(theme.tokens.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${kebabCase(key)}`, value)
    })

    // Apply typography tokens
    Object.entries(theme.tokens.typography).forEach(([key, value]) => {
      root.style.setProperty(`--font-${kebabCase(key)}`, value)
    })

    // Apply spacing tokens
    Object.entries(theme.tokens.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value)
    })

    // Apply effects tokens
    Object.entries(theme.tokens.effects).forEach(([key, value]) => {
      root.style.setProperty(`--${kebabCase(key)}`, value)
    })

    // Apply layout tokens
    Object.entries(theme.tokens.layout).forEach(([key, value]) => {
      root.style.setProperty(`--${kebabCase(key)}`, value)
    })
  }

  return {
    currentTheme: computed(() => themeStore.currentTheme),
    availableThemes: computed(() => themeStore.themes),
    applyTheme,
    setTheme: themeStore.setTheme,
  }
}

function kebabCase(str) {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
}
```

#### Component Usage Example
```vue
<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/chatStore'

const chatStore = useChatStore()
const messageCount = computed(() => chatStore.messageCount)
</script>

<template>
  <div class="stat-card">
    <h2 class="stat-card__title">Messages Sent</h2>
    <p class="stat-card__value">{{ messageCount }}</p>
  </div>
</template>

<style scoped>
/* No hardcoded colors - everything references theme tokens */
.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  transition: transform var(--transition-normal);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-card__title {
  font-family: var(--font-family-heading);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.stat-card__value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
}
</style>
```

### Creating New Themes

To add a new theme:

1. Create a new file in `src/design-system/tokens/`
2. Export a theme object with all required token categories
3. Register it in `tokens/index.js`
4. Users can now select it from the theme picker

**Example - Minimal Theme:**
```js
export const minimalTheme = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean and minimal aesthetic',
  tokens: {
    colors: {
      primary: '#000000',
      secondary: '#666666',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      // ... all other required tokens
    },
    // ... other token categories
  },
}
```

## Technical Guidelines

### Vue 3 Best Practices
- Use Composition API exclusively with `<script setup>`
- Organize composables in `/src/composables/`
- Keep components focused and single-responsibility
- Use TypeScript for type safety (optional but recommended)
- Leverage `ref()`, `computed()`, `watch()` appropriately
- Extract reusable logic into composables

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── base/            # Base components (Button, Card, etc.)
│   ├── chat/            # Chat-specific components
│   └── stats/           # Statistics/visualization components
├── composables/         # Composition API logic
│   ├── useChatParser.js
│   ├── useEmojiAnalysis.js
│   └── useStats.js
├── stores/              # Pinia stores
│   ├── chatStore.js
│   ├── themeStore.js
│   └── analyticsStore.js
├── design-system/       # Theme system
│   ├── tokens/
│   ├── useTheme.js
│   └── types.js
├── views/               # Page components
├── utils/               # Helper functions
├── types/               # TypeScript types
└── assets/              # Static assets
```

### State Management with Pinia
- Keep stores focused on specific domains
- Use actions for async operations
- Leverage getters for derived state
- Keep stores flat and avoid deep nesting

### Styling Guidelines
- **Never hardcode colors, fonts, or spacing** - always use design tokens
- Use semantic class names (BEM methodology recommended)
- Keep scoped styles for component-specific styling
- Use global styles only for resets and token definitions
- Ensure sufficient color contrast for accessibility (WCAG AA minimum)

## Feature Development Process

### Before Implementing New Features
Generate 5 alternative approaches with:
1. Brief description (1-2 sentences)
2. Recommendation score (0-10)
3. Key trade-offs

Sample from the full distribution - include both high and low-scoring options.
Keep explanations concise.

**Example Format:**
```
Option 1: [Approach] - Score: 8/10
Brief rationale focusing on key trade-offs.

Option 2: [Approach] - Score: 6/10
...
```

## Testing Strategy

### What to Test
- Core business logic (chat parsing, analysis calculations)
- Composables with complex logic
- Store actions and getters
- Critical user flows
- Edge cases in data processing
- Theme switching functionality

### What NOT to Test
- Trivial getters/setters
- Framework internals
- Simple UI component rendering without logic
- Implementation details
- Design token values

### Testing Tools
- Vitest (recommended for Vite projects)
- Vue Test Utils
- Testing Library (optional)

## Development Workflow

### Initial Setup Phase
1. Initialize Vite + Vue 3 project
2. Install and configure Pinia
3. Set up project structure
4. **Implement design system foundation**
5. **Create default theme (love-letter) and 2 alternative themes**
6. Configure testing framework

### Core Development Phases

**Phase 1: Foundation**
- Design system implementation
- Theme store and composable
- Theme switcher component
- File upload component
- Basic layout structure

**Phase 2: Data Processing**
- Instagram chat parser
- Basic data store setup
- Data validation and error handling
- Simple data display

**Phase 3: Analysis Engine**
- Emoji counting logic
- Communication pattern analysis
- Comparative metrics calculation
- Data aggregation composables

**Phase 4: Visualization**
- Charts/graphs for statistics
- Beautiful data presentation components
- Interactive elements
- Responsive layouts

**Phase 5: Polish**
- Additional themes
- Animations and transitions
- Performance optimization
- Accessibility improvements
- User preferences persistence

## Key Considerations

### Instagram Chat Format
- Research Instagram's chat export format
- Handle various file formats (.json, .txt, etc.)
- Parse timestamps, sender info, message content
- Handle media references (photos, videos, voice notes)

### Privacy & Security
- All processing happens client-side
- No data sent to external servers
- Clear privacy messaging to users
- Consider localStorage for theme/session persistence
- Add option to clear all data

### Performance
- Handle large chat histories efficiently
- Lazy load visualizations
- Optimize parsing algorithms
- Consider Web Workers for heavy processing
- Theme switching should be instant (no re-renders)

### Accessibility
- Ensure all themes meet WCAG AA contrast requirements
- Keyboard navigation support
- Screen reader friendly
- Focus indicators using theme colors
- Semantic HTML

## Coding Standards
- Consistent naming conventions (camelCase for JS, kebab-case for components)
- Comprehensive comments for complex logic
- ESLint + Prettier for code formatting
- Meaningful commit messages
- Keep functions small and focused
- **Always use design tokens, never hardcode styles**

## Theme Ideas (Future)
- Love Letter (default - romantic, soft)
- Minimal (clean, monochrome)
- Dark (dark mode)
- Pastel Dream (soft pastels)
- Cyber (high contrast, neon)
- Nature (earthy tones)
- Ocean (blue/teal palette)
- Sunset (warm gradients)

## Future Enhancements
- Support for other platforms (WhatsApp, Telegram)
- Export reports as images/PDFs
- Time-based trend analysis
- Sentiment analysis
- Conversation highlights/memories
- Shareable statistics cards
- Custom theme builder (let users create their own)
- Community theme sharing

## Quick Reference

### Adding a New Theme Checklist
1. Create `src/design-system/tokens/your-theme.js`
2. Define all required token categories
3. Import and register in `tokens/index.js`
4. Test with various components
5. Check accessibility (contrast ratios)
6. Add to theme picker UI

### Design Token Naming Convention
- Use kebab-case for CSS variables: `--color-primary`
- Use camelCase for JS objects: `colors.primary`
- Be descriptive: `--color-text-primary` not `--text-color1`
- Use semantic names: `--color-success` not `--color-green`

## Notes for Claude
- Always reference this guide before starting new features
- Maintain consistency with the design system architecture
- Never hardcode colors, spacing, or typography
- Prioritize theme flexibility in all UI work
- Keep code clean, modern, and maintainable
- Test rigorously but pragmatically
- When creating components, always use design tokens
- Ensure all themes work well with new features
