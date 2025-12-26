# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WhatsAnalyze is a privacy-focused WhatsApp chat analyzer built with Nuxt 2 + Vue 2. Users upload chat exports, receive detailed statistical analysis, and can download PDF reports—all without sending data to servers (100% client-side processing). The app supports 6 languages (EN, DE, ES, FR, PT, IT), PWA deployment on GitHub Pages, and monetization through Firebase Cloud Functions + PayPal integration.

## Common Development Commands

### Building & Running
```bash
# Install dependencies (uses pnpm)
pnpm install

# Development server with hot reload (localhost:3000)
pnpm dev

# Development with Firebase functions emulator enabled
pnpm dev-with-functions

# Run Firebase functions emulator standalone (without pnpm)
firebase emulators:start --only functions

# Generate static site for production
pnpm generate

# Start production server locally
pnpm start
```

### Linting & Formatting
```bash
# Run ESLint with auto-fix
pnpm lint

# Format all files with Prettier
pnpm format
```

### Testing
```bash
# Run Jest tests (configured for .vue and .js files)
npm test

# Run tests with coverage
npm test -- --coverage
```

### Deployment
```bash
# Deploy static site to GitHub Pages (dev branch)
pnpm deploy

# Deploy Firebase Cloud Functions only
pnpm deploy-functions

# Deploy to personal site (Sebi's fork)
pnpm deploy-sebi
```

## Architecture Overview

### Component Organization
- **Pages** (`/pages`): Entry points for routes. Main page is `index.vue` which orchestrates file upload → analysis → results display.
- **Components** (`/components`): Modular, reusable Vue components organized by feature:
  - `/charts/`: Chart rendering (LineChart, BarChart, DonughtChart, RadarChart, WordCloud, EmojiCloud, etc.)
  - `/ChatVisualization/`: Reconstructed chat display
  - Root level: Global UI (FileHandler, SubscriptionChecker, Share, etc.)
- **Utils** (`/utils`): Core logic layer (transformChatData.js, pdf.ts, translations.js, etc.)
- **Layouts** (`/layouts`): Page wrapper templates (default.vue wraps all pages with header/footer)
- **Plugins** (`/plugins`): Vue plugin initialization (gtag analytics, amcharts, sentry)

### Data Flow
```
User Upload → FileHandler.vue
  → whatsapp-chat-parser (parse .txt/.zip) + JSZip handling
  → Chat instance created in index.vue from transformChatData.js
  → Chat object passed as prop to Results.vue
  → Results renders multiple chart components simultaneously
  → User can download PDF (jsPDF) or share images (html2canvas)
```

### State Management
**Important**: This project uses **component-level state, not Vuex**. State lives in Vue component `data()` properties and flows via props downward, events upward. Key state holders:
- `index.vue`: Chat data, attachments, subscription status, UI visibility
- `FileHandler.vue`: Upload state (processing, dragging, errors)
- `SubscriptionChecker.vue`: Subscription validation

### Core Utilities

**`utils/transformChatData.js`** (13KB)
- `Chat` class: Main analysis engine with methods:
  - `groupBy()`: Group messages by author
  - `hourlyDataFromChat()`: Hourly distribution for charts
  - `dailyDataFromChat()`: Daily distribution
  - `getTotalNumberOfWords()`: Word count stats
  - `createSortedFreqDict()`: Frequency analysis for word/emoji clouds
  - `match_emojys()`: Extract emoji data
  - `getMessagesPerPerson()`: Per-participant aggregation
- Also includes `removeSystemMessages()` and other data sanitization

**`utils/pdf.ts`** (13KB)
- `render()` function: Complex jsPDF document generation
- Handles chat message reconstruction, chart embedding, attachment rendering, pagination
- Uses jsPDF-autotable for table layouts

**`utils/translations.js`** (88KB)
- Large i18n dictionary covering 6 languages
- Keys match template `{{ $t('key.path') }}` usage

**`utils/attachments.ts`**
- Handles file extraction from WhatsApp zip exports (iOS format)

**`utils/colors.js`**
- `chatColors` object: Predefined color palette for message participants

**`utils/gtagValues.js`**
- Constants for Google Analytics event tracking

### Build Configuration

**Key Nuxt Config Settings** (`nuxt.config.js`):
- `target: "static"` + `ssr: false`: Client-side static generation for GitHub Pages
- **Modules**: @nuxtjs/pwa, @nuxtjs/firebase, @nuxtjs/gtm, nuxt-i18n, @nuxtjs/vuetify, @nuxt/content, nuxt-compress
- **i18n**: 6 locales (en, de, es, fr, pt, it), default "en", browser detection enabled
- **PWA**: Manifest includes share_target pointing to `/pwa-results?share-target=1` for Web Share API
- **Firebase**: Firestore enabled (not heavily used in frontend); Cloud Functions with PayPal
- **Plugins**: gtag.js (auto-loaded), amcharts.js (client-only), sentry, dataframe
- **Environment**: `NUXT_ENV_LOCAL` enables dev features, `NUXT_ENV_WITH_FUNCTIONS` runs Firebase emulator

**Build Tools**:
- Babel (with private property support)
- ESLint (with Vue plugin, extends prettier)
- Prettier (minimal config in .prettierrc.json)
- Jest (transforms .vue files with vue-jest, .js with babel-jest)
- Husky + lint-staged: Pre-commit hooks run prettier + eslint --fix

**Build Output**:
- Static files generated to `/dist`
- Compressed with GZIP + Brotli (nuxt-compress)
- Source maps hidden in production
- Includes custom service worker (custom-sw.js)

## Key Files & Patterns

| File | Purpose |
|------|---------|
| `pages/index.vue` | Primary analyzer—orchestrates upload, analysis, results display |
| `utils/transformChatData.js` | Chat parsing & analysis engine |
| `utils/pdf.ts` | PDF generation logic |
| `components/FileHandler.vue` | File upload UI (drag-drop) |
| `components/charts/Results.vue` | Results container rendering all charts |
| `utils/translations.js` | i18n translation strings (all languages) |
| `nuxt.config.js` | Build config, module setup, PWA manifest |

## Environment Variables

- `NUXT_ENV_LOCAL=1`: Enables local dev mode (different PayPal client ID, logging)
- `NUXT_ENV_WITH_FUNCTIONS=1`: Starts Firebase functions emulator
- `BASE_URL`: Production domain (defaults to whatsanalyze.com)
- `SENTRY_AUTH_TOKEN`: Error tracking service authentication

## Firebase & Backend

**Cloud Functions** (`/functions`):
- Handle PayPal subscription validation
- Emulator runs locally: `firebase emulators:start --only functions`
- See `/functions/index.js` for endpoint definitions

**PayPal Integration**:
- Sandbox client ID for development
- Production client ID for live (see `nuxt.config.js` publicRuntimeConfig)
- Results stored in Firestore/localStorage

## Testing

- **Framework**: Jest with vue-jest and babel-jest
- **Coverage**: Collected from `/components` and `/pages` (see jest.config.js)
- **Path aliases**: `@/` and `~/` both map to project root
- Run tests: `npm test` (no tests currently exist—new ones should target components/pages)

## Common Patterns & Gotchas

### File Parsing
- WhatsApp exports as `.txt` for Android, `.zip` for iOS (contains multiple text files)
- `JSZip` extracts iOS zips; `whatsapp-chat-parser` parses the text format
- Watch for system messages (filtered by Chat class) and emoji encoding edge cases

### Chart Rendering
- Charts receive data as props from parent Results component
- AmCharts requires `ssr: false` in plugin (client-only)
- Chart.js also used (imported in chart components)
- html2canvas used for social sharing (converts DOM to image)

### i18n Usage
- Template: `{{ $t('key.path') }}`
- JavaScript: `this.$i18n.t('key.path')`
- Translations live in `utils/translations.js`; edit there, not in components

### No Vuex Store
- Use component `data()` for state
- Pass data via props, emit events up the tree
- Avoid lifting state too high (each component should own its own state)

### CSS & Styling
- Vuetify 1.x for Material Design components
- Import Vuetify colors: `import colors from 'vuetify/es5/util/colors'`
- SCSS support available; scoped styles are preferred

### PDF Generation
- Uses jsPDF + jsPDF-autotable
- Embeds charts as canvas images (html2canvas internally)
- Handle page breaks manually; complex layout logic in `utils/pdf.ts`

### Dependency Management
- Uses **pnpm** (faster, more efficient than npm)
- Node 16 required (Node 18+ had linter issues; Python 3.11 or lower needed)
- Dependencies locked in pnpm-lock.yaml

### Pre-commit Hooks
- Husky + lint-staged automatically:
  - Run prettier on all files
  - Run eslint --fix on .js/.vue files
  - Will block commit if linting fails
- Hooks defined in `package.json` lint-staged field

## Performance & Security

- **Privacy**: 100% client-side processing—no chat data sent to servers (major selling point)
- **Code Splitting**: Nuxt auto-splits by page
- **Compression**: GZIP + Brotli enabled
- **PWA**: Offline support, installable, Web Share API integration
- **Error Tracking**: Sentry integration for production errors
- **Analytics**: Google Analytics (gtag) + GTM for user behavior

## Internationalization (i18n)

- 6 supported languages: English, German, Spanish, French, Portuguese, Italian
- Configured in nuxt.config.js with auto browser detection
- All translation strings in `utils/translations.js`
- Add new strings there; components use `{{ $t('path.to.key') }}`

## Deployment

- **Production**: Static site deployed to GitHub Pages (`dev` branch via `pnpm deploy`)
- **Development**: Hosted at https://whatsanalyze-80665.web.app (Firebase Hosting)
- **Personal fork**: Deployed to https://fellnerse.github.io (via `pnpm deploy-sebi`)
- **GitHub Actions**: May be configured for CI/CD (check `.github/workflows/`)

## Useful Resources

- [Nuxt 2 Docs](https://nuxtjs.org)
- [Vue 2 Docs](https://v2.vuejs.org)
- [Vuetify 1.x Docs](https://v1.vuetifyjs.com)
- [whatsapp-chat-parser](https://github.com/alaabadran/whatsapp-chat-parser)
- [jsPDF Docs](https://github.com/parallax/jsPDF)
- Firebase Cloud Functions & Firestore (see `/functions` folder)
