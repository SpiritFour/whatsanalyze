<template>
  <div
    class="drop-container pa-md-0"
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
        <input
          type="file"
          multiple
          id="uploadmytextfile"
          @change="requestUploadFile"
        />
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
  name: "FileHandler",
  data() {
    return {
      isDragging: false,
      wrongFile: false,
      processing: false,
      isSuccess: false,
      attachments: {},
    };
  },
  methods: {
    extendDataStructure(chatObject) {
      let authors = {};
      chatObject.messages.forEach(function (object, index) {
        if (!(object.author in authors)) authors[object.author] = 0;
        else authors[object.author] += 1;
        object.absolute_id = index;
        object.personal_id = authors[object.author];
      });
    },

    zipLoadEndHandler(e) {
      const arrayBuffer = e.target.result;
      const jszip = new JSZip();
      const zip = jszip.loadAsync(arrayBuffer);

      zip
        .then((zipData) => {
          let chatFile = this.getChatFile(zipData);
          return parseString(chatFile, {
            parseAttachments: true,
          }).then((messages) => {
            return {
              messages: messages,
              attachments: zipData,
            };
          });
        })
        .then(this.updateMessages);
    },

    async getChatFile(zipData) {
      // this is the standard file on ios, if found return
      const chatFile = zipData.file("_chat.txt");
      if (chatFile) return chatFile.async("string");

      // otherwise search for potential other txt files
      // take shortes one
      return await zipData
        .file(/.*(?:chat|whatsapp).*\.txt$/i)
        .sort((a, b) => a.name.length - b.name.length)[0]
        .async("string");
    },

    readSharedFiles(files) {
      function findChatFile(files) {
        let chatRegex = new RegExp(/.*(?:chat|whatsapp).*\.txt$/i);
        return files.find((file) => {
          return chatRegex.test(file.name);
        });
      }

      files = Array.from(files);
      let chatFile = findChatFile(files);
      if (chatFile === undefined) {
        this.showErrorMessage();
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("loadend", (loadedFile) => {
        parseString(loadedFile.target.result, {
          parseAttachments: true,
        }).then((messages) => {
          this.updateMessages({
            messages: messages,
            attachments: {
              files: files,
              file(_fileName) {
                return {
                  async: () =>
                    Promise.resolve(
                      this.files.find((file) => file.name === _fileName)
                    ),
                };
              },
            },
          });
        });
      });
      reader.readAsText(chatFile);
    },

    txtLoadEndHandler(e) {
      parseString(e.target.result).then((messages) =>
        this.updateMessages({ messages: messages })
      );
    },

    updateMessages(chatObject) {
      this.extendDataStructure(chatObject);
      this.$emit("new_messages", chatObject);
      this.$emit("hide_explanation", true);
      this.processing = false;
      this.isSuccess = true;
      this.$gtag.event("file-parsed", {
        event_category: "home",
        event_label: "file",
        value: "1",
      });
    },

    showErrorMessage() {
      this.wrongFile = true;
      this.processing = false;
      this.isSuccess = false;
      this.$gtag.event("file-error", {
        event_category: "home",
        event_label: "file",
        value: "0",
      });
    },
    processFileList(fileList, shared = false) {
      this.isDragging = false;
      this.processing = true;
      this.isSuccess = false;
      this.wrongFile = false;

      if (shared || fileList.length > 1) {
        //do multiple here
        this.readSharedFiles(fileList);
      } else {
        let file = fileList[0];
        // do singles here
        const reader = new FileReader();
        if (/^application\/(?:x-)?zip(?:-compressed)?$/.test(file.type)) {
          reader.addEventListener("loadend", this.zipLoadEndHandler);
          reader.readAsArrayBuffer(file);
        } else if (file.type === "text/plain") {
          reader.addEventListener("loadend", this.txtLoadEndHandler);
          reader.readAsText(file);
        } else {
          this.showErrorMessage();
        }
      }
    },

    dragOver() {
      this.isDragging = true;
    },

    dragLeave() {
      this.isDragging = false;
    },

    drop(e) {
      let fileList = e.dataTransfer.files;
      this.processFileList(fileList);
      this.$gtag.event("file-drag-dropped", {
        event_category: "home",
        event_label: "file",
        value: "1",
      });
    },

    requestUploadFile() {
      let src = this.$el.querySelector("#uploadmytextfile");
      let fileList = src.files;
      this.processFileList(fileList);
    },
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
