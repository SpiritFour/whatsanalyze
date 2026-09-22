import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

export default [
  {
    ignores: [
      "tests/**",
      "static/sw.js",
      ".delta/**",
      ".direnv/**",
      ".idea/**",
      ".nuxt/**",
      "coverage/**",
      "dist/**",
      "functions/lib/**",
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  eslintConfigPrettier,
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.ts", "**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 12,
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        // Nuxt/Vue auto-imports and macros: not statically analyzable, so
        // eslint has to be told they exist rather than flagging them as
        // undefined.
        defineI18nConfig: "readonly",
        defineNuxtConfig: "readonly",
        defineNuxtPlugin: "readonly",
        queryCollection: "readonly",
        useAsyncData: "readonly",
        useRuntimeConfig: "readonly",
        useSeoMeta: "readonly",
        useI18n: "readonly",
        useSwitchLocalePath: "readonly",
        navigateTo: "readonly",
        clearError: "readonly",
        computed: "readonly",
        ref: "readonly",
        useHead: "readonly",
        useLocalePath: "readonly",
        defineProps: "readonly",
        definePageMeta: "readonly",
        useSharedChat: "readonly",
        useRoute: "readonly",
        useRouter: "readonly",
        useNuxtApp: "readonly",
        useState: "readonly",
        useOneTimePurchase: "readonly",
        restoreOneTimePurchase: "readonly",
        persistOneTimePurchase: "readonly",
        rememberOneTimeCheckoutChat: "readonly",
        unlocksChat: "readonly",
        toRaw: "readonly",
        defineEmits: "readonly",
        withDefaults: "readonly",
        onMounted: "readonly",
        useToolsNav: "readonly",
        useToolBreadcrumbs: "readonly",
        useToolSchema: "readonly",
        scrollToDropzone: "readonly",
        storeToRefs: "readonly",
        defineEventHandler: "readonly",
        setHeader: "readonly",
      },
    },
    rules: {
      "vue/no-multiple-template-root": "off",
      "no-unused-vars": [
        "error",
        { caughtErrorsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
      // eslint-plugin-vue's flat/recommended promotes these past where v7's
      // plugin:vue/recommended had them. Enforcing them now means renaming
      // ~30 existing single-word components and auditing every v-html on a
      // component, which is unrelated churn for a dependency bump.
      "vue/multi-word-component-names": "off",
      "vue/no-reserved-component-names": "off",
      "vue/no-v-text-v-html-on-component": "off",
    },
  },
  {
    // Flat config dropped support for the `/* eslint-env jest */` comments
    // these spec files used, so their globals need to be declared here.
    files: ["**/*.spec.js"],
    languageOptions: {
      globals: globals.jest,
    },
  },
];
