export function getTargetYear(): number {
  const now = new Date();
  // From November (month index 10) on, we wrap the current year: that is
  // when people start searching for this year's Wrapped. Before that, we wrap
  // the previous year.
  // Example: 01.11.2026 -> 2026
  //          31.10.2026 -> 2025
  return now.getMonth() >= 10 ? now.getFullYear() : now.getFullYear() - 1;
}
