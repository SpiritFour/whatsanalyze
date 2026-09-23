import { h } from "vue";
import { aliases, mdi as mdiSvg } from "vuetify/iconsets/mdi-svg";
import { mdiPaths } from "~/utils/mdiPaths";

// Vuetify's `mdi` set is the webfont: 300 KB of render-blocking CSS naming
// every one of the 7,462 Material icons, and a 393 KB woff2, to draw the 72
// this site uses. This set takes the same `mdi-...` strings the templates
// already pass and hands Vuetify's SVG renderer the one path it needs, so no
// call site changes and neither the CSS nor the font ships.
//
// `aliases` is Vuetify's own internal set (the dialog close button, the field
// clear button, the rating stars); its values are already path data and pass
// straight through.
const mdiByName = {
  component: (props, context) =>
    h(
      mdiSvg.component,
      {
        ...props,
        icon:
          typeof props.icon === "string" && props.icon.startsWith("mdi-")
            ? mdiPaths[props.icon] || ""
            : props.icon,
      },
      context.slots,
    ),
};

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("vuetify:configuration", ({ vuetifyOptions }) => {
    vuetifyOptions.icons = {
      defaultSet: "mdiByName",
      aliases,
      sets: { mdiByName },
    };
  });
});
