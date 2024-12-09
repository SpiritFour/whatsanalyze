/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const PAYPAL_CLIENT_ID_DEV = "ARYQUp4C_oNjNUNkvSPzLeaiulItDmnHUU226OANt2haCKC2c70ZrKZTmRHCPldcu4SD22LmPEuonfec";
const PAYPAL_CLIENT_ID_PROD = "AUMWxSZrtBOA1RicR_3nGijYb8yYxyq2lxBjiwoQKfVc-8jfdPr5N7X5EFUackMCLb_K7HiKswnDBUJ8";

async function requestAccessToken(dev = true) {
  const basic_auth = dev ? `${PAYPAL_CLIENT_ID_DEV}:${process.env.PAYPAL_PASSWORD_DEV}` : `${PAYPAL_CLIENT_ID_PROD}:${process.env.PAYPAL_PASSWORD_PROD}`;
  const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + btoa(basic_auth) // encode the credentials
    },
    body: new URLSearchParams({
      grant_type: "client_credentials"
    })
  });
  return await response.json();
}

async function createProduct(accessToken, productId) {
  return await fetch("https://api-m.sandbox.paypal.com/v1/catalogs/products", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "PayPal-Request-Id": productId,
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      "name": "Whatsanalyze Plan",
      "type": "SERVICE",
      "image_url": "https://example.com/streaming.jpg",
      "home_url": "https://example.com/home"
    })
  });
}

async function createPlan(accessToken, product_id) {
  return await fetch("https://api-m.sandbox.paypal.com/v1/billing/plans", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify({
      product_id,
      "name": "Whatsanalyze Plan",
      "billing_cycles": [
        {
          "frequency": {
            "interval_unit": "MONTH",
            "interval_count": 1
          },
          "tenure_type": "REGULAR",
          "sequence": 1,
          "pricing_scheme": {
            "fixed_price": {
              "value": "15",
              "currency_code": "EUR"
            }
          }
        }
      ],
      "payment_preferences": {
        "auto_bill_outstanding": true,
        "setup_fee_failure_action": "CONTINUE",
        "payment_failure_threshold": 3
      }
    })
  });

  //await fetch('https://api-m.sandbox.paypal.com/v1/billing/plans?sort_by=create_time&sort_order=desc', {
  //headers: {
  //  'Authorization': `Bearer ${accessToken.access_token}`,
  //  'Content-Type': 'application/json',
  //  'Accept': 'application/json',
  //  'Prefer': 'return=representation'
  //}
  //});
}

async function showSubscriptions(accessToken, subscriptionId) {
  const response = await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  });

  return response.json();
}

async function getSubscriptionLink(accessToken, plan_id = "P-28458220JT356632KM5K5HJI") {
  return (await (fetch("https://api-m.sandbox.paypal.com/v1/billing/subscriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
        plan_id,
        "application_context": {
          "cancel_url": "https://www.example.com/cancel",
          "return_url": "https://www.example.com/return"
        }

      }
    )
  }))).json();
}


exports.helloworld = onRequest({ secrets: ["PAYPAL_PASSWORD_DEV", "PAYPAL_PASSWORD_PROD"] }, async (request, response) => {
  const token = await requestAccessToken(true);
  // example value:
  // {"status":"APPROVAL_PENDING","id":"I-XKCLA5KDLLK3","create_time":"2024-12-09T20:08:32Z","links":[{"href":"https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=BA-41P21132UV5106118","rel":"approve","method":"GET"},{"href":"https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-XKCLA5KDLLK3","rel":"edit","method":"PATCH"},{"href":"https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-XKCLA5KDLLK3","rel":"self","method":"GET"}]}
  const linkStuff = await getSubscriptionLink(token.access_token);


  logger.info("got link stuff back", { linkStuff });
  logger.info("links", { links:linkStuff.links });
  logger.info("filtered", {oneLink: linkStuff.links.filter(link => link.rel === "approve" )[0]});

  const approveLink = linkStuff.links.filter(link => link.rel === "approve")[0].href;

  response.send({ approveLink });
});
