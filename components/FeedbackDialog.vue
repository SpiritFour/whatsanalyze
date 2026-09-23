<template>
  <v-dialog :model-value="true" width="500" @update:model-value="close">
    <v-card class="wa-scope overflow-hidden rounded-token-lg">
      <div
        class="flex items-center justify-between gap-3 bg-wa-accent px-6 py-4 text-white"
      >
        <p class="m-0 text-xl font-bold">{{ $t("writeUs") }}</p>
        <button type="button" class="close" aria-label="Close" @click="close">
          <IconClose />
        </button>
      </div>

      <v-card-text class="px-6 pb-2 pt-5">
        <p v-if="!message" class="m-0 text-sm text-wa-ink-muted">
          {{ $t("cardText") }}
        </p>
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
                bg-color="grey-lighten-2"
                color="primary"
                hover
                length="5"
                size="32"
              />
            </v-input>

            <UiButton :disabled="!valid" @click="validate"> Send </UiButton>
          </v-row>
        </v-form>
        <p v-else class="m-0 text-sm text-wa-ink">{{ message }}</p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "FeedbackDialog",
  emits: ["close"],
  data() {
    return {
      valid: true,
      name: "",
      nameRules: [(v) => !!v || this.$t("name")],
      email: "",
      emailRules: [
        (v) => !!v || this.$t("email"),
        (v) => /.+@.+\..+/.test(v) || this.$t("email"),
      ],
      text: "",
      starValue: 0,
      starRules: [(v) => !!v || this.$t("rating")],
      message: null,
    };
  },
  methods: {
    close() {
      this.$emit("close");
    },
    async validate() {
      const { valid } = await this.$refs.form.validate();
      if (valid) {
        this.valid = false;
        const mail = {
          toUids: ["sebastian"],
          ccUids: ["adrian", "mo", "paul"],
          from: this.email,
          replyTo: this.email,
          template: {
            name: "feedback",
            data: {
              name: this.name,
              text: this.text,
              rating: this.starValue,
              locale: this.$i18n.locale,
              email: this.email,
            },
            created: this.$firebase.serverTimestamp(),
          },
        };
        this.$firebase.sendFeedback(mail).then(() => {
          this.message = this.$t("messageReceived");
        });
      }
    },
  },
};
</script>

<style scoped>
.close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.close:hover {
  background: rgba(0, 0, 0, 0.08);
}

.row-class {
  height: min-content;
}
</style>

<style>
/* Tailwind is not loaded globally (see nuxt.config): the parts of the
   site that opt into it pull it in themselves. */
@import "~/assets/tailwind.css";
</style>
