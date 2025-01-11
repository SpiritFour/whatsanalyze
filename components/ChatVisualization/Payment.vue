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
  props: {
    currency: {
      default: "EUR",
      type: String,
    },
    amount: {
      default: 1,
      type: Number,
    },
  },
  data() {
    return {};
  },
  head() {
    return {
      script: [
        {
          hid: "paypal",
          src:
            "https://www.paypal.com/sdk/js?currency=" +
            this.currency +
            "&client-id=" +
            // eslint-disable-next-line no-undef
            this.$config.paypalClientId,
          defer: true,
          // Changed after script load
          callback: () => {
            this.initPayPalButton(this);
          },
        },
      ],
    };
  },
  methods: {
    initPayPalButton(context) {
      // eslint-disable-next-line no-undef
      paypal
        .Buttons({
          style: {
            size: "small",
            shape: "rect",
            color: "black",
            layout: "vertical",
            label: "pay",
          },

          createOrder: function (data, actions) {
            context.$emit("onCreateOrder", data, actions);
            return actions.order.create({
              purchase_units: [
                {
                  description: "WhatsApp chat visualization as PDF",
                  amount: {
                    currency_code: context.currency,
                    value: context.amount,
                  },
                },
              ],
            });
          },

          onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
              context.$emit("onApprove", details);
            });
          },

          onError: function (err) {
            context.$emit("onError", err);
          },
        })
        .render("#paypal-button-container");
    },
  },
};
</script>

<style scoped>
#paypal-button-container {
  width: 150px;
}
</style>
