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
const {
  paypalClientRegistry: backendClientRegistry,
} = require("./backendClientRegistry");

exports.helloworld = onRequest(
  { secrets: ["PAYPAL_PASSWORD_DEV", "PAYPAL_PASSWORD_PROD"], cors: true },
  async (request, response) => {
    const client = backendClientRegistry.getClientFromClientRequest(request);
    if (!client) {
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

    const approveLink = await client.getSubscriptionLink(origin);

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

    const client = backendClientRegistry.getClientForEnv(isDev);
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
    const client = backendClientRegistry.getClientFromClientRequest(req);
    if (!client) {
      res.status(422).send({
        data: {
          error: "No paypal client id provided",
        },
      });
      return;
    }

    const { email, subscriptionId } = req.body.data;

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
