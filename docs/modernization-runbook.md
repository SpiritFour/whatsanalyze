# Modernization and operations runbook

This document describes the state established by the 2026 modernization work,
why the current architecture looks the way it does, and how to continue without
rediscovering the same migration issues.

## Modernization sequence

The work was deliberately split into reviewable stages:

1. [PR #378](https://github.com/SpiritFour/whatsanalyze/pull/378) established
   pnpm and a stable CI baseline.
2. [PR #380](https://github.com/SpiritFour/whatsanalyze/pull/380) moved the
   frontend to Node 22 and the final Nuxt 2 release.
3. [PR #381](https://github.com/SpiritFour/whatsanalyze/pull/381) migrates the
   frontend to Nuxt 4, Vue 3, and Vuetify 3.

The Nuxt 4 migration keeps `srcDir: "."`. Moving all application files into a
new directory at the same time would make the framework migration harder to
review without improving runtime behavior.

## Supported toolchain

- Node.js 22
- pnpm 8.15.8 for the root frontend project
- Python 3.11 for native legacy dependencies
- Firebase CLI from Nix
- Node.js 22 and npm for the independent `functions` package

Use the Nix shell as the source of truth:

```bash
direnv allow # once per worktree, if direnv is installed

# Either enter the shell:
nix develop
pnpm install --frozen-lockfile

# Or run one command in it:
nix develop --command pnpm install --frozen-lockfile
```

`flake.nix` provides a `pnpm` command that uses Corepack internally to pin pnpm
8.15.8. Callers should run `pnpm`, not invoke Corepack themselves. Commands run
outside the Nix shell may accidentally use another Node version. A
`better-sqlite3` ABI error almost always means dependencies were built with a
different Node version; repair it inside Nix:

```bash
nix develop --command pnpm rebuild better-sqlite3
```

The Firebase Functions package is separate from the frontend package. Its npm
lockfile is intentionally committed at `functions/package-lock.json`; the root
application continues to use only `pnpm-lock.yaml`.

## Frontend architecture

### Nuxt and static output

- Nuxt 4 runs as a client-side application with `ssr: false`.
- Nitro uses the static preset and writes the deployable site to `dist`.
- All supported localized routes are explicitly prerendered. A normal build
  currently produces 58 routes.
- Static assets remain in `static` through Nuxt's `dir.public` setting.
- Development uses the repository's local HTTPS certificate.

Relevant configuration is centralized in `nuxt.config.js`.

### Vue and Vuetify

The application still mostly uses the Vue Options API. Vue 3 supports that API,
so components should be converted to Composition API only when a change
benefits from it; a wholesale syntax rewrite is not required.

Important Vuetify 3 differences encountered during migration:

- Use `$vuetify.display`, not `$vuetify.breakpoint`.
- Use native scrolling helpers instead of Vuetify 2's `$vuetify.goTo`.
- Dialog activators receive `{ props }`; bind those props to the activator.
  The old `{ on, attrs }` pattern renders but does not open the dialog.
- Tabs use window items instead of `v-tabs-items` and `v-tab-item`.
- Expansion panels use the Vuetify 3 title/text components.
- Do not use Vue 2's `.native` event modifier.

### Localization

Localization is provided by `@nuxtjs/i18n`.

- Locale metadata belongs in the `i18n.locales` array in `nuxt.config.js`.
- Translation messages and Vuetify locale messages are combined in
  `i18n/i18n.config.js`.
- Use `useI18n()` and `useSwitchLocalePath()` for switching languages.
- Do not recreate route prefixes manually or call the removed Nuxt 2
  `switchLocalePath` component-instance method.
- The default locale is English and uses no URL prefix. Other locales use
  `/de/`, `/es/`, `/fr/`, `/pt/`, and `/it/`.

### Content, PWA, analytics, and error reporting

- Nuxt Content v3 uses `queryCollection` and `ContentRenderer`.
- PWA support comes from `@vite-pwa/nuxt`. The development service worker is
  disabled because it caused stale assets and browser-test navigation races.
- Analytics scripts are configured through Nuxt Scripts. Application events
  are pushed to `dataLayer` by `utils/gtagValues.js`.
- Sentry uses `@sentry/nuxt`. Local builds without an auth token warn that no
  release or source maps will be uploaded; this is expected.

### Firebase client

`plugins/firebase.client.js` initializes the modular Firebase SDK and exposes a
small `$firebase` compatibility interface:

- `callFunction(name, data)`
- `sendFeedback(data)`
- `serverTimestamp()`

The production project is `whatsanalyze-80665`. Callable requests currently
target the default `us-central1` Functions region.

The backend endpoints are implemented with `onRequest`, while the frontend uses
Firebase's `httpsCallable` client. This works because the endpoints accept and
return the callable `{ data: ... }` envelope, but it is unconventional. A future
backend cleanup should choose one coherent model:

1. Convert the functions to `onCall`, or
2. Keep `onRequest` and use an explicit HTTP client.

Do not mix both models further.

## PDF generation

PDF generation runs in `assets/js/pdf.worker.js`, loaded through Vite's native
`?worker` import.

Two Vue 3 migration details are essential:

1. Chart canvases must be found with a descendant selector such as
   `#chat-timeline canvas`. Vue Chart.js no longer preserves the exact Vue 2 DOM
   nesting.
2. Vue 3 state is wrapped in reactive proxies. Proxies cannot be sent with
   `Worker.postMessage`; `objectToDictionary` recursively converts chat and
   attachment data to cloneable plain structures while preserving dates,
   buffers, and typed arrays.

The PDF component must handle both preparation errors and worker errors,
release its loading state, and terminate completed or failed workers. A loading
indicator that never finishes usually means either a `DataCloneError` or a
worker exception; inspect the browser console before changing timeouts.

Chat parsing and PDF rendering remain local to the browser. Never send chat
contents to analytics, Firebase, or another backend.

## PayPal subscriptions

There are two separate PayPal flows:

### One-time PDF payment

`components/ChatVisualization/Payment.vue` loads the PayPal browser SDK using
the public runtime client ID. The paid-download button is a Vuetify dialog
activator; it must use Vuetify 3 activator props.

### Recurring subscription

1. `SubscribeBtn` calls the Firebase function currently named `helloworld`.
2. The function creates a PayPal subscription and returns its approval URL.
3. PayPal redirects to `/subscribe?subscription_id=...`.
4. `checksubscriberstatus` queries PayPal's subscription API by that ID.
5. Access is granted only when PayPal reports `ACTIVE`.
6. Active subscription data is cached in Firestore for later email lookup.

Firestore is not the authority for validity. Earlier code considered any
existing Firestore document valid, which delayed activation until a webhook and
could leave cancelled subscriptions active. PayPal's live status is now the
source of truth. The response includes `data.status` to distinguish
`APPROVAL_PENDING`, `ACTIVE`, `SUSPENDED`, `CANCELLED`, and `EXPIRED`.

PR previews are built with `NUXT_ENV_LOCAL=1`, so they intentionally use the
PayPal sandbox client and sandbox plan. Production builds use the production
client and plan. Sandbox buyer addresses such as
`sb-...@personal.example.com` are not real charges.

An `EXPIRED` subscription must not be treated as active. During migration a
sandbox subscription returned valid subscriber details but status `EXPIRED`;
that indicated a sandbox plan/billing-cycle issue, not stale frontend or
Firestore state.

The webhook currently handles `PAYMENT.SALE.COMPLETED`, stores subscription
details, and sends the subscription email. Webhook delivery remains useful for
email indexing, but the return flow does not depend on it for activation.

## Firebase Functions deployment

Authenticate and deploy through Nix:

```bash
nix develop --command firebase login
nix develop --command firebase deploy --only functions:checksubscriberstatus
```

The repository declares Node 22 for Functions because Firebase stopped
accepting Node 18 deployments on October 30, 2025. During PR #381 only
`checksubscriberstatus` was deployed on Node 22. The existing `helloworld` and
`paypalwebhook` production revisions remained on Node 18; their next deployment
will use the committed Node 22 runtime and updated SDKs.

Deploy individual functions while validating the migration:

```bash
nix develop --command firebase deploy --only functions:helloworld
nix develop --command firebase deploy --only functions:paypalwebhook
```

Secrets are managed by Google Secret Manager and must never be committed:

- `PAYPAL_PASSWORD_DEV`
- `PAYPAL_PASSWORD_PROD`

After the Node 22 deployment, Firebase was configured to remove container
images older than one day from the `us-central1` Artifact Registry repository.

## Verification

Run the required checks inside Nix:

```bash
nix develop --command pnpm install --frozen-lockfile
nix develop --command pnpm format:check
nix develop --command pnpm lint
nix develop --command pnpm test
NUXT_TELEMETRY_DISABLED=1 nix develop --command pnpm build
nix develop --command pnpm test:generated
git diff --check
```

`test:generated` verifies representative localized pages, Nuxt's root manifest,
the Vite-built worker, and required PWA assets in `dist`.

Playwright is a local regression suite rather than a required CI check:

```bash
nix develop --command pnpm exec playwright install chromium
nix develop --command pnpm test:e2e
```

It covers desktop and mobile behavior, including:

- landing-page rendering and browser runtime errors
- local chat analysis without chat data in outgoing requests
- free PDF generation
- paid PDF dialog and PayPal SDK initialization
- subscription endpoint and approval redirect
- delayed subscription activation after the PayPal return
- localized routing and migrated Markdown content

Visual snapshots were removed because Linux and macOS font/layout rendering
differed by a pixel and made CI unreliable. Functional browser assertions are
more useful here.

The required GitHub CI job intentionally runs formatting, linting, the small
Jest utility suite, static generation, and generated-output verification. It
does not install browsers or run Playwright.

## Known follow-up work

- Rename `helloworld` to describe its purpose, with a compatibility period for
  the old endpoint.
- Deploy and verify `helloworld` and `paypalwebhook` on Node 22.
- Decide whether Firebase functions use `onCall` or ordinary HTTP.
- Verify or recreate the PayPal sandbox plan if fresh subscriptions immediately
  become `EXPIRED`.
- Expand backend tests around PayPal status mapping and webhook events before
  changing payment behavior.
- Upgrade the legacy ESLint/Jest toolchain independently; do not combine it
  with another framework migration.
- Review dependency audit findings separately. Do not use forced automated
  upgrades as part of an unrelated change.
- Consider migrating Options API components incrementally when they are already
  being changed.
