<template>
  <v-container>
    <v-tabs v-model="tab" left>
      <div disabled grow class="black--text text-body-1 text-md-h4 pr-4">
        How To:
      </div>
      <v-tab grow class="text-body-1 text-md-h4">iOS</v-tab>
      <v-tab grow class="text-body-1 text-md-h4">Android</v-tab>
    </v-tabs>
    <v-tabs-items v-model="tab">
      <v-tab-item :key="1">
        <IOSExplainer />
      </v-tab-item>
      <v-tab-item :key="2">
        <AndroidExplainer />
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>

<script>
export default {
  data: () => ({
    tab: null,
  }),
};
</script>
