<template>
  <div
    class="drop-container pa-md-16 pa-4"
    @dragover.prevent="dragOver"
    @dragleave.prevent="dragLeave"
    @drop.prevent="drop($event)"
  >
    <label style="cursor: pointer" for="uploadmytextfile">
      <div
        class="drop"
        :class="{
          isDragging: this.isDragging,
          smallFont: $vuetify.breakpoint.smAndDown,
        }"
      >
        <input type="file" id="uploadmytextfile" @change="requestUploadFile" />

        <p v-if="wrongFile">Wrong file format please upload a .txt!</p>
        <p v-if="isDragging" class="drop-instruction">
          <v-icon size="2em">mdi-arrow-down-drop-circle</v-icon>
          <br />
          Drop it now!
        </p>
        <p v-if="!isDragging && !wrongFile && !processingFile">
          <v-icon size="2em"> mdi-file </v-icon>
          <br />

          <span v-if="isSuccess">Done! Look at your analysis below. </span>

          <span v-if="$vuetify.breakpoint.mdAndUp">
            <strong>Drag </strong>
            (or select)
          </span>

          <span v-if="$vuetify.breakpoint.smAndDown">
            <strong style="text-decoration: underline">Pick </strong>
          </span>

          <span v-show="textSource">another file to add it</span>
          <span v-show="!textSource"> your Whats App .txt file </span>
        </p>
        <p v-show="processingFile">Processing your file...</p>
      </div>
    </label>
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
          this.processingFile = false;
        }
      }
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
p {
  font-size: 2em;
}

.smallFont p {
  font-size: 1.1em !important;
}

.drop-container {
  text-align: center;
  background: $c-blue-accent;
}

.drop-instruction {
  font-size: 3em !important;
  color: $c-dark !important;
  font-weight: bold;
  text-shadow: none !important;
}

.drop {
  display: flex;
  align-items: center;

  height: 100%;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease-in-out;
  font-family: sans-serif;

  // shadows
  box-shadow: 5px 5px 10px $c-dark;
  text-shadow: 2px 2px 2px $c-dark;

  // colors
  background-color: $c-blue-accent-dark;
  color: $c-blue-accent;

  // outline
  outline: 10px dashed $c-dark;
  outline-offset: -10px;
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
  background-color: $c-yellow;
  outline: 10px dashed $c-blue-accent-dark;
}
</style>
