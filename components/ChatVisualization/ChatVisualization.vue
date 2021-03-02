<template>
  <div>
    <ChatVisualizationPayment
      @onCreateOrder="onCreateOrder"
      @onApprove="onApprove"
      @onError="onError"
      currency="EUR"
      :amount="10"
    />
  </div>
</template>

<script>
export default {
  name: "ChatVisualization",
  methods: {
    onCreateOrder(data, actions) {
      console.log("order created", data, actions);
    },
    onApprove(event) {
      console.log("approved", event);
    },
    onError(event) {
      console.log("error", event);
    },
  },
};
</script>

<style scoped></style>
