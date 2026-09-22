# Firebase and payments

What the backend looks like now that Wrapped's separate Firebase project and
the PayPal-era functions are gone. This replaces the migration runbook that
described the move — the move is done, and every "current state" in it was
wrong by the end.

## Projects

Two, both in `.firebaserc`:

| Alias | Project | Role |
| --- | --- | --- |
| `default` | `whatsanalyze-80665` | production: the live site, live Stripe mode |
| `dev` | `whatsanalyze-wrapped` | development, test Stripe mode |

The dev project's id is frozen from when Wrapped was a separate product. Only
its display name says dev.

Firestore and the functions have to come from the same project: the functions
charge in the Stripe mode of the project they run in, so a local build paying
in test mode must not write into the database real customers read from.

## Functions

One codebase, `functions/`, TypeScript, deployed to `us-central1`:

| Function | What it does |
| --- | --- |
| `createCheckoutSession` | starts a Stripe Checkout, subscription or one-time |
| `getCheckoutSession` | reads back a session the browser just returned from |
| `stripeWebhook` | the only writer of `subscriptions`; also mails and reports the purchase to GA4 |
| `verifySubscription` | the "login": email + subscription id against the mirror |
| `createCustomerPortal` | Stripe's own subscription management |
| `verifyPaypalSubscription` | read-only legacy login, see below |

Config is per project in `functions/.env.whatsanalyze-80665` and
`functions/.env.whatsanalyze-wrapped`. Secrets (`STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `PAYPAL_SECRET`, `GA_API_SECRET`) live in Secret
Manager and are set with `functions:secrets:set`.

CI never deploys functions. Ship the frontend first, then deploy by hand:

```
pnpm deploy-functions:dev     # or :prod
```

## Firestore collections

| Collection | Written by | Purpose |
| --- | --- | --- |
| `data` | the browser, `utils/wrapped/sharing/firestore.ts` | encrypted share payloads that public share links resolve against |
| `subscriptions` | `functions/src/stripe/webhook.ts`, keyed by Stripe customer id | the mirror `verifySubscription` and `createCustomerPortal` read |
| `mail` | `functions/src/mail.ts` | queue for the `firebase/firestore-send-email` extension |
| `mailTemplates` | `functions/scripts/initializeTemplates.ts` | one `subscription-confirmation` document |

No composite indexes, no field overrides, no Auth users.

## PayPal

Subscriptions were sold through PayPal until the move to Stripe. Nothing new
can be bought through it — the plan, the webhook and the Firestore mirror are
all deleted — but those customers still log in with a PayPal subscription id
(`I-...`, which is how `stores/subscription.ts` tells the two apart).

`verifyPaypalSubscription` is what is left: one read of PayPal's own API,
asking whether the subscription is still `ACTIVE`. It needs no database.

When the last of these lapses, delete `functions/src/paypal/`, `verifyPaypal`
in `stores/subscription.ts`, and the `PAYPAL_*` entries in both env files.

## Analytics

One GA4 property, `G-XYC2EWGZZ3`. Wrapped's old standalone property was not
carried over; its traffic is segmented on the `/wrapped` path prefix instead.

`purchase` is sent only from `stripeWebhook`, over the Measurement Protocol —
it sees every paid cent plus the renewals no browser is around for, and GA4
does not deduplicate by transaction id, so exactly one sender may exist. The
browser sends `begin_checkout` and `checkout_completed`; see
`composables/useAnalytics.ts`, which is the whole list of events the site
sends.
