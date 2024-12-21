const clientIds = {
  "ARYQUp4C_oNjNUNkvSPzLeaiulItDmnHUU226OANt2haCKC2c70ZrKZTmRHCPldcu4SD22LmPEuonfec": {
    env: "dev",
    // this needs to be an anonymous function, so it gets evaluated during runtime, where this env variable is available,
    // if the function has access to it
    clientId: "ARYQUp4C_oNjNUNkvSPzLeaiulItDmnHUU226OANt2haCKC2c70ZrKZTmRHCPldcu4SD22LmPEuonfec",
    token: () => requestAccessTokenClient("ARYQUp4C_oNjNUNkvSPzLeaiulItDmnHUU226OANt2haCKC2c70ZrKZTmRHCPldcu4SD22LmPEuonfec", process.env.PAYPAL_PASSWORD_DEV),
    subscriptionCollectionName: `subscriptions-dev`,
    planId: "P-28458220JT356632KM5K5HJI"
  },
  "AUMWxSZrtBOA1RicR_3nGijYb8yYxyq2lxBjiwoQKfVc-8jfdPr5N7X5EFUackMCLb_K7HiKswnDBUJ8": {
    env: "prod",
    clientId: "AUMWxSZrtBOA1RicR_3nGijYb8yYxyq2lxBjiwoQKfVc-8jfdPr5N7X5EFUackMCLb_K7HiKswnDBUJ8",
    // todo pass api url
    token: () => requestAccessTokenClient("AUMWxSZrtBOA1RicR_3nGijYb8yYxyq2lxBjiwoQKfVc-8jfdPr5N7X5EFUackMCLb_K7HiKswnDBUJ8", process.env.PAYPAL_PASSWORD_PROD),
    subscriptionCollectionName: `subscriptions-prod`,
    planId: undefined // todo create plan for prod

  }
};

async function requestAccessTokenClient(clientId, secret_key) {
  // console.log("Requesting access token", config);
  // const basic_auth = `${config.clientId}:${config.secret_key()}`;
  const basic_auth = `${clientId}:${secret_key}`;
  console.log(`Access Token: ${basic_auth}`);
  // todo we also have to use a different url for prod
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
  // example value:
  // {"status":"APPROVAL_PENDING","id":"I-XKCLA5KDLLK3","create_time":"2024-12-09T20:08:32Z","links":[{"href":"https://www.sandbox.paypal.com/webapps/billing/subscriptions?ba_token=BA-41P21132UV5106118","rel":"approve","method":"GET"},{"href":"https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-XKCLA5KDLLK3","rel":"edit","method":"PATCH"},{"href":"https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-XKCLA5KDLLK3","rel":"self","method":"GET"}]}
  const linkStuff = await (await fetch("https://api-m.sandbox.paypal.com/v1/billing/subscriptions", {
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
  if (!linkStuff.links) {
    console.log("Link stuff mismatch", { linkStuff });
  }

  // extract the link that is used to approve the subscription
  return linkStuff.links.filter(
    (link) => link.rel === "approve"
  )[0].href;
}

// use for client request
function getConfigFromClientRequest(request) {
  const clientId = request.body?.data?.client_id;
  if (!clientId) {
    return undefined;
  }
  const config = clientIds[clientId];
  if (!config) {
    return config;
  }
  config.origin = request.get("origin");
  return config;
}

// use for server requests
function getConfigForEnv(isDev = false) {
  console.log(Object.entries(clientIds));
  return Object.entries(clientIds).find(([_, value]) => value.env === (isDev ? "dev" : "prod"))[1];
}

module.exports = { showSubscriptions, getSubscriptionLink, getConfigFromClientRequest, getConfigForEnv };
