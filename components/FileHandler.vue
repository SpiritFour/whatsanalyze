<template>
  <div
    class="file-handler pa-md-0"
    @dragover.prevent="dragOver"
    @dragleave.prevent="dragLeave"
    @drop.prevent="drop($event)"
  >
    <div class="drop-container">
      <label for="uploadmytextfile" style="cursor: pointer">
        <div
          :class="{
            isDragging: isDragging,
            smallFont: $vuetify.breakpoint.smAndDown,
            isSuccess: isSuccess,
          }"
          class="drop pa-3"
        >
          <input
            id="uploadmytextfile"
            multiple
            type="file"
            @change="requestUploadFile"
          />
          <!-- Wrong File -->
          <div
            v-show="wrongFile"
            class="text-body-1 text-md-h6 text-xl-h5 w-100"
            v-html="$t('fileWrong')"
          ></div>
          <!-- is Dragging -->
          <div v-if="isDragging" class="w-100 h-100">
            <br />
            {{ $t("fileDrop") }}
          </div>
          <!-- Standard State -->
          <div
            v-if="!isDragging && !wrongFile && !processing"
            class="text-body-1 text-md-h6 text-xl-h5 w-100 h-100"
          >
            <v-icon v-if="!isSuccess" size="2em">mdi-file</v-icon>

            <div :class="{ 'text-caption': isSuccess }">
              <div v-if="isSuccess" v-html="$t('fileDone')"></div>
              <span
                v-if="$vuetify.breakpoint.mdAndUp"
                v-html="$t('fileSuccess')"
              >
              </span>
              <span
                v-if="$vuetify.breakpoint.smAndDown"
                v-html="$t('fileSelect')"
              >
              </span>

              <span v-if="isSuccess" v-html="$t('fileAnother')"></span>
              <span v-if="!isSuccess" v-html="$t('fileZip')"></span>
            </div>
          </div>
          <br />
          <div
            v-show="processing"
            class="text-body-1 text-md-h6 text-xl-h5 w-100 overflow-hidden"
          >
            <div class="loading" />
            <br />
            <span v-html="$t('fileProcessing')" />
          </div>
        </div>
      </label>
    </div>
  </div>
</template>

<script>
import { parseString } from "whatsapp-chat-parser";
import JSZip from "jszip";
import { GTAG_FILE, gtagEvent } from "~/functions/gtagValues";

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
              // we just pass a list of filenames with compressed contents here
              attachments: Object.values(zipData.files).map((file) => {
                return {
                  name: file.name,
                  compressedContent: file._data.compressedContent,
                };
              }),
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

    readFileAsArrayBuffer(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result));
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
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
        }).then(async (messages) => {
          // the only difference to the zip file is, that these blobs are already inflated
          let attachments = [];
          // we would like to have all files as uint8arrays, as such we have to read the file in as array
          await files.forEach(async (file) => {
            const arr = await this.readFileAsArrayBuffer(file);
            attachments.push({ name: file.name, decompressedData: arr });
          });

          this.updateMessages({
            messages: messages,
            attachments,
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
      gtagEvent("parsed", GTAG_FILE);
    },

    showErrorMessage(text = undefined) {
      this.wrongFile = true;
      this.processing = false;
      this.isSuccess = false;
      gtagEvent("error" + (text || ""), GTAG_FILE, 0);
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
        if (!file) return this.showErrorMessage("_undefined_shared_file");
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
    },

    requestUploadFile() {
      let src = this.$el.querySelector("#uploadmytextfile");
      let fileList = src.files;
      this.processFileList(fileList);
    },
  },
};
</script>

<style lang="scss" scoped>
.w-100 {
  width: 100%;
}

.smallFont p {
  font-size: 1.1em !important;
}

.file-handler {
  text-align: center;
  background: $c-blue-accent;
}

.drop-container {
  background-color: $c-blue-accent-light;
  border-radius: 10px;
  padding: 10px;
}

.drop {
  display: flex;
  align-items: center;
  justify-items: center;
  //min-height: 150px;
  // outline
  border: 2px dashed rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  color: black;
  //background: white;
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
