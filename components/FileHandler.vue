<template>
  <div
    class="drop"
    :class="getClasses"
    @dragover.prevent="dragOver"
    @dragleave.prevent="dragLeave"
    @drop.prevent="drop($event)"
  >
    <textarea
      style="height: 600px"
      v-model="textSource"
      v-if="textSource"
    ></textarea>
    <h1 v-if="wrongFile">Wrong file type</h1>
    <h1 v-if="!textSource && !isDragging && !wrongFile">
      Drop <label for="uploadmytextfile">(or pick)</label> a text file
    </h1>

    <input type="file" id="uploadmytextfile" @change="requestUploadFile" />
    <h3>{{ messages }}</h3>
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
    dragOver() {
      this.isDragging = true;
    },
    dragLeave() {
      this.isDragging = false;
    },
    drop(e) {
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
              .then((messages) => (this.messages = messages))
              .then(() => this.$emit("new_messages", this.messages));
          };
          // this is the method to read a text file content
          reader.readAsText(file);
        } else {
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
      .then((messages) => (this.messages = messages))
      .then(() => this.$emit("new_messages", this.messages));
  },
};
</script>

<style scoped>
.drop {
  width: 100%;
  height: 100%;
  background-color: #eee;
  border: 10px solid #eee;

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
</style>
