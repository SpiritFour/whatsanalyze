const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");
const logger = require("firebase-functions/logger");
const app = initializeApp();
const db = getFirestore(app);

class PaypalClient {
  constructor(env, clientId, clientSecretName, planId, apiEndpoint) {
    this.env = env;
    this.clientId = clientId;
    this.clientSecretName = clientSecretName;
    this.planId = planId;
    this.apiEndpoint = apiEndpoint;
    this.subscriptionCollectionName = `subscriptions-${env}`;
  }

  getClientSecret() {
    console.log();
    return process.env[this.clientSecretName];
  }

  isDev() {
    return this.env === "dev";
  }

  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }
    // console.log("Requesting access token", config);
    // const basic_auth = `${config.clientId}:${config.secret_key()}`;
    const basic_auth = `${this.clientId}:${this.getClientSecret()}`;
    console.log(`Access Token: ${basic_auth}`);
    // todo we also have to use a different url for prod
    const response = await fetch(`${this.apiEndpoint}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(basic_auth), // encode the credentials
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
    });
    const token = await response.json();
    this.accessToken = token.access_token;
    return this.accessToken;
  }

  async getSubscriptionLink(callbackUrl) {
    // example value:
    // {"status":"APPROVAL_PENDING","id":"I-XKCLA5KDLLK3","create_time":"2024-12-09T20:08:32Z","links":[{"href":"https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=BA-41P21132UV5106118","rel":"approve","method":"GET"},{"href":"https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-XKCLA5KDLLK3","rel":"edit","method":"PATCH"},{"href":"https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-XKCLA5KDLLK3","rel":"self","method":"GET"}]}
    const linkStuff = await (
      await fetch(`${this.apiEndpoint}/v1/billing/subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          plan_id: this.planId,
          application_context: {
            cancel_url: `${callbackUrl}/cancel`,
            return_url: `${callbackUrl}/subscribe`,
          },
        }),
      })
    ).json();
    if (!linkStuff.links) {
      console.log("Link stuff mismatch", { linkStuff });
    }

    // extract the link that is used to approve the subscription
    return linkStuff.links.filter((link) => link.rel === "approve")[0].href;
  }

  async getDataForSubscription(subscriptionId) {
    const response = await fetch(
      `${this.apiEndpoint}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    return response.json();
  }

  async handleWebhook(webhookData) {
    if (webhookData.event_type === "PAYMENT.SALE.COMPLETED") {
      const subscriptionId = webhookData.resource.billing_agreement_id;
      // get customer information
      const subscriptionData = await this.getDataForSubscription(
        subscriptionId
      );

      const docRef = db
        .collection(this.subscriptionCollectionName)
        .doc(subscriptionId);

      // todo calculate real value from subscriptionData -> or just delete the subscription/set inactive when the paypal event arrives
      const expirationTimestamp = new Date().setFullYear(
        new Date().getFullYear() + 1
      );
      await docRef.set(
        {
          webhookData,
          subscriptionData,
          expirationTimestamp,
        },
        { merge: true }
      );
    } else {
      logger.info("unhandled webhook data", webhookData);
    }
  }

  // ################ Firebase Stuff is here #########

  async getSubscriptionDataByEmail(email) {
    return db
      .collection(this.subscriptionCollectionName)
      .where("subscriptionData.subscriber.email_address", "==", email)
      .limit(1)
      .get();
  }

  async getSubscriptionDataById(subscriptionId) {
    return await db
      .collection(this.subscriptionCollectionName)
      .doc(subscriptionId)
      .get();
  }

  async doesSubscriptionExist(email, subscriptionId) {
    if (email) {
      return !(await this.getSubscriptionDataByEmail(email)).empty;
    } else {
      return (await this.getSubscriptionDataById(subscriptionId)).exists;
    }
  }
}

const configs = [
  {
    env: "dev",
    clientId:
      "ARYQUp4C_oNjNUNkvSPzLeaiulItDmnHUU226OANt2haCKC2c70ZrKZTmRHCPldcu4SD22LmPEuonfec",
    clientSecretName: "PAYPAL_PASSWORD_DEV",
    planId: "P-28458220JT356632KM5K5HJI",
    apiEndpoint: "https://api-m.sandbox.paypal.com",
  },
  {
    env: "prod",
    clientId:
      "AUMWxSZrtBOA1RicR_3nGijYb8yYxyq2lxBjiwoQKfVc-8jfdPr5N7X5EFUackMCLb_K7HiKswnDBUJ8",
    clientSecretName: "PAYPAL_PASSWORD_PROD",
    planId: undefined, // todo create plan for prod
    apiEndpoint: undefined, // todo find apiEndpoint
  },
];

class ConfigRegistry {
  constructor(configs) {
    this.paypalClients = configs.map((config) => {
      return new PaypalClient(
        config.env,
        config.clientId,
        config.clientSecretName,
        config.planId,
        config.apiEndpoint
      );
    });
  }

  getClientById(clientId) {
    return this.paypalClients.find((client) => client.clientId === clientId);
  }

  // use for client requests
  getConfigFromClientRequest(request) {
    const clientId = request.body?.data?.client_id;
    console.log("Client ID", clientId);
    return this.getClientById(clientId);
  }

  // use for server requests
  getConfigForEnv(isDev) {
    return this.paypalClients.find((client) => client.isDev() === isDev);
  }
}

const paypalClientRegistry = new ConfigRegistry(configs);

module.exports = { paypalClientRegistry };
