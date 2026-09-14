export function getTargetYear(): number {
  const now = new Date();
  // If we are in December (month index 11), we use the current year.
  // Otherwise, we wrap the previous year.
  // Example: 01.12.2025 -> 2025
  //          30.11.2025 -> 2024
  return now.getMonth() >= 11 ? now.getFullYear() : now.getFullYear() - 1;
}
