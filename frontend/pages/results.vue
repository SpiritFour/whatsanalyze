<template>
  <!--  <MorphSvg :from-path="star" :to-path="heart" class="h-80 w-80"/>-->

  <!-- black bg-->
  <!--  <div>-->
  <!--    Whatsapp warpped-->
  <!--    Hello author 1 author 2-->

  <!--    iPhone sceen sith start of chat text. animates form complete dark bg into opening whatsapp-->

  <!--    scrolling down shuts down iphone again into black-->
  <!--  </div>-->

  <!--  &lt;!&ndash; black bg&ndash;&gt;-->
  <!--  <div>-->
  <!--    Take a closer look.-->

  <!--    - Zahlen klappen sich 3d um / drehen sich um sich-->
  <!--    - zahlen haben outline und werden dann angeleuchtet-->
  <!--    - getippt-->

  <!--  </div>-->

  <!--  <div>-->

  <!--  </div>-->

  <!--  &lt;!&ndash; colorful eye catcher area with some stats and big animation&ndash;&gt;-->
  <!--  graph of chat frequency per week builds up from left to right (line graph)-->
  <!--  interactive shows time/date of longest message, longes emojie message and longest time of no chat-->

  <!--  <div>-->
  <!--    small stats in columns (blend in) below colorful animation-->
  <!--  </div>-->

  <!--  <div>-->
  <!--    Must used words appear like shot onto the page (like a canon)-->

  <!--    maybe one of each chat partner at the same time-->

  <!--  </div>-->

  <!--  <div>-->

  <!--    most used emojies animation:-->
  <!--    1. all emojies floating around in the middle-->
  <!--    2. scrolling takes emojies apart and shows number of usages-->
  <!--  </div>-->

  <div>
    <Lines v-if="data">
      <template v-slot:1>
        <div>
          <h2>
            <strong> Most Emojies </strong>
          </h2>
          <div class="flex">
            <div
              v-for="(authorData, author) in data.getMostUsedEmojis.authors"
              :key="author"
              class="flex my-8 p-8"
            >
              <div>
                <div
                  v-for="(emoji, key) in authorData.top5Emojis"
                  :key="key + author"
                  class="flex gap-2 text-4xl font-bold"
                >
                  <div class="p-2 w-40">
                    {{ emoji.emoji }}
                  </div>
                  <div class="text-gray-600">
                    {{ emoji.count }}
                  </div>
                </div>

                <div class="text-2xl font-bold text-green-600 mt-2">
                  Most emoji's in one message
                </div>

                <div class="chat-bubble mt-8">
                  <div class="flex justify-between">
                    <div class="author">
                      {{ author }}
                    </div>
                    <div class="time">
                      {{
                        authorData?.messageWithMostEmojis?.date &&
                        getDate(authorData.messageWithMostEmojis.date)
                      }}
                    </div>
                  </div>

                  <div class="message">
                    {{ authorData?.messageWithMostEmojis?.message }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-slot:2>
        <div>
          <div>
            <h2>Most active Week</h2>
            <strong>
              {{ data.getActiveDates.weekWithMostMessages.week }}
            </strong>
            <h2>
              {{ data.getActiveDates.weekWithMostMessages.count }}
            </h2>
          </div>
          <div>
            <h2>Most active Day</h2>
            <strong>
              {{ data.getActiveDates.dayWithMostMessages.day }}
            </strong>
            <h2>
              {{ data.getActiveDates.dayWithMostMessages.count }}
            </h2>
          </div>
        </div>
      </template>
      <template v-slot:3>
        <div>
          {{ data.getNumberOfMessagesPerMonth }}
        </div>
      </template>
      <template v-slot:4>
        <div class="flex gap-20">
          <div
            v-for="(authorData, author) in data.getRelativeWordUsage.authors"
            :key="author"
            class="p-20"
          >
            <h2>
              {{ author }}
            </h2>
            <div>
              <div
                v-for="word in authorData.top5Words"
                class="flex gap-2 text-xl font-bold"
              >
                <div class="p-2 w-40">
                  {{ word.word }}
                </div>
                {{ word.count }}
              </div>
            </div>

            <div class="">
              Your longest messages are:
              <h3>{{ authorData?.longestMessage?.message.length }}</h3>
              <div class="max-w-[400px] max-h-24 overflow-scroll">
                {{ authorData?.longestMessage?.message }}
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-slot:5>
        <div>
          <h2>Longest <strong>gap</strong> in your chat</h2>
          <h3>
            {{
              (data.getTimeData.longestGap / (1000 * 60 * 60 * 24)).toFixed(1)
            }}
            days
          </h3>

          <p>
            You did not chat from
            {{
              data.getTimeData.longestGapStart &&
              getDate(data.getTimeData.longestGapStart)
            }}
            to
            {{
              data.getTimeData.longestGapEnd &&
              getDate(data.getTimeData.longestGapEnd)
            }}.
          </p>
        </div>
      </template>
    </Lines>
    <!--    todo have proper stuff here? how do we handle this not existing at all?-->
    <div v-else class="flex gap-20">
      Sorry nothing found, but do you wanna load something?
    </div>
    <div class="max-width: 100px;overflow: hidden; text-overflow: ellipsis;">
      {{ share_info }}
    </div>
    <a :href="'results?' + share_info">share</a>
    <br />
    <button @click="save">Save</button>
  </div>
</template>

<script setup lang="ts">
import { useStatsStore } from "~/store/stats";
import { useUserDataStore } from "~/store/userDataStore";
import { parseShareInfo, serializeShareInfo } from "~/utils/sharing/param";

const statsStore = useStatsStore();

const { result } = storeToRefs(statsStore);
const data = result;
// ######## data loading part
const userDataStore = useUserDataStore();

const share_info = ref("");

const save = async () => {
  if (data.value) {
    const link = await userDataStore.saveData(data.value);
    console.log("Shareable Link:", link);
    share_info.value = serializeShareInfo(link);
  } else {
    alert("You did create a chat!");
  }
};

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const uuidParam = urlParams.get("uuid");
  const ivParam = urlParams.get("iv");
  const keyParam = urlParams.get("key");

  if (uuidParam && ivParam && keyParam) {
    try {
      const shareInfo = parseShareInfo(window.location.search);
      console.log("Parsed ShareInfo:", shareInfo);

      // Use userDataStore to load the data using shareInfo
      userDataStore
        .loadData(shareInfo)
        .then((loadedData) => {
          result.value = loadedData;
        })
        .catch((error) => {
          console.error("Error loading data:", error);
        });
    } catch (error) {
      console.error("Failed to parse share info:", error);
    }
  } else {
    console.log("No share info found in URL");
  }
});
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      star: {
        color: "#fff312",
        d: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
      },
      heart: {
        color: "#ff0088",
        d: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 \
        2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09 \
        C13.09 3.81 14.76 3 16.5 3 \
        19.58 3 22 5.42 22 8.5 \
        c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
      },
    };
  },
  methods: {
    getDate(timeString: Date) {
      if (!timeString) return "";
      return `${new Date(timeString).getFullYear()} ${new Date(timeString).getMonth() + 1} ${new Date(timeString).getDay()}`;
    },
  },
});
</script>

<style scoped>
.chat-bubble {
  @apply max-w-md w-fit bg-green-700 bg-opacity-70 p-3 rounded-lg shadow-md flex flex-col;
}

.chat-bubble .author {
  @apply text-sm font-semibold text-gray-800 mb-1;
}

.chat-bubble .time {
  @apply text-xs text-gray-800;
}

.chat-bubble .message {
  @apply text-sm text-gray-900;
}

h2 {
  @apply text-8xl;
}

strong {
  @apply text-orange-500 italic;
}

h3 {
  @apply text-[200px];
}
</style>
