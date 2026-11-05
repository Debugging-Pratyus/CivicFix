/**
 * Generates unique, human-readable complaint tracking IDs.
 * Format: CF-YYYY-XXXXXXXX  (CF = CivicFix, 8-char uppercase hex)
 * Example: CF-2026-A3F12B09
 */

export function generateTrackingId(): string {
  const year = new Date().getFullYear();
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `CF-${year}-${hex}`;
}
