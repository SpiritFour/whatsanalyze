<template>

  <!--  <MorphSvg :from-path="star" :to-path="heart" class="h-80 w-80"/>-->
  <div>
    <Lines>
      <template v-slot:1>
        <div>
          <h2>
            <strong>
              Most Emojies
            </strong>
          </h2>
          <div class="flex">
            <div v-for="(authorData, author) in data.emoji?.authors" :key="author" class="flex my-8 p-8">
              <div>
                <div v-for="(emoji, key) in authorData.top5Emojis"
                     :key="key + author"
                     class="flex gap-2 text-4xl font-bold">
                  <div class="p-2 w-40">
                    {{ emoji.emoji }}
                  </div>
                  <div class=" text-gray-600">
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
                      {{ getDate(authorData?.messageWithMostEmojis?.date) }}
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
              {{ data.active?.weekWithMostMessages.week }}
            </strong>
            <h2>
              {{ data.active?.weekWithMostMessages.count }}
            </h2>
          </div>
          <div>
            <h2>Most active Day</h2>
            <strong>
              {{ data.active?.dayWithMostMessages.day }}
            </strong>
            <h2>
              {{ data.active?.dayWithMostMessages.count }}
            </h2>
          </div>
        </div>
      </template>
      <template v-slot:3>
        <div>
          {{ data.messagesPerMonth }}
        </div>
      </template>
      <template v-slot:4>
        <div class="flex gap-20">
          <div v-for="(authorData, author) in data.wordUsage?.authors" :key="author" class="p-20">
            <h2>
              {{ author }}
            </h2>
            <div>
              <div v-for="word in authorData.top5Words" class="flex gap-2 text-xl font-bold">
                <div class="p-2 w-40">
                  {{ word.word }}
                </div>
                {{ word.count }}
              </div>
            </div>

            <div class="">
              Your longest messages are:
              <h3>{{ authorData.longestMessage.message.length }}</h3>
              <div class="max-w-[400px] max-h-24 overflow-scroll">
                {{ authorData.longestMessage.message }}
              </div>
            </div>

          </div>
        </div>
      </template>
      <template v-slot:5>
        <div>
          <h2>Longest <strong>gap</strong> in your chat</h2>
          <h3>
            {{ (data.time?.longestGap / (1000 * 60 * 60 * 24)).toFixed(1) }} days
          </h3>

          <p>
            You did not chat from
            {{ getDate(data.time?.longestGapStart) }}
            to {{ getDate(data.time?.longestGapEnd) }}.
          </p>
        </div>
      </template>
    </Lines>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue'

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
      data: {}
    }
  },
  methods: {
    getDate(timeString: string) {
      if (!timeString) return '';
      return `${new Date(timeString).getFullYear()} ${new Date(timeString).getMonth() + 1} ${new Date(timeString).getDay()}`
    }
  },
  mounted() {
    try {
      this.data = JSON.parse(sessionStorage.getItem("stats")).data;
    } catch (err) {
      navigateTo({
        path: '/upload',
      })
    }
  }
})
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
  @apply text-8xl
}

strong {
  @apply text-orange-500 italic
}

h3 {
  @apply text-[200px]
}

</style>