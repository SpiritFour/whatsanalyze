<template>
  <v-container>
    <ExportExplainer class="mt-10" cta="exportAsPDF" to="/" />
    <PdfExample />
    <Content :page="page" />
    <div class="additional-resources mt-5">
      <h2>Additional Resources</h2>
      <li>YouTube tutorials for export</li>
    </div>
    <!-- YouTube Video Embed -->
    <iframe
      class="youtube-video my-5"
      width="560"
      height="315"
      src="https://www.youtube.com/embed/Mq5ZvyerA8E"
      title="YouTube video player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
    <ul>
      <li class="mb-2">
        FAQs: Common questions and troubleshooting tips. <br />
        <a href="/#faq">Read our FAQs</a>
      </li>
      <li>
        User Stories: Experiences and tips from users. <br />
        <a href="/#stories">Discover User Stories</a>
      </li>
    </ul>
    <div class="comparison-section my-5">
      <h2>Comparison of different tools available</h2>
      <p>
        Comparison of different tools available for exporting whatsapp chat and
        creating a pdf
      </p>
    </div>
    <v-data-table
      class="styled-table"
      hide-default-footer
      disable-sort
      :headers="headers"
      :items="desserts"
    ></v-data-table>
    <Cta
      to="/"
      class="cta-sectionpy-5"
      title="analyzeYourOwnWhatsapp"
      button-txt="analyzeMyChat"
      text="interestedAbout"
    />
  </v-container>
</template>

<script>
export default {
  name: "HowToExportYourWhatsappChat",
  title: "WhatsAnalyze - How to export WhatsApp chat",
  meta: [
    {
      hid: "og:title",
      name: "og:title",
      property: "og:title",
      content: "WhatsAnalyze - How to export WhatsApp chat",
    },
    {
      hid: "og:site_name",
      name: "og:site_name",
      property: "og:site_name",
      content: "WhatsAnalyze - How to export WhatsApp chat",
    },
    {
      hid: "description",
      name: "description",
      property: "description",
      content: "metaDescriptionWhatsExport",
    },
    {
      hid: "og:description",
      name: "og:description",
      property: "og:description",
      content: "metaDescriptionWhatsExport",
    },
    {
      hid: "og:url",
      name: "og:url",
      property: "og:url",
      content: "whatsanalyze.com/how-to-export-your-whatsapp-chat",
    },
  ],
  async asyncData({ $content }) {
    const page = await $content("how-to-export-your-whatsapp-chat").fetch();
    return {
      page,
    };
  },
  data() {
    return {
      headers: [
        {
          text: "Features & Solutions of PDF export tools",
          align: "start",
          sortable: false,
          value: "name",
        },
        { text: "Zapptales", value: "zapptales" },
        { text: "Dr. Fon", value: "drfon" },
        { text: "Longshot app", value: "longshotapp" },
        { text: "Export to txt and then to PDF", value: "pdfex" },
        {
          text: "WhatsAnalyze",
          value: "whatsAnalyze",
        },
      ],
      desserts: [
        // Privacy comparison
        {
          name: "Privacy 🛡️",
          zapptales: "🔴 Limited user control",
          whatsAnalyze:
            "🟢 Superior: Complete privacy with on-device processing",
          drfon: "🔴 Limited user control",
          longshotapp: "🟡 Basic privacy",
          pdfex: "🟡 Basic privacy",
        },
        // Security comparison
        {
          name: "Security 🔒",
          zapptales: "🔴 Potential server storage risks",
          whatsAnalyze: "🟢 Top-notch: All operations are local and secure",
          drfon: "🔴 Potential server storage risks",
          longshotapp: "🔴 Not open source, security unclear",
          pdfex: "🟡 Generally secure",
        },
        // Effort comparison
        {
          name: "Effort 🛠️",
          zapptales: "🔴 High: Requires desktop app and multiple steps",
          whatsAnalyze: "🟢 Minimal: Quick and straightforward on your phone",
          drfon: "🔴 High: Requires desktop app",
          longshotapp: "🟡 Medium: On phone but requires external app",
          pdfex: "🔴 High effort required",
        },
        // User can Print comparison
        {
          name: "User can Print 🖨️",
          zapptales: "🟡 Printable",
          whatsAnalyze:
            "🟢 Optimized for Printing: Perfect for books or booklets",
          drfon: "🟡 Printable",
          longshotapp: "🔴 Not printable",
          pdfex: "🟡 Printable",
        },
        // Analytics comparison
        {
          name: "Analytics 📊",
          zapptales: "🔴 No additional features",
          whatsAnalyze:
            "🟢 Comprehensive: Includes fun facts and detailed analysis",
          drfon: "🔴 No additional features",
          longshotapp: "🔴 No additional features",
          pdfex: "🔴 No additional features",
        },
        // iOS compatibility
        {
          name: "iOS Compatibility 📱",
          zapptales: "🟡 Compatible with iPhone",
          whatsAnalyze: "🟢 Fully optimized for iPhone",
          drfon: "🟡 Compatible with iPhone",
          longshotapp: "🔴 Android only",
          pdfex: "🔴 Complicated, requires external app",
        },
        // Android compatibility
        {
          name: "Android Compatibility 📱",
          zapptales: "🟡 Works with complications",
          whatsAnalyze: "🟢 Seamless experience on Android devices",
          drfon: "🟡 Works with complications",
          longshotapp: "🟢 Fully compatible",
          pdfex: "🔴 Requires external app",
        },
        // Free Preview comparison
        {
          name: "Free Preview 🔍",
          zapptales: "🔴 No preview available",
          whatsAnalyze: "🟢 Exclusive: Free preview with complete statistics",
          drfon: "🔴 No preview, subscription trial",
          longshotapp: "🔴 No trial available",
          pdfex: "🔴 Long and complicated process",
        },
        // Price comparison
        {
          name: "Price 💲",
          zapptales: "🔴 Expensive",
          whatsAnalyze: "🟢 Most affordable andbest value",
          drfon: "🔴 Expensive",
          longshotapp: "🟡 In-app purchases",
          pdfex: "🟡 Free, but with ads",
        },
        // Rating comparison
        {
          name: "Rating ⭐",
          zapptales: "🟡 Good",
          whatsAnalyze:
            "🟢 Excellent: Highest rating for security, affordability, and analytics",
          drfon: "🟡 Good",
          longshotapp: "🟡 Average",
          pdfex: "🟡 Average",
        },
      ],
    };
  },
  head: {
    title: "WhatsAnalyze - How to Export your WhatsApp Chat",
    meta: [
      {
        hid: "og:title",
        name: "og:title",
        property: "og:title",
        content: "WhatsAnalyze - How to Export your WhatsApp Chat",
      },
      {
        hid: "og:site_name",
        name: "og:site_name",
        property: "og:site_name",
        content: "WhatsAnalyze - How to Export your WhatsApp Chat",
      },
      {
        hid: "description",
        name: "description",
        property: "description",
        content: "Export your Whatsapp Chat ✓ iOS Tutorial ✓ Android Guide",
      },
      {
        hid: "og:description",
        name: "og:description",
        property: "og:description",
        content: "Export your Whatsapp Chat ✓ iOS Tutorial ✓ Android Guide",
      },
      {
        hid: "og:url",
        name: "og:url",
        property: "og:url",
        content: "whatsanalyze.com/how-to-export-your-whatsapp-chat",
      },
    ],
  },
};
</script>
<style>
.mt-5,
.my-5,
.mb-2,
.py-5 {
  margin-top: 20px; /* Adjust top margin */
  margin-bottom: 20px; /* Adjust bottom margin */
  padding-top: 20px; /* Adjust top padding */
  padding-bottom: 20px; /* Adjust bottom padding */
}

.styled-table {
  width: 100%;
  border-collapse: collapse;
}

.styled-table thead {
  background-color: #f4f4f4;
  color: #333;
  font-weight: bold;
}

.styled-table tbody tr:nth-child(odd) {
  background-color: #f9f9f9;
}

.styled-table tbody tr:hover {
  background-color: #f1f1f1;
}

.styled-table th,
.styled-table td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

@media (max-width: 600px) {
  .styled-table thead {
    display: none;
  }
  .styled-table,
  .styled-table tbody,
  .styled-table th,
  .styled-table td,
  .styled-table tr {
    display: block;
  }
  .styled-table td {
    position: relative;
    padding-left: 50%;
  }
  .styled-table td::before {
    position: absolute;
    top: 0;
    left: 6px;
    width: 45%;
    padding-right: 10px;
    white-space: nowrap;
    content: attr(data-label);
  }
}
</style>
