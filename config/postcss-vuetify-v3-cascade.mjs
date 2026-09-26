import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Vuetify 4 wraps all of its CSS in cascade layers and dropped the
// `!important` from its utility classes (`pt-8`, `text-center`, …). Both flip
// who wins against our own CSS: unlayered styles now beat every Vuetify rule
// whatever their specificity, and Tailwind classes beat the Vuetify utilities
// they share an element with. The site was built against v3's cascade, so this
// puts it back: Vuetify's layers are unwrapped in place and the utilities are
// `!important` again.
//
// A few components also changed their own look in v4 (the grid, VBtn, …). For
// those, assets/vuetify-v3/ keeps v3's stylesheet, served in place of v4's.
const v3Dir = fileURLToPath(new URL("../assets/vuetify-v3/", import.meta.url));

const v3Stylesheet = (file) => {
  const component = /\/components\/V\w+\/(V\w+)\.s?[ac]ss(?:\?|$)/.exec(
    file,
  )?.[1];
  const path = component && `${v3Dir}${component}.css`;
  return path && existsSync(path) ? readFileSync(path, "utf8") : null;
};

const vuetifyV3Cascade = () => ({
  postcssPlugin: "vuetify-v3-cascade",
  OnceExit(root, { postcss }) {
    const file = root.source?.input.file ?? "";
    const v3 = v3Stylesheet(file);
    if (v3) {
      root.removeAll();
      root.append(postcss.parse(v3, { from: file }).nodes);
      return;
    }

    // v4 writes translucent theme colours as color-mix(), which Chrome blends
    // a shade differently from v3's rgba() (the focused text field's overlay).
    root.walkDecls((decl) => {
      decl.value = decl.value.replace(
        /color-mix\(in srgb,\s*rgb\((var\(--v-theme-[\w-]+\))\)\s+calc\((.+?)\s*\*\s*100%\),\s*transparent\)/g,
        "rgba($1, $2)",
      );
    });

    const layers = [];
    root.walkAtRules("layer", (atRule) => {
      // The inner layers (`reset`, `typography`, …) only mean anything inside
      // a Vuetify one.
      let outer = atRule;
      while (outer.parent?.type === "atrule" && outer.parent.name === "layer") {
        outer = outer.parent;
      }
      if (/^vuetify-/.test(outer.params)) layers.push([atRule, outer]);
    });

    // Innermost first, so each layer is still inside its parent when reached.
    for (const [atRule, outer] of layers.reverse()) {
      // `@layer a, b;` only declares the order.
      if (!atRule.nodes) {
        atRule.remove();
        continue;
      }
      if (/^vuetify-utilities\b/.test(outer.params)) {
        atRule.walkDecls((decl) => {
          if (!decl.prop.startsWith("--")) decl.important = true;
        });
      }
      atRule.replaceWith(atRule.nodes);
    }
  },
});
vuetifyV3Cascade.postcss = true;

export default vuetifyV3Cascade;
