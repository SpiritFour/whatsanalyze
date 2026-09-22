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

### Phase 0: capture what is not in git (done)

Firestore security rules were console-only and existed in none of the three
repositories. They now live in `firestore.rules`, wired through a `firestore`
block in `firebase.json`.

Reading them back required the Firebase Rules API rather than the CLI, which has
no equivalent of `firestore:rules:get`. User credentials need a quota project on
that API, so the call carries an `x-goog-user-project` header:

```bash
T=$(gcloud auth print-access-token)
curl -s -H "Authorization: Bearer $T" -H "x-goog-user-project: $PROJECT" \
  "https://firebaserules.googleapis.com/v1/projects/$PROJECT/releases"
# then fetch the rulesetName the cloud.firestore release points at
```

What came back was open at the wildcard in both projects, so the committed rules
are not a copy of production — see the commit that added them.

They are deployed to `whatsanalyze-80665` and to `dev`; the live ruleset there
matches `firestore.rules` in this repository. `whatsanalyze-wrapped-prod` still
has its original open rules and keeps them, because it is only a rollback target
now. Note that nothing in CI deploys rules — `firebase deploy --only
firestore:rules` is manual, so a change to `firestore.rules` does not reach
production by merging it. Exercise upload, share, open-link and the feedback
form against `dev` before deploying, because a mistake here locks real users out
of sharing rather than failing loudly.

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

### Phase 2: Stripe rewiring (done)

The Stripe account itself does not change. Customers, subscriptions, prices and
the intro coupon all stay where they are. What changes is where Stripe delivers
webhooks.

**Closed on 2026-09-19.** One endpoint remains:

| Endpoint | Project | Behaviour |
| --- | --- | --- |
| `we_1UFoB1L4rDqbYflosczPlQXS` | `whatsanalyze-80665` | verifies signatures, writes `subscriptions`, mails the confirmation |
| ~~`we_1SeeXYL4rDqbYflolVUjE6OD`~~ | ~~`whatsanalyze-wrapped-prod`~~ | deleted |

The overlap ran with `SEND_CONFIRMATION_EMAIL=false` on `whatsanalyze-80665`, so
only the old deployment mailed while both endpoints were live. Its
`subscriptions` mirror was current from the moment the second endpoint was
registered, which is why the Phase 3 import only had to backfill what existed
before that point.

Closing it was ordered: the old endpoint was deleted first, then
`SEND_CONFIRMATION_EMAIL` flipped to true and the functions redeployed.
Reversed, every customer subscribing in between gets two identical confirmation
emails, because nothing downstream deduplicates. The same order applies to any
future second endpoint on this Stripe account.

Deploy the wrapped codebase explicitly — `firebase deploy --only functions:wrapped`.
The bare `--only functions` the CLI suggests after a secret change also deploys
the PayPal codebase that shares the project.

### Phase 3: data migration (done)

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

`gcloud` comes from the flake. These two commands authenticate with the user
credential from `gcloud auth login`, so they do not need application-default
credentials — only `scripts/initializeTemplates.ts` does, because it goes
through `firebase-admin`.

The prod bucket already exists: `gs://whatsanalyze-migration-eur3`, created at
`EU` to match the source database's `eur3`. That pairing is a hard requirement
and has been verified against the real database.

#### Run it twice, either side of the cutover

The ordering is the part that is easy to get wrong, because each obvious
sequence loses something:

- Migrate, then cut over, and every share created between the snapshot and the
  frontend switching is written to the old project and never copied. Silent,
  permanent data loss.
- Cut over, then migrate, and nothing is lost — the old project stops being
  written to the moment the frontend switches — but old share links do not
  resolve until the import lands.

Running it twice avoids both:

1. Export and import now. Old links start resolving from the new project.
2. Merge `dev` into `main`. The frontend switches, and the old project's `data`
   collection stops growing.
3. Export and import again, to sweep up everything written between 1 and 2.

Step 3 is safe to repeat because import writes documents under their original
ids, and a `data` document is never updated after creation — the rules now
enforce that, denying `update` and `delete`. Re-importing a record that is
already there is a genuine no-op, so the second pass can only add.

Timing still helps. Wrapped peaks in December and is close to idle the rest of
the year, so the gap between passes 1 and 3 is cheapest outside the season.

Both passes ran on 2026-09-19, either side of the #398 merge, through
`gs://whatsanalyze-migration-eur3/cutover-2026-09-19{,-pass2}`. 1905 documents
each time — nothing was created in the gap. Note the bucket belongs to
`whatsanalyze-wrapped-prod`, so the import needed `whatsanalyze-80665`'s
Firestore service agent granted read on it first; a cross-project import fails
without that.

### Phase 4: cutover (done)

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
