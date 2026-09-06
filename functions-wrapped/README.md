# Project switching
firebase use dev
firebase use prod
# Firebase Functions Setup (Node 22)

## Prerequisites

- Node 22 or higher
- Firebase CLI: `npm install -g firebase-tools`
- both are installed already with nix
- install stripe cli

## Quick Start

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Add Firebase Projects

```bash
firebase use --add
# Alias: dev
# Project: whatsanalyze-dev (or your dev project ID)

firebase use --add
# Alias: prod
# Project: whatsanalyze-prod (or your prod project ID)
```

### 3. Build & Test Locally

```bash
npm run build      # Compile TypeScript
npm run dev        # Run emulator with functions
```

Visit `http://localhost:5001` for emulator UI.

### 4. Deploy to Dev

```bash
firebase use dev
npm run deploy:dev
```

### 5. Deploy to Prod

```bash
firebase use prod
npm run deploy:prod
```

### 6. Setup Stripe

If You want to test the payment/subscription flow locally, stripe relies on webhook. We use the stripe cli to make sure that we can recieve those locally. Have a look at the stripe section further down.

## Node Version

Functions target **Node 22** (latest LTS supported by Firebase Functions runtime).

## Environment Variables
There are some values which are different between dev and prod. For that we use environment files (`.env.FIREBASE_PROJECT_NAME`). It is possible to overwrite those when running locally by creating a `.env.local` file and adding the values there. This file takes precedence over the `.env.FIREBASE_PROJECT_NAME` file. There are also some values that are sensitive, so we treat them as secrets.

### Secrets 
`STRIPE_WEBHOOK_SECRET` and `STRIPE_SECRET_KEY` are secrets which we can not simply put in the `.env.FIREBASE_PROJECT_NAME` files. For that reason we create and manage secrets via the firebase cli:

```bash
firebase --project $PROJECT functions:secrets:set STRIPE_SECRET_KEY
firebase --project $PROJECT functions:secrets:set STRIPE_WEBHOOK_SECRET
```
You can use the `scripts/setup-stripe.sh` file for that. Make sure that there are no whitespaces in the secrets stored. You can access the secret with `firebase --project $PROJECT functions:secrets:access STRIPE_SECRET_KEY`.

## Init mail templates
Install the extension in the firebase console first:
![firebase_email_extension.png](docs/firebase_email_extension.png)
```bash
firebase login
# authenticate gcloud
gcloud auth application-default login
npm run init:templates:dev
```

# Troubleshooting

If you get cors issues when trying to invoke the firebase Callable Cloud Function the most likely issue is that
anonymous access is not allow and needs ot be enabled in gcp.
![gcloud_function_allow_public_access.png](docs/gcloud_function_allow_public_access.png)


# Stripe Firebase Functions

Firebase Cloud Functions for handling Stripe checkout and subscriptions, translated from the [Stripe checkout-single-subscription sample](https://github.com/stripe-samples/checkout-single-subscription).

## Quick Start

### 1. Stripe Local testing
- stripe login
- stripe listen --forward-to http://127.0.0.1:5001/whatsanalyze-wrapped/us-central1/stripeWebhook
  - add "Your webhook signing secret is `whsec_2f7....`" output to `.secret.local` file
    - `STRIPE_WEBHOOK_SECRET=`whsec_2f7....``
- stripe trigger checkout.session.completed

### 2. Stripe dev testing
- ./scripts/setup-stripe.sh to set the stripe keys (secret + api)
- stripe trigger subscription.payment_succeeded --add "customer:email=stripe@whatsanalyze.com"

### 3. Stripe Production Webhook Testing

To verify webhooks work correctly in production, create a test checkout session:

```bash
npm run stripe:test-checkout:prod
```

This creates a checkout session with a €0.50 test product (`prod_TeTooduQWBMod7`). Open the returned `url` in your browser, complete the purchase with a real card, verify the webhook fires correctly, then refund immediately from Stripe Dashboard.

**Note**: This uses the `STRIPE_SECRET_KEY` from Firebase secrets, so you need Firebase project access.

### 4. Stripe Subscription Renewal testing
In theory it should be enough to set the renewal date to now with this command:
```bash
stripe subscriptions update "$SUB_ID" --billing-cycle-anchor=now --proration-behavior=none 
```
And stripe would then handle the rest in the background (automatic invoice creation and payment of that).
But I was not able to make it work. The anchor is successfully set, but the subscription cycle is not happening.

What was working is following this tutorial:
https://docs.stripe.com/billing/testing/test-clocks/simulate-subscriptions
It simulates what would happen by forwarding the time at stripe BE.

## Stripe Web setup
Create api keys and make sure to store them accordingly to the firebase function secret setup (look above).
Create a subscription and add the price_id as env variable accordingly to the firebase environment setup (look above).
Make sure that the webook is correctly configured. Webhook URL looks something like: `https://us-central1-whatsanalyze-wrapped.cloudfunctions.net/stripeWebhook` (This is just an example, make sure to find the correct url. It should be displayed when deploying functions).
