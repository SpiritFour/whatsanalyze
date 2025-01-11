<template>
  <div>
    <!--    <SubscriptionChecker :id="subscription.id" :email="subscription.email" @isInvalid="subscription.isValid = false"-->
    <!--                         @isValid="subscription.isValid = true" />-->

    Hallo

    <div ref="aboveTheFold" class="top-color" style="overflow-y: hidden">
      <div>
        <div
          :style="
            isShowingChats
              ? 'height: fit-content'
              : 'height: 70vh; min-height:504px;'
          "
          class="center-content"
          no-gutters
        >
          <div
            :md="isShowingChats ? 9 : 6"
            class="px-0 px-md-16 pb-8"
            cols="12"
          >

            <div
              :style="isShowingChats ? 'height: fit-content' : ''"
              class="center-content"
            >
              <!--              <HeaderCta />-->

              <div v-if="subscription.isValid" class="mt-6" style="width: 100%">
                <div dense prominent type="info">
                  Thanks for supporting us. You can download unlimited PDF's for free.

                  <button
                    plain
                    to="/subscribe"
                  >
                    More Info
                  </button>

                </div>
              </div>

              <!--              <ArrowDown :animate="true" />-->
            </div>

            <div
              :style="isShowingChats ? 'height: fit-content' : ''"
              class="center-content filehandler"
            >
              <!--              <FileHandler-->
              <!--                :style="isShowingChats ? 'max-width: 800px' : ''"-->
              <!--                class=""-->
              <!--                style="align-self: end; width: 100%"-->
              <!--                @hide_explanation="isShowingChats = $event"-->
              <!--                @new_messages="newMessages"-->
              <!--              />-->
            </div>
          </div>
          <div v-if="!isShowingChats" cols="12" md="6">
            <!--            <ChartsExampleGraphs :chat_="chat" />-->
          </div>
        </div>
        <div no-gutters>
          <div class="px-0 pb-1 my-auto" cols="12">
            <!--            <HeaderCta />-->

            <div v-if="subscription.isValid" class="mt-6" style="width: 100%">
              <div dense prominent type="info">
                Thanks for supporting us. You can download unlimited PDF's for free.

                <button
                  plain
                  to="/subscribe"
                >
                  More Info
                </button>

              </div>
            </div>
          </div>
          <div cols="12">
            <!--            <ArrowDown :animate="true" style="width: 100%; overflow: hidden" />-->
          </div>
          <div class="pt-0">
            <!--            <FileHandler-->
            <!--              class="filehandler"-->
            <!--              @hide_explanation="isShowingChats = $event"-->
            <!--              @new_messages="newMessages"-->
            <!--            />-->
          </div>
          <div v-if="!isShowingChats" cols="12" md="6">
            <!--            <ChartsExampleGraphs :chat_="chat" />-->
          </div>
        </div>
      </div>
    </div>

    <!--    <TrustLogos v-if="!isShowingChats" />-->
    <div v-show="!isShowingChats" class="pt-md-16">
      <!--      <ExportExplainer class="exportexplainer" />
            <Cta show-image />
            <Faq />
            <Testimonials />
            <About />
            <PdfExample />
            <Cta
              button-txt="generateYourChatPDF"
              text="getChatBeautiful"
              title="getFreePDFPreview"
            />-->
    </div>

    <div v-if="isShowingChats">
      <!--      <ChartsResults ref="results" :attachments="attachments" :chat="chat"
                           :isValidSubscription="subscription.isValid" />-->
    </div>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      isShowingChats: false,
      chat: undefined,
      attachments: undefined,
      loading: false,
      subscription: {
        id: null,
        email: null,
        isValid: null
      }
    };
  }
};
</script>