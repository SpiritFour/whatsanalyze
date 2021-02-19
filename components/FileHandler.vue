<template>
  <div
    class="drop"
    :class="getClasses"
    @dragover.prevent="dragOver"
    @dragleave.prevent="dragLeave"
    @drop.prevent="drop($event)"
  >
    <h1 v-if="wrongFile">Wrong file format please upload a .txt!</h1>
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
      <strong>Drag </strong>
      <label style="cursor: pointer" for="uploadmytextfile">(or choose)</label>
      a .txt file
    </h1>
    <h1 v-if="processingFile">Processing your file please wait...</h1>
    <h1 v-if="isSuccess">Done!</h1>
    <input type="file" id="uploadmytextfile" @change="requestUploadFile" />
  </div>
</template>

<script>
import { parseString } from "whatsapp-chat-parser";

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
      var src = this.$el.querySelector("#uploadmytextfile");
      let files = src.files;
      this.process(files);
    },
    process(files) {
      this.wrongFile = false;
      this.processingFile = true;
      this.isSuccess = false;
      // allows only 1 file
      if (files.length === 1) {
        let file = files[0];
        // allows text only
        if (file.type.indexOf("text/") >= 0) {
          var reader = new FileReader();
          reader.onload = (f) => {
            this.textSource = f.target.result;
            this.isDragging = false;
            parseString(this.textSource)
              .then(
                (messages) =>
                  (this.messages = this.extendDataStructure(messages))
              )
              .then(() => this.$emit("new_messages", this.messages));
            this.processingFile = false;
            this.$gtag.event("file-parsed", {
              event_category: "home",
              event_label: "lead",
              value: "1",
            });
            this.isSuccess = true;
          };
          // this is the method to read a text file content
          reader.readAsText(file);
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
        }
      }
    },
  },
  mounted() {
    // console.log( this.$content('chat_example').fetch())
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
