# Wrapped Firebase migration runbook

WhatsApp Wrapped was built as a standalone product in its own repository
(`SpiritFour/whatsanalyze-wrapped`) against its own pair of Firebase projects.
The frontend has since been folded into this repository under `*/wrapped/`
namespaces, but the backend still lives elsewhere: the browser talks to a second
Firebase app, and the Stripe functions deploy to a different project than the
rest of the site.

This document describes what is still separate, what it takes to consolidate it
into `whatsanalyze-80665`, and the order that keeps paying customers working
throughout.

## Current state

Three Firebase projects are in play:

| Project | Role | Firestore location |
| --- | --- | --- |
| `whatsanalyze-80665` | main site, PayPal functions | `eur3` |
| `whatsanalyze-wrapped-prod` | wrapped production | `eur3` |
| `whatsanalyze-wrapped` | wrapped development | `europe-west3` |

The frontend initializes both the main and the wrapped Firebase app
(`plugins/firebase.client.js`) and exposes the second one as `$wrappedFirestore`
and `$wrappedFunctions`. The wrapped config is hard-coded per environment in
`nuxt.config.js`.

### What lives in the wrapped production project

Firestore collections:

| Collection | Written by | Purpose |
| --- | --- | --- |
| `data` | the browser, `utils/wrapped/sharing/firestore.ts` | encrypted share payloads; this is what public share links resolve against |
| `subscriptions` | `functions-wrapped/src/stripe/webhook.ts`, keyed by Stripe customer id | local mirror read by `verifySubscription` and `createCustomerPortal` |
| `mail` | `functions-wrapped/src/mail.ts` | Trigger Email queue |
| `mailTemplates` | `functions-wrapped/scripts/initializeTemplates.ts` | a single `subscription-confirmation` document |

There are no composite indexes and no field overrides in either project, no Auth
users, and no Cloud Storage usage beyond what the extension needs.

Seven functions are deployed in `us-central1`: `stripeWebhook`,
`createCheckoutSession`, `getCheckoutSession`, `createCustomerPortal`,
`verifySubscription`, and the `hello` / `helloHttp` scaffolding that the Firebase
template generated.

One extension is installed, `firebase/firestore-send-email@0.2.4`, and three
secrets exist: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
`firestore-send-email-SMTP_PASSWORD`.

Outside Firebase there is a Google Analytics property (`G-XJDRX60BNX`), a dev
Hosting site at `whatsanalyze-wrapped.web.app`, and a live Stripe webhook
endpoint addressed at the wrapped project's function URL.

## What makes this cheaper than it looks

Four properties of the current setup remove most of the usual migration risk.

**Both production databases are in `eur3`.** Firestore location is immutable per
project, so a location mismatch would have forced a read-and-rewrite migration.
Since they match, a managed export/import through a `eur3` bucket is enough. The
dev project sits in `europe-west3`, but its data is disposable.

**The main project already runs the same mail extension with the same
configuration.** `MAIL_COLLECTION=mail`, `TEMPLATES_COLLECTION=mailTemplates`,
and the same SMTP sender are already configured on `whatsanalyze-80665`. The
whole mail migration is therefore copying one template document — the queue
format the wrapped functions write is already understood on the other side.

**There are no collection name collisions.** PayPal writes to
`subscriptions-${env}` (`functions/backendClientRegistry.js`), while wrapped
writes to plain `subscriptions`. The two can coexist in one database untouched.

**App Check is dead code.** `functions-wrapped/src/appCheck.ts` and
`appCheckHttp.ts` export verification helpers that nothing calls, and the client
never calls `initializeAppCheck`. There is nothing to port; delete both files
rather than carrying them over.

## Defects to fix during the move

`functions-wrapped/src/index.ts` calls `setGlobalOptions({ maxInstances: 1 })`,
which caps every function in the codebase at a single concurrent instance —
including `stripeWebhook`. Wrapped is a year-in-review product whose traffic
peaks in December, and serialized webhook processing at peak is a real failure
mode. Raise this before next season.

The main project's mail extension is pinned at `0.1.34` on the `nodejs18`
runtime, last updated 2024-06-15, against `0.2.4` in the wrapped project. Once
wrapped's transactional mail flows through it, upgrade it.

## Migration

### Phase 0: capture what is not in git

Firestore security rules are console-only and exist in none of the three
repositories. Export the rules for both projects, commit them as
`firestore.rules`, and add a `firestore` block to `firebase.json`.

This is the one genuinely unrecoverable item, and the failure is quiet: without
the `data` collection's public create and read grants, sharing breaks on cutover
with no build-time or deploy-time error. Do it before anything else.

### Phase 1: repoint code at the main project

Fold `functions-wrapped/src/*` into the `functions` codebase, or keep the
separate `wrapped` codebase but drop the `wrapped-dev` and `wrapped-prod`
aliases so it deploys to `whatsanalyze-80665`. Drop `hello` / `helloHttp` and the
two App Check files on the way through.

On the frontend, delete the `wrappedFirebase` block from `nuxt.config.js`, and
the second `initializeApp(…, "wrapped")` call together with `$wrappedFirestore`
and `$wrappedFunctions` from `plugins/firebase.client.js`. The
`|| useNuxtApp().$firestore` fallbacks in `utils/wrapped/sharing/firestore.ts`
then collapse to a plain `$firestore`.

Rewrite the deploy scripts in `functions-wrapped/package.json` to target the
default alias, clean up `.firebaserc`, and move the values from
`.env.whatsanalyze-wrapped*` onto the main project, dropping the wrapped-only
entries from `ALLOWED_ORIGINS`.

### Phase 2: Stripe rewiring

The Stripe account itself does not change. Customers, subscriptions, prices and
the intro coupon all stay where they are. What changes is where Stripe delivers
webhooks.

1. Deploy the functions to `whatsanalyze-80665`, yielding
   `https://us-central1-whatsanalyze-80665.cloudfunctions.net/stripeWebhook`.
2. Add that as a *second* endpoint in the Stripe dashboard. It gets a new
   signing secret; set it as `STRIPE_WEBHOOK_SECRET` on the main project.
3. Copy `STRIPE_SECRET_KEY` across with `firebase functions:secrets:set`.
4. Leave both endpoints active for several days. Stripe delivers to both, so
   both `subscriptions` mirrors stay current — which is what makes the next
   phase reversible.
5. Delete the old endpoint once deliveries on the new one are confirmed.

### Phase 3: data migration

`subscriptions`, `mail` and `mailTemplates` are small, and during the
dual-webhook window `subscriptions` repairs itself. `data` is the real payload
and is written continuously by users.

```bash
gcloud firestore export gs://<eur3-bucket>/wrapped-$(date +%F) \
  --collection-ids=data,subscriptions,mailTemplates \
  --project whatsanalyze-wrapped-prod

gcloud firestore import gs://<eur3-bucket>/wrapped-<date> \
  --project whatsanalyze-80665
```

Writes to `data` after the snapshot are lost, so either freeze writes for the
duration or re-run a delta export at cutover.

Timing matters more than technique here. Wrapped peaks in December and is close
to idle the rest of the year, so running this outside the season shrinks the
loss window to near zero instead of fighting live traffic.

### Phase 4: cutover

Deploy the frontend against main-project Firestore, then verify in this order:

- an *old* share UUID still resolves, which is what proves the import worked
- one real checkout end to end, following the production test procedure in
  `functions-wrapped/README.md`, refunded immediately afterwards
- the confirmation email arrives through the main project's extension

### Phase 5: decommission

Delete the wrapped functions, uninstall the extension, and remove the
`FIREBASE_SERVICE_ACCOUNT_WHATSANALYZE_WRAPPED` GitHub secret.

Keep both Firebase projects in read-only limbo for a billing cycle or two before
deleting them. They are the rollback.

## Open decision: analytics

Consolidating sends wrapped events into the main property `G-H1WL9MXJ17`
alongside general site traffic, and leaves the existing history stranded in
`G-XJDRX60BNX`. The working assumption in this document is that this is
acceptable and that wrapped traffic gets segmented on the `/wrapped` path prefix
instead. If wrapped's funnel needs standalone reporting, keep the property
separate and configure it explicitly rather than inheriting the main one.

## Related

The old repository must stay alive independently of this migration:
`wrapped.whatsanalyze.com` is served by GitHub Pages out of it, and public share
links point at that domain. See
[PR #388](https://github.com/SpiritFour/whatsanalyze/pull/388) for the redirect
requirements.
