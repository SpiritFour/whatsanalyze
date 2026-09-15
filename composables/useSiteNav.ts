import { computed } from "vue";

export interface SiteNavLink {
  to: string;
  title: string;
  text: string;
  icon: string;
  /** Icon colour on a dark surface. */
  color: string;
  /** Tinted background behind the icon. */
  bg: string;
}

/**
 * The tool catalogue, in one place.
 *
 * The header dropdown, the /tools hub and the footer all listed these by hand
 * and drifted apart — same tools, different order, different accent colours.
 * They read from here now, so a new tool shows up everywhere at once.
 */
export function useToolsNav() {
  const { t } = useI18n();
  const localePath = useLocalePath();

  const analyticsTools = computed<SiteNavLink[]>(() => [
    {
      to: localePath("/tools/inactivity"),
      title: t("toolsHub.toolInactivityTitle"),
      text: t("toolsHub.toolInactivityText"),
      icon: "mdi-timer-sand",
      color: "#21a68d",
      bg: "rgba(33, 166, 141, 0.15)",
    },
    {
      to: localePath("/tools/message-counter"),
      title: t("toolsHub.toolCounterTitle"),
      text: t("toolsHub.toolCounterText"),
      icon: "mdi-counter",
      color: "#fbbf24",
      bg: "rgba(251, 191, 36, 0.15)",
    },
    {
      to: localePath("/tools/word-counter"),
      title: t("toolsHub.toolVocabularyTitle"),
      text: t("toolsHub.toolVocabularyText"),
      icon: "mdi-format-letter-case",
      color: "#c084fc",
      bg: "rgba(192, 132, 252, 0.15)",
    },
    {
      to: localePath("/tools/chat-heatmap"),
      title: t("toolsHub.toolHeatmapTitle"),
      text: t("toolsHub.toolHeatmapText"),
      icon: "mdi-clock-time-four-outline",
      color: "#38bdf8",
      bg: "rgba(56, 189, 248, 0.15)",
    },
  ]);

  const courtTools = computed<SiteNavLink[]>(() => [
    {
      to: localePath("/tools/court-evidence"),
      title: t("toolsHub.toolCourtTitle"),
      text: t("toolsHub.toolCourtText"),
      icon: "mdi-scale-balance",
      color: "#818cf8",
      bg: "rgba(129, 140, 248, 0.15)",
    },
    {
      to: localePath("/tools/proof-of-relationship"),
      title: t("toolsHub.toolRelationshipTitle"),
      text: t("toolsHub.toolRelationshipText"),
      icon: "mdi-heart-outline",
      color: "#fb7185",
      bg: "rgba(251, 113, 133, 0.15)",
    },
  ]);

  const allTools = computed(() => [
    ...analyticsTools.value,
    ...courtTools.value,
  ]);

  return { analyticsTools, courtTools, allTools };
}
