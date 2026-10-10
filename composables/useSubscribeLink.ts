import { computed } from "vue";

/**
 * The link to /subscribe, carrying the page it was followed from, so a new
 * subscriber is sent back there (pages/subscribe.vue). The path only: a
 * query string can hold anything, and on /s the fragment holds a share key.
 */
export function useSubscribeLink() {
  const localePath = useLocalePath();
  const route = useRoute();
  return computed(() =>
    localePath({ path: "/subscribe", query: { from: route.path } }),
  );
}
