export function scrollTo(selector, { offset = 0 } = {}) {
  const element = document.querySelector(selector);
  if (!element) return;

  window.scrollTo({
    top: element.getBoundingClientRect().top + window.scrollY - offset,
    behavior: "smooth",
  });
}

/**
 * Scroll there now, and once more when the page has settled. The charts above
 * the target are still being laid out and keep pushing it down, so the first
 * scroll on its own lands short — and waiting only for the second one looks
 * like the click did nothing.
 */
export function scrollToSettled(selector, options = {}) {
  scrollTo(selector, options);
  setTimeout(() => scrollTo(selector, options), 400);
}
