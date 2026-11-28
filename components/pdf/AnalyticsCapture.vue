<template>
  <!-- The analysis page's own cards, drawn off screen for the PDF: the same
       components, so the PDF shows exactly what the analyzer shows. Only
       mounted while a PDF is being made. -->
  <Teleport to="body">
    <div v-if="chat" ref="root" class="pdf-capture" aria-hidden="true" inert>
      <div class="pdf-capture__page wa-scope">
        <div data-pdf-card="timeline">
          <ChartsCard
            :title="$t('chatTimeline')"
            :subtitle="$t('messagesPerDay')"
          >
            <div class="h-[300px]">
              <ChartsLineChart :chartdata="chat" />
            </div>
          </ChartsCard>
        </div>

        <div data-pdf-card="stats">
          <ChartsTextStats :chat="chat" />
        </div>

        <!-- Each highlight is a row of its own, like the other cards. -->
        <div data-pdf-split class="pdf-capture__column">
          <HighlightsSection :chat="chat" :exclude="['overview']" />
        </div>

        <div data-pdf-card="fun-facts">
          <ChartsCard title="Fun Facts">
            <ChartsFunFacts :chartdata="chat" />
          </ChartsCard>
        </div>

        <div data-pdf-card="person-hour" class="pdf-capture__row">
          <ChartsCard
            :title="$t('person')"
            :subtitle="`${$t('messagesPer')} ${$t('person')}`"
          >
            <div class="mx-auto max-w-[360px]">
              <ChartsDonughtChart
                :chartdata="chat"
                :center-label="$t('messages')"
              />
            </div>
          </ChartsCard>
          <ChartsCard
            :title="$t('timeOfDay')"
            :subtitle="`${$t('messagesPer')} ${$t('hour')}`"
          >
            <div class="h-[300px]">
              <ChartsBarChart :chartdata="chat" data-grouping="hourly" />
            </div>
          </ChartsCard>
        </div>

        <div data-pdf-card="month-weekday" class="pdf-capture__row">
          <ChartsCard
            :title="$t('month')"
            :subtitle="`${$t('messagesPer')} ${$t('month')}`"
          >
            <div class="mx-auto max-w-[420px]">
              <ChartsRadarChart :chartdata="chat" data-grouping="weekly" />
            </div>
          </ChartsCard>
          <ChartsCard
            :title="$t('weekday')"
            :subtitle="`${$t('messagesPer')} ${$t('weekday')}`"
          >
            <div class="mx-auto max-w-[420px]">
              <ChartsRadarChart :chartdata="chat" data-grouping="daily" />
            </div>
          </ChartsCard>
        </div>

        <div data-pdf-card="words">
          <ChartsCard :title="$t('wordCloud')">
            <template v-if="liveClouds">
              <img
                v-if="cloudPictures.words"
                class="pdf-capture__cloud h-[320px]"
                :src="cloudPictures.words"
                alt=""
              />
              <div v-else class="h-[320px]"></div>
            </template>
            <ChartsWordCloud v-else :chartdata="chat" quick class="h-[320px]" />
          </ChartsCard>
        </div>

        <div data-pdf-card="emojis">
          <ChartsCard title="Emojis">
            <template v-if="liveClouds">
              <img
                v-if="cloudPictures.emojis"
                class="pdf-capture__cloud h-[260px]"
                :src="cloudPictures.emojis"
                alt=""
              />
              <div v-else class="h-[260px]"></div>
            </template>
            <ChartsEmojiCloud
              v-else
              :chartdata="chat"
              quick
              class="h-[260px]"
            />
          </ChartsCard>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { markRaw, nextTick, shallowRef } from "vue";
import html2canvas from "html2canvas";
import {
  SVG_CHART_CLASS,
  applySvgChartSnapshots,
  snapshotSvgCharts,
} from "~/utils/svgImage";

/**
 * capture({ chat, background }) renders the cards, waits for them to settle,
 * and returns one JPEG per row: [{ dataUrl, width, height }]. `background`
 * fills around the cards' rounded corners, so it should be the PDF page's
 * colour. An empty list means the capture failed; the PDF then falls back to
 * its own analysis pages (utils/pdf/chatAnalysis.ts).
 */

const props = defineProps({
  /**
   * Where the page already shows the clouds, laid out ({ words, emojis }:
   * selectors of their cards): the analyzer. Their pictures are used then,
   * instead of laying the same clouds out again, which took seconds there.
   */
  liveClouds: { type: Object, default: null },
});

const chat = shallowRef(null);
const cloudPictures = shallowRef({ words: "", emojis: "" });

/** The page's own clouds, as amCharts exports them. */
async function pictureLiveClouds() {
  const live = (selector) =>
    document.querySelector(`${selector} .${SVG_CHART_CLASS}`);
  // A visitor can click before the page's own clouds have finished.
  await settledClouds(() =>
    [live(props.liveClouds.words), live(props.liveClouds.emojis)].filter(
      Boolean,
    ),
  );
  const picture = async (selector) => {
    const cloud = live(selector);
    try {
      return (await cloud?.exportChartImage?.()) || "";
    } catch {
      return "";
    }
  };
  cloudPictures.value = {
    words: await picture(props.liveClouds.words),
    emojis: await picture(props.liveClouds.emojis),
  };
  await nextTick();
  await Promise.all(
    Array.from(root.value?.querySelectorAll(".pdf-capture__cloud") || []).map(
      (image) => image.decode?.().catch(() => undefined),
    ),
  );
}
const root = shallowRef(null);

/** Chart.js animates for 500 ms (utils/chartTheme.js); give it room. */
const CHART_SETTLE_MS = 900;
/** amCharts loads on demand and lays its clouds out over many frames. */
const CLOUD_TIMEOUT_MS = 15000;
/** A cloud whose drawing has not changed for this long is finished. */
const STABLE_MS = 500;
/** Its data arrives a moment after it mounts: never call it done sooner. */
const MIN_CLOUD_MS = 600;
const POLL_MS = 100;
/** 2× on a ~1000 px wide layout: sharp on paper, a few hundred kB a row. */
const SCALE = 2;
const QUALITY = 0.85;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Until every cloud has stopped changing. amCharts places a cloud's words
 * over many frames and then fades them in; its "arranged" event does not
 * always come (an empty cloud never says it is done), and waiting for it
 * cost up to 20 s a PDF. A drawing that has not changed for STABLE_MS is
 * finished, words or no words.
 */
async function cloudsReady(element) {
  await settledClouds(() =>
    Array.from(element.querySelectorAll(`.${SVG_CHART_CLASS}`)),
  );
}

/** Until the clouds `clouds()` returns have all stopped changing. */
async function settledClouds(clouds) {
  const started = Date.now();
  let last = "";
  let stableSince = Date.now();
  while (Date.now() - started < CLOUD_TIMEOUT_MS) {
    const all = clouds();
    // amCharts loads on demand: first the clouds have to exist.
    const loaded = all.every(
      (cloud) => typeof cloud.exportChartImage === "function",
    );
    const drawing = all.map((cloud) => cloud.innerHTML).join("|");
    if (drawing !== last) {
      last = drawing;
      stableSince = Date.now();
    } else if (
      loaded &&
      Date.now() - stableSince >= STABLE_MS &&
      Date.now() - started >= MIN_CLOUD_MS
    ) {
      return;
    }
    await wait(POLL_MS);
  }
}

/**
 * The rows to cut out, in page order: every [data-pdf-card], and every card
 * inside a [data-pdf-split], looking through wrappers that take no box of
 * their own (HighlightsSection's root is `display: contents`).
 */
function cardsIn(page) {
  const cards = [];
  const expand = (element) => {
    for (const child of element.children) {
      if (getComputedStyle(child).display === "contents") expand(child);
      else cards.push(child);
    }
  };
  for (const element of page.querySelectorAll(
    "[data-pdf-card], [data-pdf-split]",
  )) {
    if (element.hasAttribute("data-pdf-split")) expand(element);
    else cards.push(element);
  }
  return cards;
}

/**
 * One picture of all the cards, cut into one per card. html2canvas copies
 * the whole document for every capture, and on the analyzer that holds the
 * entire chat: a capture per card took a second each. Everything outside
 * the cards (and outside <head>, for the styles) is left out of that copy.
 */
async function captureAll(element, background) {
  const page = element.querySelector(".pdf-capture__page");
  const snapshots = await snapshotSvgCharts(page);
  const canvas = await html2canvas(page, {
    scale: SCALE,
    logging: false,
    useCORS: true,
    backgroundColor: background,
    ignoreElements: (node) =>
      !(
        node.contains(page) ||
        page.contains(node) ||
        node.ownerDocument.head.contains(node)
      ),
    onclone: (clonedDoc) => {
      applySvgChartSnapshots(
        clonedDoc.querySelector(".pdf-capture__page"),
        snapshots,
      );
    },
  });

  const origin = page.getBoundingClientRect();
  const images = [];
  for (const card of cardsIn(page)) {
    const box = card.getBoundingClientRect();
    // A card with nothing in it (no highlights for a tiny chat) takes no
    // slot in the PDF.
    if (!box.width || !box.height) continue;
    const cut = document.createElement("canvas");
    cut.width = Math.round(box.width * SCALE);
    cut.height = Math.round(box.height * SCALE);
    cut
      .getContext("2d")
      .drawImage(
        canvas,
        Math.round((box.left - origin.left) * SCALE),
        Math.round((box.top - origin.top) * SCALE),
        cut.width,
        cut.height,
        0,
        0,
        cut.width,
        cut.height,
      );
    images.push({
      dataUrl: cut.toDataURL("image/jpeg", QUALITY),
      width: box.width,
      height: box.height,
    });
  }
  return images;
}

/** The chat the cards were last drawn for, and when they finished. */
let drawnFor = null;
let settled = null;

/** Draw the cards for `source` and wait until they have settled. */
function draw(source) {
  if (drawnFor === source && settled) return settled;
  drawnFor = source;
  chat.value = source ? markRaw(source) : null;
  if (!source) return (settled = null);
  const attempt = (settled = (async () => {
    await nextTick();
    await wait(CHART_SETTLE_MS);
    if (root.value) await cloudsReady(root.value);
  })());
  return attempt;
}

/**
 * Drawing the cards takes seconds (the clouds place their words one by
 * one), so a page can start it ahead of time with `warm(chat)`: the tool
 * when a chat is loaded, the analyzer when its download comes into view.
 * capture() then only takes the picture. Without a warm-up it draws first.
 */
function warm(source) {
  void draw(source);
}

async function capture({ chat: source, background = "#ffffff" }) {
  const warmed = drawnFor === source;
  try {
    await draw(source);
    if (!root.value) return [];
    if (props.liveClouds) await pictureLiveClouds();
    return await captureAll(root.value, background);
  } catch (error) {
    console.error("Could not capture the analysis for the PDF", error);
    return [];
  } finally {
    // Not warmed up for: no reason to keep the charts around.
    if (!warmed) draw(null);
  }
}

defineExpose({ capture, warm });
</script>

<style scoped>
/* Off screen, not hidden: hidden charts are never laid out or drawn. The
   width is the analysis page's own, so the cards look as they do there. */
.pdf-capture {
  position: fixed;
  top: 0;
  left: -20000px;
  pointer-events: none;
}

.pdf-capture__page {
  width: 1000px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: transparent;
}

.pdf-capture__column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pdf-capture__cloud {
  display: block;
  width: 100%;
  object-fit: contain;
}

.pdf-capture__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
</style>
