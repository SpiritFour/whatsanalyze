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
  </div>
</template>

<script>
export default {
  data() {
    return {
      isDragging: false,
      wrongFile: false,
      textSource: null,
      chatData: null
    };
  },
  computed: {
    getClasses() {
      return { isDragging: this.isDragging };
    }
  },
  methods: {
    // TODO: REFACRURE
    makeStruct(names) {
      var names = names.split(" ");
      var count = names.length;
      function constructor() {
        for (var i = 0; i < count; i++) {
          this[names[i]] = arguments[i];
        }
      }
      return constructor;
    },
    // TODO: REFACRURE &
    createStruct(content) {
      // Message can be in these formats: https://docs.google.com/spreadsheets/d/1mZCE_tFelvqmLh0vIt7vMjU1OYB0etuhwXRl3Fzv6k8/edit#gid=0
      // variables give the index ralative to the start of the message to seperate the data in the next functions
      // s1 +	l1 +	1+	l2 +	1+	l3+	s2+	t1+1+t2+1+t3+t4+sep3+NAME+sep4+text
      // REGEX
      // https://www.debuggex.com/r/VGwUUxtq7tvF2rJB
      // This regex is used to find the start index of every message (including special messages)
      var re = new RegExp(
        "(\\[?)((\\d{1,4}(\\-|\\/|\\.){1}){2}\\d{2,4})((\\s.{1,3}\\s|\\s)|,\\s|\\.\\s){1}(((\\d{1,2}(\\:|.))\\d{2}((:|.)\\d{2})?)(\\s(a|p)?m|\\s(A|P)?M|\\s(a|p)?\\.(\\s)?\\m.)?)(\\]\\s|\\s\\-\\s|\\:)",
        "g"
      );
      // regex to find ending of name
      // var reD = new RegExp("([:-])");
      var reD = new RegExp("(:|-)");

      var indexArray = [];
      var messageStartIndexArray = [];
      var nameArray = [];
      var timeArray = [];
      var dateArray = [];

      var i = 0;
      let match = re.exec(content);
      while (match != null) {
        //console.log("match found at " + match.index);
        indexArray[i] = match.index;
        // currently this array stores the index after the identifier
        messageStartIndexArray[i] = match[0].length;
        //nameArray[i] = match[16];
        timeArray[i] = match[7];
        dateArray[i] = match[2];
        match = re.exec(content);
        i++;
      }

      // create messsages
      var messageArray = [];
      var nameLengthArray = [];
      var temp = "";

      for (var i = 0; i < indexArray.length; i++) {
        if (i == indexArray.length - 1) {
          temp = content.substring(
            indexArray[i] + messageStartIndexArray[i],
            content.length - 1
          );
        } else {
          temp = content.substring(
            indexArray[i] + messageStartIndexArray[i],
            indexArray[i + 1]
          );
        }

        // search for a name and add it's length to the index
        match = reD.exec(temp);

        if (match != null) {
          nameLengthArray[i] = match.index;
          // update name
          nameArray[i] = temp.substring(0, match.index);
        } else {
          nameLengthArray[i] = 0;
          // update name
          nameArray[i] = "ER: NO NAME FOUND";
        }

        // fill array // +2 gets rid of ": " before the start of the message
        if (i == indexArray.length - 1) {
          messageArray[i] = content.substring(
            indexArray[i] + messageStartIndexArray[i] + nameLengthArray[i] + 2,
            content.length
          );
        } else {
          messageArray[i] = content.substring(
            indexArray[i] + messageStartIndexArray[i] + nameLengthArray[i] + 2,
            indexArray[i + 1]
          );
        }
      }

      // remove any special messages (e.g. lines without ":")
      // e.g. announcments when people get added to groups, security change etc
      var delArray = [];
      var a = 0;
      for (var i = 0; i < nameArray.length; i++) {
        if (nameArray[i] == "ER: NO NAME FOUND") {
          // no ":" found. Delete this line
          delArray[a] = i;
          a++;
        }
      }

      for (var i = 0; i < a; i++) {
        messageArray.splice(delArray[i] - i, 1);
        nameArray.splice(delArray[i] - i, 1);
        timeArray.splice(delArray[i] - i, 1);
        dateArray.splice(delArray[i] - i, 1);
      }

      var Item = this.makeStruct("name date time message");
      var struct = new Item(nameArray, dateArray, timeArray, messageArray);

      return struct;
    },
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
          reader.onload = f => {
            this.textSource = f.target.result;
            this.isDragging = false;
            // convert data
            // TODO: Convert and emit
            this.chatData = this.createStruct(this.textSource);
            console.log(this.chatData);
          };
          // this is the method to read a text file content
          reader.readAsText(file);
        } else {
          this.wrongFile = true;
          this.textSource = null;
          this.isDragging = false;
        }
      }
    }
  }
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

.isDragging {
  background-color: #999;
  border-color: #fff;
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
