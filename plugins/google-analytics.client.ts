import { useScript } from "#imports";
import {
  contentGroupFor,
  GA_MEASUREMENT_ID,
  setContentGroup,
} from "~/composables/useAnalytics";

/**
 * Loads GA4 and tags page views and events with the product they belong to
 * (GA4 Content group: wrapped / tools / analyzer), so every report can be
 * split by it. The landing page's group rides on the one `config` that sends
 * its page_view; a later `config` call would reset it, which is why this
 * owns the bootstrap instead of @nuxt/scripts' registry.
 */
export default defineNuxtPlugin(() => {
  if (useRuntimeConfig().public.local) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer?.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    content_group: contentGroupFor(window.location.pathname),
  });

  useScript(
    `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`,
    {
      trigger: "onNuxtReady",
    },
  );

  // Before the navigation commits, so the page_view that follows carries it.
  useRouter().beforeResolve((to, from) => {
    if (to.path !== from.path) setContentGroup(to.path);
  });
});
