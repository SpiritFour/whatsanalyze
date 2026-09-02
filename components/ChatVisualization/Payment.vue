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
  mounted() {
    this.loadPayPalScript();
  },
  methods: {
    loadPayPalScript() {
      if (window.paypal) {
        this.initPayPalButton(this);
        return;
      }

      const script = document.createElement("script");
      script.id = "paypal-sdk";
      script.src =
        "https://www.paypal.com/sdk/js?currency=" +
        this.currency +
        "&client-id=" +
        this.$config.paypalClientId;
      script.defer = true;
      script.addEventListener("load", () => this.initPayPalButton(this), {
        once: true,
      });
      document.head.appendChild(script);
    },
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
