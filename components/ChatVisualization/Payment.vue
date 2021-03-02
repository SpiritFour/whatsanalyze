<template>
  <div id="smart-button-container">
    <div style="text-align: center">
      <div id="paypal-button-container"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Payment",
  head() {
    return {
      title: "Payment Page - My awesome project",
      script: [
        {
          hid: "paypal",
          src:
            "https://www.paypal.com/sdk/js?currency=EUR&client-id=" +
            // eslint-disable-next-line no-undef
            process.env.paypalClientId,
          dataSdkIntegrationSource: "button-factory",
          defer: true,
          // Changed after script load
          callback: () => {
            // paypal.Buttons().render("#paypal-button-container");
            this.initPayPalButton();
          },
        },
      ],
    };
  },
  methods: {
    initPayPalButton() {
      // eslint-disable-next-line no-undef
      paypal
        .Buttons({
          style: {
            shape: "rect",
            color: "black",
            layout: "vertical",
            label: "pay",
          },

          createOrder: function (data, actions) {
            return actions.order.create({
              purchase_units: [
                {
                  description:
                    "WhatsApp chat exported, visualized and analyzed as PDF",
                  amount: { currency_code: "EUR", value: 1 },
                },
              ],
            });
          },

          onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
              alert(
                "Transaction completed by " +
                  details.payer.name.given_name +
                  "!"
              );
            });
          },

          onError: function (err) {
            console.log(err);
          },
        })
        .render("#paypal-button-container");
    },
  },
};
</script>

<style scoped></style>
