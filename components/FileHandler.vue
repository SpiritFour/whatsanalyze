<template>
  <div
    class="drop-container pa-4 pa-md-0 mb-8"
    @dragover.prevent="dragOver"
    @dragleave.prevent="dragLeave"
    @drop.prevent="drop($event)"
  >
    <v-icon size="50" color="rgba(0,0,0,0.8)" class="py-2">
      mdi-chevron-down
    </v-icon>

    <label style="cursor: pointer" for="uploadmytextfile">
      <div
        class="drop pa-3"
        :class="{
          isDragging: isDragging,
          smallFont: $vuetify.breakpoint.smAndDown,
          isSuccess: isSuccess,
        }"
      >
        <input type="file" id="uploadmytextfile" @change="requestUploadFile" />
        <!-- Wrong File -->
        <div v-show="wrongFile" class="text-body-1 text-md-h5 w-100">
          <strong>Wrong file format!</strong> <br />
          Please upload the <strong>.txt</strong> or<strong>.zip</strong> file
          you get when exporting your chat!
        </div>
        <!-- is Dragging -->
        <div v-show="isDragging" class="text-h4 py-2 w-100">
          <br />
          Drop file now!
        </div>
        <!-- Standard State -->
        <div
          class="text-body-1 text-md-h5 w-100"
          v-show="!isDragging && !wrongFile && !processing"
        >
          <v-icon size="2em"> mdi-file </v-icon>
          <br />

          <div v-if="isSuccess">
            <strong>Done!</strong> <br />
            Look at your analysis below.
          </div>

          <div :class="{ 'text-caption': isSuccess }">
            <span v-if="$vuetify.breakpoint.mdAndUp">
              <strong>Drag</strong> or <strong>select</strong>
            </span>

            <span v-if="$vuetify.breakpoint.smAndDown">
              <strong style="text-decoration: underline">Select </strong>
            </span>

            <span v-if="isSuccess">another file to analyze it.</span>
            <span v-if="!isSuccess">
              your WhatsApp .zip or .txt file into this box.</span
            >
          </div>
        </div>
        <br />
        <div class="text-body-1 text-md-h5 w-100" v-show="processing">
          <img src="@/assets/loader.svg" height="40" width="40" />
          <br />
          <strong>Processing</strong> your file...
        </div>
      </div>
    </label>
  </div>
</template>

<script>
import { parseString } from "whatsapp-chat-parser";
import JSZip from "jszip";

export default {
  name: "DropAnImage",
  data() {
    return {
      isDragging: false,
      wrongFile: false,
      processing: false,
      isSuccess: false,
      messages: [],
    };
  },
  methods: {
    extendDataStructure(messages) {
      let authors = {};
      messages.forEach(function (object, index) {
        if (!(object.author in authors)) authors[object.author] = 0;
        else authors[object.author] += 1;
        object.absolute_id = index;
        object.personal_id = authors[object.author];
      });
      return messages;
    },

    zipLoadEndHandler(e) {
      const arrayBuffer = e.target.result;
      const jszip = new JSZip();
      const zip = jszip.loadAsync(arrayBuffer);

      zip
        .then(this.readChatFile)
        .then((text) => parseString(text, { parseAttachments: true }))
        .then(this.updateMessages);
    },

    txtLoadEndHandler(e) {
      parseString(e.target.result).then(this.updateMessages);
    },

    updateMessages(messages) {
      this.messages = this.extendDataStructure(messages);
      this.$emit("new_messages", this.messages);
      this.$emit("hide_explanation", true);
      this.processing = false;
      this.isSuccess = true;
      this.$gtag.event("file-parsed", {
        event_category: "home",
        event_label: "lead",
        value: "1",
      });
    },

    readChatFile(zipData) {
      const chatFile = zipData.file("_chat.txt");
      if (chatFile) return chatFile.async("string");

      const chatFiles = zipData.file(/.*(?:chat|whatsapp).*\.txt$/i);

      if (!chatFiles.length) {
        throw new Error("No txt files found in archive");
      }

      const chatFilesSorted = chatFiles.sort(
        (a, b) => a.name.length - b.name.length
      );

      return chatFilesSorted[0].async("string");
    },

    processFile(file) {
      this.isDragging = false;
      this.processing = true;
      this.isSuccess = false;
      this.wrongFile = false;

      // Page freezes during file read, we need to wait for data to propagate to DOM
      setTimeout(() => {
        const reader = new FileReader();
        if (/^application\/(?:x-)?zip(?:-compressed)?$/.test(file.type)) {
          reader.addEventListener("loadend", this.zipLoadEndHandler);
          reader.readAsArrayBuffer(file);
        } else if (file.type === "text/plain") {
          reader.addEventListener("loadend", this.txtLoadEndHandler);
          reader.readAsText(file);
        } else {
          this.wrongFile = true;
          this.processing = false;
          this.isSuccess = false;
          this.$gtag.event("file-error", {
            event_category: "home",
            event_label: "lead",
            value: "0",
          });
        }
      }, 100);
    },

    dragOver() {
      this.isDragging = true;
    },

    dragLeave() {
      this.isDragging = false;
    },

    drop(e) {
      let files = e.dataTransfer.files;
      this.processFile(files[0]);
    },

    requestUploadFile() {
      let src = this.$el.querySelector("#uploadmytextfile");
      let files = src.files;
      this.processFile(files[0]);
    },
  },
  mounted() {
    fetch("/chat_example.txt")
      .then((response) => response.text())
      .then(parseString)
      .then((messages) => (this.messages = messages))
      .then(() => this.$emit("new_messages", this.messages));
  },
};
</script>

<style scoped lang="scss">
.w-100 {
  width: 100%;
}

.smallFont p {
  font-size: 1.1em !important;
}

.drop-container {
  text-align: center;
  background: $c-blue-accent;
}

.drop {
  display: flex;
  align-items: center;
  justify-items: center;
  min-height: 150px;
  // outline
  border: 2px dashed $c-dark;
  border-radius: 20px;

  // animation
  animation-name: attention;
  animation-duration: 2s;
  animation-iteration-count: infinite;
}

@keyframes attention {
  0% {
    box-shadow: 2px 2px 20px black;
  }
  50% {
    box-shadow: none;
  }
  100% {
    box-shadow: 2px 2px 20px black;
  }
}

textarea {
  width: 100%;
  height: 100%;
  object-fit: contain;
  resize: none;
}

input[type="file"] {
  display: none;
}

.isDragging {
  box-shadow: 0px 0px 40px black !important;
  border-style: solid;
  background: $c-dark;
  text-shadow: chartreuse;
  color: $c-blue-accent !important;
}

.isSuccess {
  // animation
  animation-name: done;
  animation-duration: 2s;
  animation-iteration-count: 1;
}

@keyframes done {
  0% {
    background: $c-blue-accent;
  }
  50% {
    background: greenyellow;
  }
  100% {
    background: $c-blue-accent;
  }
}
</style>
