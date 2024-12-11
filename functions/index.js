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


const app = initializeApp();

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const PAYPAL_CLIENT_ID_DEV =
  "ARYQUp4C_oNjNUNkvSPzLeaiulItDmnHUU226OANt2haCKC2c70ZrKZTmRHCPldcu4SD22LmPEuonfec";
const PAYPAL_CLIENT_ID_PROD =
  "AUMWxSZrtBOA1RicR_3nGijYb8yYxyq2lxBjiwoQKfVc-8jfdPr5N7X5EFUackMCLb_K7HiKswnDBUJ8";

async function requestAccessToken(dev = true) {
  const basic_auth = dev
    ? `${PAYPAL_CLIENT_ID_DEV}:${process.env.PAYPAL_PASSWORD_DEV}`
    : `${PAYPAL_CLIENT_ID_PROD}:${process.env.PAYPAL_PASSWORD_PROD}`;
  const response = await fetch(
    "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(basic_auth) // encode the credentials
      },
      body: new URLSearchParams({
        grant_type: "client_credentials"
      })
    }
  );
  return await response.json();
}

async function createProduct(accessToken, productId) {
  return await fetch("https://api-m.sandbox.paypal.com/v1/catalogs/products", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "PayPal-Request-Id": productId,
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      name: "Whatsanalyze Plan",
      type: "SERVICE",
      image_url: "https://whatsanalyze.com/subscriptions.png",
      home_url: "https://whatsanalyze.com/"
    })
  });
}

async function createPlan(accessToken, product_id) {
  return await fetch("https://api-m.sandbox.paypal.com/v1/billing/plans", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      product_id,
      name: "Whatsanalyze Plan",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1
          },
          tenure_type: "REGULAR",
          sequence: 1,
          pricing_scheme: {
            fixed_price: {
              value: "15",
              currency_code: "EUR"
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3
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
  const response = await fetch(
    `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    }
  );

  return response.json();
}

async function getSubscriptionLink(
  accessToken,
  baseUrl = "https://whatsanalyze.com",
  plan_id = "P-28458220JT356632KM5K5HJI"
) {
  return (
    await fetch("https://api-m.sandbox.paypal.com/v1/billing/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        plan_id,
        application_context: {
          cancel_url: `${baseUrl}/cancel`,
          return_url: `${baseUrl}/subscribe`
        }
      })
    })
  ).json();
}

exports.helloworld = onRequest(
  { secrets: ["PAYPAL_PASSWORD_DEV", "PAYPAL_PASSWORD_PROD"], cors: true },
  async (request, response) => {

    const origin = request.get("origin");

    const token = await requestAccessToken(true);
    // example value:
    // {"status":"APPROVAL_PENDING","id":"I-XKCLA5KDLLK3","create_time":"2024-12-09T20:08:32Z","links":[{"href":"https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=BA-41P21132UV5106118","rel":"approve","method":"GET"},{"href":"https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-XKCLA5KDLLK3","rel":"edit","method":"PATCH"},{"href":"https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-XKCLA5KDLLK3","rel":"self","method":"GET"}]}
    const linkStuff = await getSubscriptionLink(token.access_token, `${origin}`);

    logger.info("got link stuff back", { linkStuff });
    logger.info("links", { links: linkStuff.links });
    logger.info("filtered", {
      oneLink: linkStuff.links.filter((link) => link.rel === "approve")[0]
    });

    const approveLink = linkStuff.links.filter(
      (link) => link.rel === "approve"
    )[0].href;

    response.send({ data: { approveLink } });
  }
);

/*
{
  "id": "WH-0K623039JK653552F-4YE01958GG893271P",
  "create_time": "2024-12-09T23:37:49.867Z",
  "resource_type": "sale",
  "event_type": "PAYMENT.SALE.COMPLETED",
  "summary": "Payment completed for EUR 15.0 EUR",
  "resource": {
    "billing_agreement_id": "I-L4G29A5V524B",
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
}
*/

exports.paypalwebhook = onRequest({ secrets: ["PAYPAL_PASSWORD_DEV", "PAYPAL_PASSWORD_PROD"] }, async (req, res) => {
  // get data
  const webhookData = req.body;
  console.log(webhookData);
  // check for event
  if (webhookData.event_type === "PAYMENT.SALE.COMPLETED") {
    const subscriptionId = webhookData.resource.billing_agreement_id;

    // get customer information
    const token = await requestAccessToken(true);

    const subscriptionData = await showSubscriptions(token.access_token, subscriptionId);

    const emailAddress = subscriptionData.subscriber.email_address;

    const docRef = db.collection("subscriptions")
      .doc(emailAddress);

    // todo calculate real value from subscriptionData
    const expirationTimestamp = (new Date()).setFullYear(new Date().getFullYear() + 1);
    await docRef.set({
      webhookData,
      subscriptionData,
      expirationTimestamp
    }, { merge: true });
  }
  res.status(200).end();
});

exports.checksubscriberstatus = onRequest({ secrets: ["PAYPAL_PASSWORD_DEV", "PAYPAL_PASSWORD_PROD"], cors: true }, async (req, res) => {
  // get data
  const id = req.body.data.email || req.body.data.subscriptionId;
  const isEmail = !!req.body.data.email;

  if (!id) {
    res.status(400).send("No id provided");
    return;
  }

  let exists = false;
  if (isEmail) {
    exists = (await db.collection("subscriptions")
      .doc(id).get()).exists;
  } else {
    exists = !(await db.collection("subscriptions")
      .where("subscriptionData.id", "==", id).limit(1).get()).empty;
  }
  res.status(200).send({
    data: {
      isValid: exists
    }
  });
});


/*
async function saveTransactionInFirebase(id, productIds, amount, email) {
  await db.collection('transactions')
    .doc(id)
    .set({
      timestamp: Date.now(),
      amount: amount,
      email: email,
    });
}

function userFacingMessage(error) {
  return error.type ? error.message : 'An error occurred, developers have been alerted';
}


function paypalClient() {
  let clientId = functions.config().keys.paypal_client_id
  let clientSecret = functions.config().keys.paypal_client_secret
  const paypalEnvironment = paypal.core.LiveEnvironment(
    clientId, clientSecret
  );

  return new paypal.core.PayPalHttpClient(paypalEnvironment);
}

exports.validatePaypalPayment = functions.https.onRequest(async (req, res) => {
  try {
    res.set('Access-Control-Allow-Origin', 'https://whatsanalyze.com')
    // get body from request
    var {
      amount,
      productIds,
      numberOfBlackTags,
      customerContact,
      paymentMethod
    } = getBodyData(req);

    // Get the signature from the request header
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'EUR',
          // paypal needs the price in full eur not in cents
          value: amount / 100.0,
        }
      }]
      //,
      //   application_context:  {
      //     shipping_preference: NO_SHIPPING
      //  }
    });
    // create paypal order
    let order;
    try {
      order = order = await paypalClient().execute(request);
    } catch (err) {
      // Handle any errors from the call
      console.error('Error' + err);
      res.status(500).send(userFacingMessage("Server Error. Please try again."))
      return null
    }
    // save order in firebase
    await saveTransactionInFirebase(order.result.id, productIds, amount, customerContact, paymentMethod, numberOfBlackTags);

    // Return a successful response to the client with the order ID
    console.log("Validated paypal order with id " + order.result.id);
    res.status(200).json({
      orderID: order.result.id
    });

  } catch (err) {
    console.log(err)
    res.status(500).send(userFacingMessage(err))
    return null
  }
})

exports.paypalWebhook = functions.https.onRequest(async (req, res) => {
  // get data
  const body = req.body;
  // chech for event
  if (body.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    try {
      const orderID = body.resource.links[2].href.split('/').pop()
      const docRef = db.collection('pastTransactions')
        .doc(orderID)
      docRef.get().then(async doc => {
        if (doc.exists) {
          // update data
          docRef.set({
            recievedPayment: true
          }, {
            merge: true
          })
          // send order confirmation
          const customerContact = doc.data().customerContact
          const orderedProducts = doc.data().productIds
          await sendOrderConfirmation(customerContact, orderedProducts)
          // send success
          res.status(200).send({
            recieved: true
          }).end();
        } else {
          const message = "Invalid id: " + orderID
          notifyAdmin(message, 'Error @ paypalWebhook')
          console.log(message);
          res.status(200).end();
          return null
        }
      })
    } catch (err) {
      notifyAdmin(err, 'Error @ paypalWebhook')
      res.status(500).end();
      return null
    }
  }
})
*/
