<template>
  <div class="nav pl-xs-8 pl-0 py-0 py-md-0 additional-height">
    <v-container class="pl-md-16">
      <v-card color="#21a68d" flat>
        <v-card-actions
          class="d-flex align-center flex-nowrap py-2 px-1 px-sm-3"
        >
          <nuxt-link :to="$localePath('/')" class="brand-link">
            <img
              alt="WhatsAnalyze Logo"
              class="brand-logo"
              src="~/assets/whatsanalyze-logo-black.png"
            />
            <span class="brand-name">WhatsAnalyze</span>
          </nuxt-link>

          <v-spacer></v-spacer>

          <v-menu
            open-on-hover
            :open-delay="60"
            :close-delay="160"
            :close-on-content-click="true"
            offset="8"
            location="bottom end"
          >
            <template #activator="{ props: menuProps }">
              <nuxt-link
                v-bind="menuProps"
                :to="$localePath('/tools')"
                class="header-tools-link"
              >
                <v-icon size="16" class="mr-1" color="#000000"
                  >mdi-toolbox-outline</v-icon
                >
                <span>{{ $t("toolsHub.headerTools") || "Tools" }}</span>
                <v-icon size="14" class="ml-1" color="#000000"
                  >mdi-chevron-down</v-icon
                >
              </nuxt-link>
            </template>

            <div class="tools-dropdown-menu">
              <!-- Group 1: Chat Analytics -->
              <div class="dropdown-group-label">
                <v-icon size="13" class="mr-1" color="#21a68d"
                  >mdi-chart-box-outline</v-icon
                >
                {{ $t("toolsHub.analyticsGroupTitle") || "Chat Analytics" }}
              </div>
              <nuxt-link
                v-for="tool in analyticsTools"
                :key="tool.to"
                :to="$localePath(tool.to)"
                class="dropdown-tool-item"
              >
                <div class="dropdown-icon" :style="{ background: tool.bg }">
                  <v-icon size="16" :color="tool.color">{{ tool.icon }}</v-icon>
                </div>
                <div class="dropdown-text">
                  <span class="dropdown-title">{{ $t(tool.titleKey) }}</span>
                  <span class="dropdown-desc">{{ $t(tool.descKey) }}</span>
                </div>
              </nuxt-link>

              <div class="dropdown-divider"></div>

              <!-- Group 2: Court & Legal Evidence -->
              <div class="dropdown-group-label dropdown-group-label--court">
                <v-icon size="13" class="mr-1" color="#818cf8"
                  >mdi-shield-check-outline</v-icon
                >
                {{ $t("toolsHub.courtGroupTitle") || "Official Documentation" }}
              </div>
              <nuxt-link
                v-for="tool in courtTools"
                :key="tool.to"
                :to="$localePath(tool.to)"
                class="dropdown-tool-item dropdown-tool-item--court"
              >
                <div class="dropdown-icon" :style="{ background: tool.bg }">
                  <v-icon size="16" :color="tool.color">{{ tool.icon }}</v-icon>
                </div>
                <div class="dropdown-text">
                  <div class="d-flex align-center justify-space-between">
                    <span class="dropdown-title">{{ $t(tool.titleKey) }}</span>
                    <span class="dropdown-badge">PDF</span>
                  </div>
                  <span class="dropdown-desc">{{ $t(tool.descKey) }}</span>
                </div>
              </nuxt-link>
            </div>
          </v-menu>

          <v-btn
            v-if="$vuetify.display.smAndUp"
            :to="$localePath('/')"
            color="black"
            variant="flat"
            class="header-cta-btn font-weight-bold text-white mr-2 mr-md-4 px-4"
            style="border-radius: 10px; text-transform: none !important"
          >
            <v-icon size="16" class="mr-1">mdi-message-text-outline</v-icon>
            {{ analyzeButtonText }}
          </v-btn>

          <LanguageSwitcher />
        </v-card-actions>
      </v-card>
    </v-container>
  </div>
</template>
<script>
import LanguageSwitcher from "./LanguageSwitcher.vue";

export default {
  name: "GlobalHeader",
  components: { LanguageSwitcher },
  computed: {
    analyzeButtonText() {
      const map = {
        de: "Chat analysieren",
        es: "Analizar chat",
        fr: "Analyser le chat",
        pt: "Analisar conversa",
        it: "Analizza chat",
      };
      return map[this.$i18n.locale] || "Analyze Chat";
    },
    analyticsTools() {
      return [
        {
          to: "/tools/inactivity",
          icon: "mdi-timer-sand",
          color: "#21a68d",
          bg: "rgba(33, 166, 141, 0.12)",
          titleKey: "toolsHub.toolInactivityTitle",
          descKey: "toolsHub.toolInactivityText",
        },
        {
          to: "/tools/message-counter",
          icon: "mdi-counter",
          color: "#d97706",
          bg: "rgba(217, 119, 6, 0.12)",
          titleKey: "toolsHub.toolCounterTitle",
          descKey: "toolsHub.toolCounterText",
        },
        {
          to: "/tools/word-counter",
          icon: "mdi-format-letter-case",
          color: "#9333ea",
          bg: "rgba(147, 51, 234, 0.12)",
          titleKey: "toolsHub.toolVocabularyTitle",
          descKey: "toolsHub.toolVocabularyText",
        },
        {
          to: "/tools/chat-heatmap",
          icon: "mdi-clock-time-four-outline",
          color: "#0284c7",
          bg: "rgba(2, 132, 199, 0.12)",
          titleKey: "toolsHub.toolHeatmapTitle",
          descKey: "toolsHub.toolHeatmapText",
        },
      ];
    },
    courtTools() {
      return [
        {
          to: "/tools/court-evidence",
          icon: "mdi-scale-balance",
          color: "#6366f1",
          bg: "rgba(99, 102, 241, 0.12)",
          titleKey: "toolsHub.toolCourtTitle",
          descKey: "toolsHub.toolCourtText",
        },
        {
          to: "/tools/proof-of-relationship",
          icon: "mdi-heart-outline",
          color: "#e11d48",
          bg: "rgba(225, 29, 72, 0.12)",
          titleKey: "toolsHub.toolRelationshipTitle",
          descKey: "toolsHub.toolRelationshipText",
        },
      ];
    },
  },
};
</script>
<style lang="scss" scoped>
hr {
  margin: auto;
  margin-top: 1em;
  margin-bottom: 1em;
  border-top: none;
}

a:link {
  color: $c-white !important;
  text-decoration: none;
}

a:visited {
  color: $c-white !important;
}

a:hover {
  color: $c-blue-dark !important;
}

.brand-link {
  display: inline-flex !important;
  align-items: center !important;
  text-decoration: none !important;
  white-space: nowrap !important;
  flex-shrink: 0;
}

.brand-logo {
  height: 34px;
  width: auto;
  margin-right: 10px;
  flex-shrink: 0;
  display: block;

  @media (max-width: 600px) {
    height: 26px;
    margin-right: 6px;
  }
}

.brand-name {
  color: #000000 !important;
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  white-space: nowrap;
  line-height: 1;

  @media (max-width: 600px) {
    font-size: 1.2rem;
  }
}

.header-tools-link,
.header-tools-link:link,
.header-tools-link:visited {
  display: inline-flex !important;
  align-items: center !important;
  color: #000000 !important;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.12);
  font-weight: 700;
  font-size: 0.85rem;
  padding: 6px 14px;
  border-radius: 10px;
  text-decoration: none !important;
  white-space: nowrap;
  transition: all 0.2s ease;
  margin-right: 8px;
  flex-shrink: 0;

  &:hover {
    background: #ffffff;
    color: #000000 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  @media (max-width: 600px) {
    font-size: 0.8rem;
    padding: 4px 10px;
    margin-right: 6px;
  }
}

.nav {
  width: 100%;
  background: $c-blue-accent;
}

.tools-dropdown-menu {
  background: #ffffff;
  color: #1e293b;
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 8px;
  width: 330px;
  max-width: 90vw;
}

.dropdown-group-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #64748b;
  padding: 6px 10px 4px;
  display: flex;
  align-items: center;

  &--court {
    color: #4f46e5;
  }
}

.dropdown-tool-item {
  display: flex !important;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  text-decoration: none !important;
  color: inherit !important;
  transition: background 0.15s ease;

  &:hover {
    background: #f1f5f9;
  }

  &--court:hover {
    background: #eef2ff;
  }
}

.dropdown-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dropdown-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex-grow: 1;
}

.dropdown-title {
  font-weight: 700;
  font-size: 0.84rem;
  color: #0f172a !important;
  line-height: 1.25;
}

.dropdown-desc {
  font-size: 0.72rem;
  color: #64748b !important;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  margin-top: 1px;
}

.dropdown-badge {
  font-size: 0.62rem;
  font-weight: 700;
  background: #e0e7ff;
  color: #4338ca;
  padding: 1px 5px;
  border-radius: 4px;
}

.dropdown-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 6px 4px;
}
</style>
