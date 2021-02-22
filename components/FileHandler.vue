<template>
  <div
    class="drop"
    :class="getClasses"
    @dragover.prevent="dragOver"
    @dragleave.prevent="dragLeave"
    @drop.prevent="drop($event)"
  >
    <h1 v-if="wrongFile">
      Wrong file format please upload a .txt!
      <v-icon large> mdi-tray-arrow-down </v-icon>
      <br />
      <strong>Drag & Drop</strong>
      <label style="cursor: pointer" for="uploadmytextfile">(or choose)</label>
      your chat .txt file
    </h1>
    <h1
      style="text-align: center"
      v-if="
        !textSource &&
        !isDragging &&
        !wrongFile &&
        !isSuccess &&
        !processingFile
      "
    >
      <v-icon large> mdi-tray-arrow-down </v-icon>
      <br />
      <strong>Drag & Drop</strong>
      <label style="cursor: pointer" for="uploadmytextfile">(or choose)</label>
      your chat .txt file
    </h1>
    <h1 v-if="processingFile">Processing your file please wait...</h1>
    <h1 v-if="isSuccess">
      Done!
      <v-icon large> mdi-tray-arrow-down </v-icon>
      <br />
      <strong
        >Look at your analysis below
        <br />
        or Drag & Drop</strong
      >
      <label style="cursor: pointer" for="uploadmytextfile">(or choose)</label>
      a new chat .txt file
    </h1>
    <input type="file" id="uploadmytextfile" @change="requestUploadFile" />
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
      processingFile: false,
      isSuccess: false,
      textSource: null,
      chatStruct: null,
      messages: [],
    };
  },
  computed: {
    getClasses() {
      return { isDragging: this.isDragging };
    },
  },
  methods: {
    // add absolute and personal id to each entry of the data structure
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

    dragOver() {
      this.isDragging = true;
    },
    dragLeave() {
      this.isDragging = false;
    },
    drop(e) {
      this.processingFile = true;
      let files = e.dataTransfer.files;
      this.process(files);
    },
    requestUploadFile() {
      let src = this.$el.querySelector("#uploadmytextfile");
      let files = src.files;
      this.readFile(files).then(() => this.createDataStruct());
    },

    async createTextSourceFromZip(file) {
      let zip = new JSZip();
      zip.loadAsync(file).then(() => {
        zip
          .file("_chat.txt")
          .async("string")
          .then((fileData) => {
            return fileData;
          });
      });
    },
    createTextSourceFromText(file) {
      let reader = new FileReader();
      reader.onload = (f) => {
        return f.target.result;
      };
      reader.readAsText(file);
    },

    createDataStruct() {
      this.wrongFile = false;
      this.processingFile = true;
      this.isSuccess = false;
      if (this.textSource != null) {
        this.isDragging = false;
        parseString(this.textSource)
          .then(
            (messages) => (this.messages = this.extendDataStructure(messages))
          )
          .then(() => {
            this.$emit("new_messages", this.messages);
            this.$emit("hide_explanation", true);
          });
        this.$gtag.event("file-parsed", {
          event_category: "home",
          event_label: "lead",
          value: "1",
        });
        this.isSuccess = true;
        this.processingFile = false;
      } else {
        this.processingFile = false;
        this.$gtag.event("file-error", {
          event_category: "home",
          event_label: "lead",
          value: "0",
        });
        this.wrongFile = true;
        this.textSource = null;
        this.isDragging = false;
        this.processingFile = false;
      }
    },
    async readFile(files) {
      if (files.length === 1) {
        let file = files[0];
        if (file.type.indexOf("zip") >= 0) {
          this.createTextSourceFromZip(file).then((data) => {
            this.textSource = data;
          });
        } else if (file.type.indexOf("text/") >= 0) {
          this.textSource = this.createTextSourceFromText(file);
        }
      }
      console.log(this.textSource);
    },
  },

  mounted() {
    fetch("/chat_example.txt")
      .then((response) => response.text())
      .then(parseString)
      .then((messages) => (this.messages = this.extendDataStructure(messages)))
      .then(() => this.$emit("new_messages", this.messages));
  },
};
</script>

<style scoped lang="scss">
.drop {
  width: 100%;
  height: 20vh;
  background-color: $c-white;
  outline: 2px dashed black;
  outline-offset: -10px;
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 1rem;
  transition: background-color 0.2s ease-in-out;

  font-family: sans-serif;
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

label {
  text-decoration: underline;
}

.isDragging {
  background-color: grey;
}
</style>
