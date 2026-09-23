import { injectHead } from "#imports";

// Vuetify writes the theme classes (`text-primary`, `bg-surface`, …) into a
// <style> tag of its own at runtime, where the build-time cascade fix in
// config/postcss-vuetify-v3-cascade.mjs cannot reach them. v4 wraps them in
// cascade layers without `!important`, so they lose to the component styles,
// the v-rating's `color="primary"` among them. This rewrites the tag the way
// Vuetify 3 wrote it: unlayered and `!important`.
const unlayer = (css) => {
  let out = "";
  const closesLayer = [];
  for (let i = 0; i < css.length; i++) {
    const layer = /^@layer [\w-]+ \{/.exec(css.slice(i, i + 64));
    if (layer) {
      closesLayer.push(true);
      i += layer[0].length - 1;
    } else if (css[i] === "{") {
      closesLayer.push(false);
      out += "{";
    } else if (css[i] === "}") {
      if (!closesLayer.pop()) out += "}";
    } else {
      out += css[i];
    }
  }
  return out;
};

export default defineNuxtPlugin(() => {
  injectHead().hooks.hook("tags:resolve", ({ tags }) => {
    for (const tag of tags) {
      if (tag.props.id !== "vuetify-theme-stylesheet" || !tag.textContent) {
        continue;
      }
      tag.textContent = unlayer(tag.textContent).replace(
        /(\s)((?:background-)?color): ([^;!]+);/g,
        "$1$2: $3 !important;",
      );
    }
  });
});
