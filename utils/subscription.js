export const getSubscriptionParams = () => {
  // query
  const queryParams = new URLSearchParams(window.location.search);
  const id = queryParams.get("subscription_id");

  if (id) return { id, email: null };

  // local Storage
  const subscription = JSON.parse(localStorage.getItem("subscription") ?? "");

  return { email: subscription.email, id: subscription.subscriptionId };
};
