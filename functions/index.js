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
const { paypalClientRegistry } = require("./paypalClientRegistry");

// Initialize Cloud Firestore and get a reference to the service

exports.helloworld = onRequest(
  { secrets: ["PAYPAL_PASSWORD_DEV", "PAYPAL_PASSWORD_PROD"], cors: true },
  async (request, response) => {
    const paypalClient = paypalClientRegistry.getConfigFromClientRequest(
      request
    );
    if (!paypalClient) {
      response.status(422).send({
        data: {
          error: "No paypal client id provided",
        },
      });
      return;
    }
    const origin = request.get("origin");
    if (!origin) {
      response.status(422).send({
        data: {
          error: "Was not able to determine callbackURL.",
        },
      });
      return;
    }

    const approveLink = await paypalClient.getSubscriptionLink(origin);

    response.send({ data: { approveLink } });
  }
);

exports.paypalwebhook = onRequest(
  { secrets: ["PAYPAL_PASSWORD_DEV", "PAYPAL_PASSWORD_PROD"] },
  async (req, res) => {
    // get data
    const webhookData = req.body;
    console.log("got data", webhookData);

    // somehow paypal does not set a origin header...
    const isDev = webhookData.links[0].href.includes("sandbox");

    const client = paypalClientRegistry.getConfigForEnv(isDev);
    logger.info("got client", client);
    await client.handleWebhook(webhookData);

    res.status(200).end();
  }
);

exports.checksubscriberstatus = onRequest(
  {
    secrets: ["PAYPAL_PASSWORD_DEV", "PAYPAL_PASSWORD_PROD"],
    cors: true,
  },
  async (req, res) => {
    const client = paypalClientRegistry.getConfigFromClientRequest(req);
    if (!client) {
      res.status(422).send({
        data: {
          error: "No paypal client id provided",
        },
      });
      return;
    }

    logger.info("body.data", req.body.data);
    const { email, subscriptionId } = req.body.data;
    logger.info("body.data2", email, subscriptionId);

    if (!(email || subscriptionId)) {
      res
        .status(400)
        .send("No id provided. Provide either email or subscriptionId.");
      return;
    }

    // get data
    let exists = await client.doesSubscriptionExist(email, subscriptionId);
    res.status(200).send({
      data: {
        isValid: exists,
      },
    });
  }
);
