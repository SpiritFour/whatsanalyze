export const CATEGORY_HOME = "home";

export const GTAG_FILE = "file";
export const GTAG_RESULTS = "results";
export const GTAG_PDF = "pdf";
export const GTAG_PAYMENT = "payment";
export const GTAG_INSTALL = "install";
export const GTAG_LEAD = "lead";
export const GTAG_INTERACTION = "interaction";
export const GTAG_NUM_PERSONS = "num_persons";

export function gtagEvent(action, label, value = "1") {
  window.$nuxt.$gtag.event(label + "_" + action, {
    event_category: CATEGORY_HOME,
    event_label: label,
    value: String(value),
  });
}
