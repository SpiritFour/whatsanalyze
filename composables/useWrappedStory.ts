import { computed, onBeforeUnmount, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { useStatsStore } from "~/stores/wrapped/stats";
import { analyticsWrapped } from "~/composables/useAnalytics";
import { getTargetYear } from "~/utils/wrapped/dateUtils";
import type { HighlightPerson, RoleId } from "~/utils/wrapped/parsing/types";
import {
  CARD_EXTENSION,
  type CardSpec,
  renderCard,
  saveImage,
  shareImage,
} from "~/utils/wrapped/shareCard";
import {
  asEmoji,
  formatCount,
  formatDay,
  formatHour,
  initial,
  shortName,
  useStoryControls,
} from "~/utils/wrapped/story";

export const ROLE_EMOJI: Record<RoleId, string> = {
  nightOwl: "🦉",
  earlyBird: "🐦",
  novelist: "📚",
  minimalist: "🤏",
  speedster: "⚡",
  ghost: "👻",
  starter: "🚀",
  emojiPoet: "🎭",
  machineGun: "🔥",
  interrogator: "🕵️",
  comedian: "😂",
  paparazzi: "📸",
};

export interface StoryPerson extends HighlightPerson {
  /** The name as the slides print it. */
  short: string;
}

export type CardKind = "summary" | "age" | "roles" | "sync";

// One switch for every card of a story: whoever hides the names on the
// closing slide means the texting-age card too.
const hideNames = ref(false);

/**
 * What every slide of the story reads: the analysis, the people in it under
 * names short enough to print big, and the numbers in the reader's format.
 */
export function useWrappedStory() {
  const statsStore = useStatsStore();
  const { result } = storeToRefs(statsStore);
  const { t, locale } = useI18n();

  const highlights = computed(() => result.value?.getHighlights ?? null);

  const people = computed<StoryPerson[]>(() => {
    const list = highlights.value?.people ?? [];
    const shorts = list.map((person) => shortName(person.name));
    // Two Annas: first names alone would not say who is who.
    const clash = new Set(
      shorts.filter((name, index) => shorts.indexOf(name) !== index),
    );
    return list.map((person, index) => {
      const full = person.name.replace(/‎/g, "").trim();
      const short = clash.has(shorts[index])
        ? full.length > 18
          ? `${full.slice(0, 17)}…`
          : full
        : shorts[index];
      return {
        ...person,
        short,
        topEmoji: person.topEmoji ? asEmoji(person.topEmoji) : null,
        ageEmoji: person.ageEmoji ? asEmoji(person.ageEmoji) : null,
      };
    });
  });

  /** The chat's most used emoji, most used first. */
  const topEmojis = computed(() =>
    (result.value?.getMostUsedEmojis.globalTop5Emojis ?? []).map((entry) => ({
      ...entry,
      emoji: asEmoji(entry.emoji),
    })),
  );

  /** Everyone who wrote, for a story shared before highlights existed too. */
  const names = computed(() =>
    people.value.length
      ? people.value.map((person) => person.short)
      : statsStore.getAuthors.map(shortName),
  );

  const peopleCount = computed(
    () => highlights.value?.peopleCount ?? names.value.length,
  );
  const isGroup = computed(() => peopleCount.value > 2);
  const year = computed(() => highlights.value?.year ?? getTargetYear());

  const fmt = (value: number) => formatCount(value, locale.value);
  const day = (value?: string | null, month: "long" | "short" = "long") =>
    formatDay(value, locale.value, month);
  const hour = (value: number) => formatHour(value, locale.value);

  /** "under a minute", "6 min", "2 h": how long a reply takes. */
  const duration = (minutes: number) => {
    if (minutes < 1) return t("results.story.time.underMinute");
    if (minutes < 90) {
      return t("results.story.time.minutes", { count: Math.round(minutes) });
    }
    if (minutes < 48 * 60) {
      return t("results.story.time.hours", {
        count: Math.round(minutes / 60),
      });
    }
    return t("results.story.time.days", {
      count: Math.round(minutes / (24 * 60)),
    });
  };

  /** "3:47 AM", "03:47": a time of day as the reader's language writes it. */
  const clock = (hourOfDay: number, minute: number) =>
    new Intl.DateTimeFormat(locale.value, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(2026, 0, 1, hourOfDay, minute));

  /** "Emma & Leo", or how many people for a group. */
  const chatTitle = (mask = false) => {
    const shown = mask ? names.value.map(initial) : names.value;
    if (isGroup.value) {
      return t("results.story.cover.group", { count: peopleCount.value });
    }
    return shown.slice(0, 2).join(" & ");
  };

  const ageReasons = (person: StoryPerson) =>
    person.ageReasons
      .map((id) =>
        t(`results.story.age.reasons.${id}`, {
          emoji: person.ageEmoji ?? person.topEmoji ?? "😂",
        }),
      )
      .join(" · ");

  const roleTitle = (id: RoleId) => t(`results.story.roles.list.${id}.title`);
  // The two roles about reply time quote it as a time ("6 min", "2 h").
  const roleLine = (id: RoleId, value: number) =>
    t(`results.story.roles.list.${id}.line`, {
      value:
        id === "speedster" || id === "ghost" ? duration(value) : fmt(value),
    });

  return {
    result,
    highlights,
    people,
    topEmojis,
    names,
    peopleCount,
    isGroup,
    year,
    t,
    locale,
    fmt,
    day,
    hour,
    clock,
    duration,
    chatTitle,
    ageReasons,
    roleTitle,
    roleLine,
    hideNames,
  };
}

/**
 * The share image for one slide, rendered ahead of the tap: Safari only
 * opens the share sheet straight from a gesture, with nothing awaited first.
 */
export function useWrappedCard(kind: CardKind) {
  const story = useWrappedStory();
  const { t, highlights, people, year, fmt, hideNames } = story;
  const runtimeConfig = useRuntimeConfig();
  const controls = useStoryControls();

  const image = ref<Blob | null>(null);
  const previewUrl = ref("");
  const status = ref<"" | "shared" | "saved" | "failed">("");
  const busy = ref(false);

  const host = computed(() => {
    try {
      return new URL(String(runtimeConfig.public.baseUrl)).host;
    } catch {
      return "whatsanalyze.com";
    }
  });

  const shown = (person: StoryPerson) =>
    hideNames.value ? initial(person.name) : person.short;

  const spec = computed<CardSpec | null>(() => {
    const data = highlights.value;
    if (!data) return null;
    const base = {
      eyebrow: `WhatsApp Wrapped ${year.value}`,
      title: story.chatTitle(hideNames.value),
      footer: t("results.story.card.footer"),
      url: `${host.value}/wrapped`,
    };

    if (kind === "age") {
      const aged = people.value.filter((person) => person.age !== null);
      if (!aged.length) return null;
      return {
        ...base,
        theme: "sunset",
        eyebrow: `${t("results.story.age.eyebrow")} · Wrapped ${year.value}`,
        title: t("results.story.age.title"),
        rows: aged.slice(0, 4).map((person) => ({
          title: shown(person),
          value: String(person.age),
          note: story.ageReasons(person),
        })),
      };
    }

    if (kind === "roles") {
      const cast = people.value.filter((person) => person.role);
      if (!cast.length) return null;
      return {
        ...base,
        theme: "violet",
        eyebrow: `${t("results.story.roles.eyebrow")} · Wrapped ${year.value}`,
        rows: cast.slice(0, 4).map((person) => ({
          emoji: ROLE_EMOJI[person.role!.id],
          title: story.roleTitle(person.role!.id),
          note: `${shown(person)} · ${story.roleLine(person.role!.id, person.role!.value)}`,
        })),
      };
    }

    if (kind === "sync") {
      const chemistry = data.chemistry;
      if (!chemistry) return null;
      const order = [
        "balance",
        "starts",
        "reply",
        "laughs",
        "presence",
      ] as const;
      return {
        ...base,
        theme: "mint",
        eyebrow: `${t("results.story.chemistry.eyebrow")} · Wrapped ${year.value}`,
        hero: {
          value: `${chemistry.score}%`,
          label: t("results.story.chemistry.unit"),
        },
        tiles: order
          .filter((id) => chemistry.parts[id] !== null)
          .slice(0, 4)
          .map((id) => ({
            label: t(`results.story.chemistry.parts.${id}`),
            value: `${chemistry.parts[id]}%`,
          })),
      };
    }

    const top = people.value[0];
    const ages = people.value
      .filter((person) => person.age !== null)
      .slice(0, 2)
      .map((person) => `${shown(person)} ${person.age}`)
      .join(" · ");
    const tiles = [
      {
        label: t("results.story.card.tiles.daysTalked"),
        value: fmt(data.totals.daysActive),
      },
      ...(data.totals.topEmoji
        ? [
            {
              label: t("results.story.card.tiles.topEmoji"),
              value: asEmoji(data.totals.topEmoji),
            },
          ]
        : []),
      // Two people get how in sync they are; a group, when it talks most.
      data.chemistry
        ? {
            label: t("results.story.card.tiles.sync"),
            value: `${data.chemistry.score}%`,
          }
        : {
            label: t("results.story.card.tiles.peakHour"),
            value: story.hour(data.peakHour),
          },
      {
        label: t("results.story.card.tiles.streak"),
        value: t("results.story.card.tiles.streakValue", {
          count: fmt(data.streak.days),
        }),
      },
      ...(top && people.value.length > 1
        ? [
            {
              label: t("results.story.card.tiles.topTexter"),
              value: `${shown(top)} ${Math.round(top.share * 100)}%`,
            },
          ]
        : []),
      ...(ages
        ? [{ label: t("results.story.card.tiles.textingAge"), value: ages }]
        : []),
    ];
    return {
      ...base,
      theme: "ink",
      hero: {
        value: fmt(data.totals.messages),
        label: t("results.story.card.messages"),
      },
      tiles,
    };
  });

  let renderId = 0;
  const render = async () => {
    const current = ++renderId;
    if (!import.meta.client || !spec.value) return;
    try {
      const blob = await renderCard(spec.value);
      if (current !== renderId) return;
      image.value = blob;
      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = URL.createObjectURL(blob);
    } catch (error) {
      console.error("Could not draw the share card", error);
      image.value = null;
    }
  };
  watch(spec, render, { immediate: true });
  onBeforeUnmount(() => {
    renderId += 1;
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  });

  const fileName = computed(
    () => `whatsapp-wrapped-${year.value}-${kind}.${CARD_EXTENSION}`,
  );
  const shareText = computed(
    () =>
      `${t("results.story.finale.shareText", { year: year.value })} https://${host.value}/wrapped/`,
  );

  const share = async () => {
    if (!image.value) {
      status.value = "failed";
      return;
    }
    busy.value = true;
    status.value = "";
    // The story waits while the share sheet is up, so the slide being shared
    // is still there when it closes.
    controls.pause("share");
    try {
      const outcome = await shareImage(
        image.value,
        fileName.value,
        shareText.value,
      );
      if (outcome === "cancelled") return;
      status.value = outcome;
      analyticsWrapped.cardShared(
        kind,
        outcome === "shared" ? "native" : "download",
      );
    } catch (error) {
      console.error("Could not share the card", error);
      status.value = "failed";
    } finally {
      busy.value = false;
      controls.resume("share");
    }
  };

  const save = () => {
    if (!image.value) {
      status.value = "failed";
      return;
    }
    saveImage(image.value, fileName.value);
    status.value = "saved";
    analyticsWrapped.cardShared(kind, "download");
  };

  const statusText = computed(() =>
    status.value === "saved"
      ? t("results.story.card.saved")
      : status.value === "failed"
        ? t("results.story.card.failed")
        : "",
  );

  return {
    ready: computed(() => !!image.value),
    previewUrl,
    busy,
    share,
    save,
    statusText,
  };
}
