<template>
<div>
  <button @click="send()">NEW</button>
</div>
</template>


<script>
export default {
  name: "Subscriptions",
  data() {
    return {};
  },
  head() {
    return {};
  },
  methods: {
    async requestAccessToken() {
        const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa('HOHO') // encode the credentials
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials'
          })
        });
        return await response.json();
    },
    async createProduct(accessToken, productId) {
      return await fetch('https://api-m.sandbox.paypal.com/v1/catalogs/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'PayPal-Request-Id': productId,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ "name": "Whatsanalyze Plan",  "type": "SERVICE", "image_url": "https://example.com/streaming.jpg", "home_url": "https://example.com/home" })
      });
    },
    async createPlan(accessToken, product_id) {
      return await fetch('https://api-m.sandbox.paypal.com/v1/billing/plans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          product_id,
          "name":"Whatsanalyze Plan",
          "billing_cycles":[
            {
              "frequency":{
                "interval_unit":"MONTH",
                "interval_count":1
              },
              "tenure_type":"REGULAR",
              "sequence":1,
              "pricing_scheme":{
                "fixed_price":{
                  "value":"15",
                  "currency_code":"EUR"
                }
              }
            },
          ],
          "payment_preferences":{
            "auto_bill_outstanding":true,
            "setup_fee_failure_action":"CONTINUE",
            "payment_failure_threshold":3
          },
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
    },
    async showSubscriptions(accessToken, subscriptionId) {
      const response = await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return response.json()
    },
    async getSubscriptionLink(accessToken, plan_id="P-28458220JT356632KM5K5HJI") {
      fetch('https://api-m.sandbox.paypal.com/v1/billing/subscriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.access_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
            plan_id,
            "application_context": {
              "cancel_url": "https://www.example.com/cancel",
              "return_url": "https://www.example.com/return",
            }

          }
        )
      })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error:', error));
    },
    async send() {
      const accessToken = await this.requestAccessToken();

      const subscribtionInfo = await this.showSubscriptions(accessToken, "I-P0VEY0VB8M9A");
      console.log(subscribtionInfo)
    }
  }
}
</script>

<style scoped>
#paypal-button-container {
  width: 150px;
}
</style>
