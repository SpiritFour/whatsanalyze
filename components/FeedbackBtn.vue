<i18n>
{
  "en": {
    "writeUs": "Write Us!",
    "cardText": "Do you have feedback for us? Did something not work? Do you have suggestions for improvement? Let us know!",
    "messageReceived": "We got your message!",
    "name": "Name is required",
    "email": "E-mail must be valid",
    "rating": "Rating is required"
  },
  "de": {
    "writeUs": "Schreibe uns!",
    "cardText": "Hast du Feedback für uns? Hat etwas nicht funktioniert? Hast du Verbesserungsvorschläge? Lass es uns wissen!",
    "messageReceived": "Wir haben deine Nachricht erhalten!",
    "name": "Name fehlt",
    "email": "E-Mail muss gültig sein",
    "rating": "Bewertung fehlt"
  }
}

</i18n>
<template>
  <div class="bottom-right">
    <v-dialog v-model="dialog" width="500">
      <template #activator="{ on, attrs }">
        <v-btn
          class="rounded-0 btn pa-0 btn-color-dark"
          dark
          elevation="0"
          v-bind="attrs"
          v-on="on"
        >
          <div class="wrapper my-2 mr-1">
            <span class="rotate-text">{{ $t("writeUs") }}</span>
            <v-icon class="mr-1 rotate-image">mdi-pencil</v-icon>
          </div>
        </v-btn>
      </template>

      <v-card>
        <v-card-title class="text-h4 btn-color">
          {{ $t("writeUs") }}
          <v-spacer />
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-4 pb-0 text-h6">
          {{ $t("cardText") }}
          <v-form
            v-if="!message"
            ref="form"
            v-model="valid"
            class="ma-3"
            lazy-validation
          >
            <v-text-field
              v-model="name"
              :rules="nameRules"
              label="Name"
              required
            ></v-text-field>

            <v-text-field
              v-model="email"
              :rules="emailRules"
              label="E-mail"
              required
            ></v-text-field>

            <v-textarea
              v-model="text"
              :counter="2000"
              class="mb-5"
              label="Text"
              required
            />

            <v-row class="row-class">
              <v-input :rules="starRules" :value="starValue">
                <v-rating
                  v-model="starValue"
                  background-color="grey lighten-2"
                  color="primary"
                  hover
                  length="5"
                  size="32"
                />
              </v-input>

              <v-btn :disabled="!valid" class="btn-color" @click="validate">
                Send
              </v-btn>
            </v-row>
          </v-form>
          <div v-else>
            <v-divider />
            {{ message }}
          </div>
        </v-card-text>

        <v-divider></v-divider>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      valid: true,
      name: "",
      nameRules: [(v) => !!v || this.$t("name")],
      email: "",
      emailRules: [
        (v) => !!v || this.$t("email"),
        (v) => /.+@.+\..+/.test(v) || this.$t("email")
      ],
      text: "",
      starValue: 0,
      starRules: [(v) => !!v || this.$t("rating")],
      select: null,
      dialog: false,
      message: null
    };
  },

  methods: {
    validate() {
      const valid = this.$refs.form.validate();
      if (valid) {
        this.valid = false;
        this.$fire.firestore
          .collection("messages")
          .doc()
          .set({
            name: this.name,
            email: this.email,
            text: this.text,
            rating: this.starValue,
            locale: this.$i18n.locale,
            created: this.$fireModule.firestore.FieldValue.serverTimestamp()
          })
          .then(() => {
            this.message = this.$t("messageReceived");
          });
      }
    }
  }
};
</script>
<style scoped>
.bottom-right {
  position: fixed;
  right: 0;
  bottom: 10vh;
  z-index: 2;
}

.rotate-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.rotate-image {
  transform: rotate(-90deg);
}

.btn {
  height: fit-content !important;
  min-width: fit-content !important;
}

.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.row-class {
  height: min-content;
}
</style>
