import { logEvent } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";

export const useAnalytics = () => {
  const nuxtApp = useNuxtApp();
  const analytics = nuxtApp.$analytics as Analytics | undefined;

  const trackEvent = (
    eventName: string,
    params?: Record<string, string | number | boolean>
  ) => {
    if (!analytics) {
      return;
    }
    try {
      logEvent(analytics, eventName, params);
    } catch (error) {
      console.error("Failed to track event:", eventName, error);
    }
  };

  const trackPageView = (pagePath: string, pageTitle?: string) => {
    trackEvent("page_view", {
      page_path: pagePath,
      page_title: pageTitle || (typeof document !== "undefined" ? document.title : ""),
    });
  };

  const trackFileUpload = (fileType: string) => {
    trackEvent("file_upload", { file_type: fileType });
  };

  const trackAnalysisComplete = (messageCount: number) => {
    trackEvent("analysis_complete", { message_count: messageCount });
  };

  const trackResultsViewed = (isShared: boolean) => {
    trackEvent("results_viewed", { is_shared: isShared });
  };

  const trackStorySlideViewed = (slideIndex: number, slideName: string) => {
    trackEvent("story_slide_viewed", {
      slide_index: slideIndex,
      slide_name: slideName,
    });
  };

  const trackLanguageChanged = (fromLang: string, toLang: string) => {
    trackEvent("language_changed", {
      from_language: fromLang,
      to_language: toLang,
    });
  };

  const trackSubscriptionStarted = (source: string) => {
    trackEvent("subscription_started", { source });
  };

  const trackSubscriptionCompleted = (method: string) => {
    trackEvent("subscription_completed", { payment_method: method });
  };

  const trackSubscriptionCanceled = () => {
    trackEvent("subscription_canceled");
  };

  const trackShareCreated = (method: string) => {
    trackEvent("share_created", { share_method: method });
  };

  const trackPaywallShown = () => {
    trackEvent("paywall_shown");
  };

  return {
    trackEvent,
    trackPageView,
    trackFileUpload,
    trackAnalysisComplete,
    trackResultsViewed,
    trackStorySlideViewed,
    trackLanguageChanged,
    trackSubscriptionStarted,
    trackSubscriptionCompleted,
    trackSubscriptionCanceled,
    trackShareCreated,
    trackPaywallShown,
  };
};
