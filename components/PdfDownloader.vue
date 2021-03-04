<template>
  <div>
    <vue-html2pdf
      :paginate-elements-by-height="1400"
      :manual-pagination="true"
      pdf-content-width="800px"
      pdf-orientation="portrait"
      filename="whatsanalyze"
      pdf-format="a4"
      @progress="onProgress($event)"
      @beforeDownload="beforeDownload($event)"
      @hasDownloaded="hasDownloaded($event)"
      ref="html2Pdf"
    >
      <section slot="pdf-content">
        <div class="html2pdf__page-break" />
        <ChartsResults :chat="chat" />
        <div class="html2pdf__page-break" />
      </section>
    </vue-html2pdf>

    <v-btn @click="downloadPdf">Download - Status: {{ progress }}%</v-btn>
  </div>
</template>

<script>
export default {
  props: ["chat"],
  data() {
    return {
      progress: 0,
      pdfDownloaded: false,
    };
  },
  methods: {
    async downloadPdf() {
      this.$refs.html2Pdf.generatePdf();
    },
    onProgress(progress) {
      this.progress = progress;
      console.log(`PDF generation progress: ${progress}%`);
    },
    // eslint-disable-next-line no-unused-vars
    async beforeDownload({ html2pdf, options, pdfContent }) {
      console.log(`On Before PDF Generation`);
      // await html2pdf().set(options).from(pdfContent).toPdf().get('pdf').then((pdf) => {
      // 	const totalPages = pdf.internal.getNumberOfPages()
      // 	for (let i = 1; i <= totalPages; i++) {
      // 		pdf.setPage(i)
      // 		pdf.setFontSize(10)
      // 		pdf.setTextColor(150)
      // 		pdf.text('Page ' + i + ' of ' + totalPages, (pdf.internal.pageSize.getWidth() * 0.88), (pdf.internal.pageSize.getHeight() - 0.3))
      // 	}
      // }).save()
    },
    hasDownloaded() {
      console.log(`PDF has downloaded!`);
      this.pdfDownloaded = true;
    },
  },
};
</script>

<style></style>
