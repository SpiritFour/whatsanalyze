export const getSubscriptionParams = () => {
  // query
  const queryParams = new URLSearchParams(window.location.search);
  const id = queryParams.get("subscription_id");

  if (id) return { id, email: null };
  const data = localStorage.getItem("subscription");
  // local Storage
  if (!data) return { id: null, email: null };
  const subscription = JSON.parse(data);

  return { email: subscription.email, id: subscription.subscriptionId };
};
