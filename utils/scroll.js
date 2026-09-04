export function scrollTo(selector, { offset = 0 } = {}) {
  const element = document.querySelector(selector);
  if (!element) return;

  window.scrollTo({
    top: element.getBoundingClientRect().top + window.scrollY - offset,
    behavior: "smooth",
  });
}
