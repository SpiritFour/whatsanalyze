const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");
const logger = require("firebase-functions/logger");

// Initialize Cloud Firestore and get a reference to the service
const app = initializeApp();
const db = getFirestore(app);

class BackendClient {
  constructor(env, clientId, clientSecretName, planId, apiEndpoint, baseUrl) {
    this.env = env;
    this.clientId = clientId;
    this.clientSecretName = clientSecretName;
    this.planId = planId;
    this.apiEndpoint = apiEndpoint;
    this.subscriptionCollectionName = `subscriptions-${env}`;
    this.baseUrl = baseUrl;
  }

  getClientSecret() {
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

    if (!response.ok) {
      throw await response.text();
    }

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
      // const email = "moritz@moritz-wolf.de"; //subscriptionData.subscriber.email_address;
      const email = subscriptionData.subscriber.email_address;
      const mail = {
        to: email,
        bccUids: ["adrian", "mo", "paul", "sebastian"],
        template: {
          name: "subscription",
          data: {
            text: `${this.baseUrl}/subscribe?subscription_id=${subscriptionId}&email=${email}`,
            subscriptionId: subscriptionData.id,
            email: email,
            name: subscriptionData.subscriber.name.given_name,
          },
          created: Timestamp.fromDate(new Date()),
        },
      };
      await db.collection("mail").doc().set(mail);
    } else {
      logger.error("unhandled webhook data", webhookData);
      const mail = {
        to: "sebastian",
        bccUids: ["adrian", "mo", "paul"],
        template: {
          name: "feedback",
          data: {
            name: "Unhandled Webhook",
            text: JSON.stringify(webhookData),
            rating: -1,
            email: null,
          },
          created: Timestamp.fromDate(new Date()),
        },
      };
      await db.collection("mail").doc().set(mail);
    }
  }

  async createProduct(productId) {
    return fetch(`${this.apiEndpoint}/v1/catalogs/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await this.getAccessToken()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "PayPal-Request-Id": productId,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        name: "Whatsanalyze Plan",
        type: "SERVICE",
        image_url: "https://whatsanalyze.com/subscriptions.png",
        home_url: "https://whatsanalyze.com/",
      }),
    });
  }

  async createPlan(product_id) {
    return fetch(`${this.apiEndpoint}/v1/billing/plans`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await this.getAccessToken()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        product_id,
        name: "Whatsanalyze Plan",
        billing_cycles: [
          {
            frequency: {
              interval_unit: "MONTH",
              interval_count: 1,
            },
            tenure_type: "REGULAR",
            sequence: 1,
            pricing_scheme: {
              fixed_price: {
                value: "15",
                currency_code: "EUR",
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      }),
    });
  }

  async getPlans() {
    return fetch(
      `${this.apiEndpoint}/v1/billing/plans?sort_by=create_time&sort_order=desc`,
      {
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          Prefer: "return=representation",
        },
      }
    );
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
    return db
      .collection(this.subscriptionCollectionName)
      .doc(subscriptionId)
      .get();
  }

  async getSubscription(email, subscriptionId) {
    if (email) {
      const data = await this.getSubscriptionDataByEmail(email);
      return {
        isValid: !data.empty,
        data: data.docs.map((x) => x.data()),
      };
    } else {
      const data = await this.getSubscriptionDataById(subscriptionId);
      const retrievedData = data.data();

      return {
        isValid: data.exists,
        data: {
          subscriptionId: retrievedData.subscriptionData.id,
          email: retrievedData.subscriptionData.subscriber.email_address,
          name: retrievedData.subscriptionData.subscriber.name,
          expirationTimestamp: retrievedData.expirationTimestamp,
        },
      };
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
    // todo this is really ugly. instead we should add the callback url to the context of the paypal call.
    // somewhere here: https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_create
    // or we have to create the intend in firebase already somehow and correlate it then
    baseUrl: "https://whatsanalyze-80665.web.app",
  },
  {
    env: "prod",
    clientId:
      "AUMWxSZrtBOA1RicR_3nGijYb8yYxyq2lxBjiwoQKfVc-8jfdPr5N7X5EFUackMCLb_K7HiKswnDBUJ8",
    clientSecretName: "PAYPAL_PASSWORD_PROD",
    planId: undefined, // todo create plan for prod
    apiEndpoint: undefined, // todo find apiEndpoint
    baseUrl: "https://whatsanalyze.com",
  },
];

class BackendClientRegistry {
  constructor(configs) {
    this.paypalClients = configs.map((config) => {
      return new BackendClient(
        config.env,
        config.clientId,
        config.clientSecretName,
        config.planId,
        config.apiEndpoint,
        config.baseUrl
      );
    });
  }

  getClientById(clientId) {
    return this.paypalClients.find((client) => client.clientId === clientId);
  }

  // use for client requests
  getClientFromClientRequest(request) {
    const clientId = request.body?.data?.client_id;
    console.log("Client ID", clientId);
    return this.getClientById(clientId);
  }

  // use for server requests
  getClientForEnv(isDev) {
    return this.paypalClients.find((client) => client.isDev() === isDev);
  }
}

const backendClientRegistry = new BackendClientRegistry(configs);

module.exports = { backendClientRegistry };
