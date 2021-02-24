<template>
  <v-container>
    <v-tabs v-model="tab" align-with-title>
      <v-tab>iOS How To Export</v-tab>
      <v-tab>Android How To Export</v-tab>
    </v-tabs>
    <v-tabs-items v-model="tab">
      <v-tab-item v-for="item in items" :key="item">
        <v-card flat>
          <v-card-text v-text="text"></v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
    <v-container style="max-width: 600px">
      <v-timeline dense clipped>
        <v-slide-x-transition group> </v-slide-x-transition>
        <v-timeline-item class="mb-4" small>
          <v-row justify="space-between">
            <v-col cols="7">
              <v-chip class="white--text ml-0" color="purple" label small>
                iOS
              </v-chip>
              On Iphone open WhatsApp and tap on the chat you would like to
              export
            </v-col>
          </v-row>
        </v-timeline-item>

        <v-timeline-item class="mb-4" color="grey" small>
          <v-row justify="space-between">
            <v-col cols="7">
              Tap on the name of the chat at the top to open "Group/Chat Info"
            </v-col>
            <v-col class="text-right" cols="5"> </v-col>
          </v-row>
        </v-timeline-item>

        <v-timeline-item class="mb-4" color="grey" small>
          <v-row justify="space-between">
            <v-col cols="7">
              In chat info, scroll all the way to the bottom > tap on "export
              chat" > choose "Without Media"
            </v-col>
            <v-col class="text-right" cols="5"> </v-col>
          </v-row>
        </v-timeline-item>

        <v-timeline-item color="grey" small>
          <v-row justify="space-between">
            <v-col cols="7">
              Tap on "Save to Files" to save it on your Iphone
            </v-col>
            <v-col class="text-right" cols="5"> </v-col>
          </v-row>
        </v-timeline-item>
        <v-timeline-item color="grey" small>
          <v-row justify="space-between">
            <v-col cols="7">
              Finally select "On my Iphone" to save it locally
            </v-col>
            <v-col class="text-right" cols="5"> </v-col>
          </v-row>
        </v-timeline-item>
        <v-timeline-item color="grey" small>
          <v-row justify="space-between">
            <v-col cols="7">
              At last you can select your exported chat .zip now to be analyzed
            </v-col>
            <v-col class="text-right" cols="5"> </v-col>
          </v-row>
        </v-timeline-item>
        <v-timeline-item class="mb-4" hide-dot>
          <v-btn to="#drop" class="mx-0"> Select my chat .zip now. </v-btn>
        </v-timeline-item>
      </v-timeline>
    </v-container>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      tab: null,
    };
  },
};
</script>
