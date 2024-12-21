/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const logger = require("firebase-functions/logger");
const { getConfigFromClientRequest, getSubscriptionLink, getConfigForEnv, showSubscriptions } = require("./paypalApi");


const app = initializeApp();

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);


exports.helloworld = onRequest(
  { secrets: ["PAYPAL_PASSWORD_DEV", "PAYPAL_PASSWORD_PROD"], cors: true },
  async (request, response) => {

    const config = getConfigFromClientRequest(request);
    if (!config) {
      response.status(422).send({
        data: {
          error: "No paypal client id provided"
        }
      });
      return;
    }

    const token = await config.token();
    const approveLink = await getSubscriptionLink(token.access_token, config.origin, config.planId);


    response.send({ data: { approveLink } });
  }
);

/*
curl localhost:5001/whatsanalyze-80665/us-central1/paypalwebhook -H "Origin: sandbox.localhost:3000" --header "Content-Type: application/json" --data '{
  "id": "WH-0K623039JK653552F-4YE01958GG893271P",
  "create_time": "2024-12-09T23:37:49.867Z",
  "resource_type": "sale",
  "event_type": "PAYMENT.SALE.COMPLETED",
  "summary": "Payment completed for EUR 15.0 EUR",
  "resource": {
    "billing_agreement_id": "I-XBCXVY6FXX47",
    "amount": {
      "total": "15.00",
      "currency": "EUR",
      "details": {
        "subtotal": "15.00"
      }
    },
    "payment_mode": "INSTANT_TRANSFER",
    "update_time": "2024-12-09T23:37:46Z",
    "create_time": "2024-12-09T23:37:46Z",
    "protection_eligibility_type": "ITEM_NOT_RECEIVED_ELIGIBLE,UNAUTHORIZED_PAYMENT_ELIGIBLE",
    "transaction_fee": {
      "currency": "EUR",
      "value": "0.64"
    },
    "protection_eligibility": "ELIGIBLE",
    "links": [
      {
        "method": "GET",
        "rel": "self",
        "href": "https://api.sandbox.paypal.com/v1/payments/sale/3H059479R49575703"
      },
      {
        "method": "POST",
        "rel": "refund",
        "href": "https://api.sandbox.paypal.com/v1/payments/sale/3H059479R49575703/refund"
      }
    ],
    "id": "3H059479R49575703",
    "state": "completed",
    "invoice_number": ""
  },
  "status": "SUCCESS",
  "transmissions": [
    {
      "webhook_url": "https://paypalwebhook-ypb2zslcea-uc.a.run.app",
      "http_status": 200,
      "reason_phrase": "HTTP/1.1 200 Connection established",
      "response_headers": {
        "X-Cloud-Trace-Context": "5df73ae1d22a76537a93d782bbcbd806;o=1",
        "Server": "Google Frontend",
        "Connection": "keep-alive",
        "content-type": "text/html; charset=utf-8",
        "Content-Length": "29",
        "Date": "Mon, 09 Dec 2024 23:37:56 GMT"
      },
      "transmission_id": "9c3b9d60-b686-11ef-85fa-33b1e3dfa2fd",
      "status": "SUCCESS",
      "timestamp": "2024-12-09T23:37:53Z"
    }
  ],
  "links": [
    {
      "href": "https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-0K623039JK653552F-4YE01958GG893271P",
      "rel": "self",
      "method": "GET",
      "encType": "application/json"
    },
    {
      "href": "https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-0K623039JK653552F-4YE01958GG893271P/resend",
      "rel": "resend",
      "method": "POST",
      "encType": "application/json"
    }
  ],
  "event_version": "1.0"
}'
*/

exports.paypalwebhook = onRequest({ secrets: ["PAYPAL_PASSWORD_DEV", "PAYPAL_PASSWORD_PROD"] }, async (req, res) => {
  // get data
  const webhookData = req.body;
  console.log("got data", webhookData);

  // somehow paypal does not set a origin header..
  const isDev = webhookData.links[0].href.includes("sandbox");

  const config = getConfigForEnv(isDev);
  logger.info("got config", config);

  // check for event
  logger.info("got config", webhookData.event_type);
  if (webhookData.event_type === "PAYMENT.SALE.COMPLETED") {
    console.log("hello2");
    const subscriptionId = webhookData.resource.billing_agreement_id;
    logger.info("got subscriptionId", subscriptionId);
    // get customer information
    const token = await config.token();
    logger.info("got token", token);
    const subscriptionData = await showSubscriptions(token.access_token, subscriptionId);

    const docRef = db.collection(config.subscriptionCollectionName)
      .doc(subscriptionId);

    // todo calculate real value from subscriptionData -> or just delete the subscription/set inactive when the paypal event arrives
    const expirationTimestamp = (new Date()).setFullYear(new Date().getFullYear() + 1);
    await docRef.set({
      webhookData,
      subscriptionData,
      expirationTimestamp
    }, { merge: true });
  }
  res.status(200).end();
});

exports.checksubscriberstatus = onRequest({
  secrets: ["PAYPAL_PASSWORD_DEV", "PAYPAL_PASSWORD_PROD"],
  cors: true
}, async (req, res) => {

  const config = getConfigFromClientRequest(req);
  if (!config) {
    res.status(422).send({
      data: {
        error: "No paypal client id provided"
      }
    });
    return;
  }

  // get data
  const id = req.body.data.email || req.body.data.subscriptionId;
  const isEmail = !!req.body.data.email;

  if (!id) {
    res.status(400).send("No id provided");
    return;
  }

  let exists = false;
  if (isEmail) {
    exists = !(await db.collection(config.subscriptionCollectionName)
      .where("subscriptionData.subscriber.email_address", "==", id).limit(1).get()).empty;
  } else {
    exists = (await db.collection(config.subscriptionCollectionName)
      .doc(id).get()).exists;
  }
  res.status(200).send({
    data: {
      isValid: exists
    }
  });
});
