<template>
  <div class="flex justify-center items-center py-16">
    <p class="text-gray-500">Redirecting to subscription management...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useLocalePath } from "#imports";

definePageMeta({
  layout: "wrapped",
});

const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();

onMounted(() => {
  const query = new URLSearchParams();
  if (route.query.token) query.set("token", route.query.token as string);
  if (route.query.subscription_id)
    query.set("subscription_id", route.query.subscription_id as string);
  if (route.query.email) query.set("email", route.query.email as string);
  if (route.query.session_id)
    query.set("session_id", route.query.session_id as string);

  const queryString = query.toString();
  const target = queryString ? `/subscribe?${queryString}` : "/subscribe";
  router.replace(localePath(target));
});
</script>
