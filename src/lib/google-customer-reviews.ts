const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateFromTrackingEstimate(value: string | null | undefined) {
  const match = value?.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (match) {
    const date = new Date(`${match[1]}T12:00:00Z`);
    if (!Number.isNaN(date.getTime())) return match[1];
  }

  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(parsed) ? null : formatDate(new Date(parsed));
}

function deliveryDaysFromTimeline(value: string) {
  let longestDays = 0;
  const matches = value.matchAll(
    /\b(\d+)(?:\s*(?:-|–|to)\s*(\d+))?\s*(?:business\s+)?(day|week)s?\b/gi,
  );

  for (const match of matches) {
    const quantity = Math.max(Number(match[1]) || 0, Number(match[2]) || 0);
    const days = match[3].toLowerCase() === "week" ? quantity * 7 : quantity;
    longestDays = Math.max(longestDays, days);
  }

  return longestDays;
}

/**
 * Google Customer Reviews needs a calendar date, not a delivery text range.
 * Shiprocket's real ETA takes precedence; otherwise use the longest configured
 * item timeline so mixed-product orders are not promised too early.
 */
export function getGoogleCustomerReviewsDeliveryDate(input: {
  createdAt: string;
  trackingEstimate?: string | null;
  productDeliveryEstimates?: Array<string | null | undefined>;
}) {
  const trackedDate = dateFromTrackingEstimate(input.trackingEstimate);
  if (trackedDate) return trackedDate;

  const placedAt = new Date(input.createdAt);
  const safePlacedAt = Number.isNaN(placedAt.getTime()) ? new Date() : placedAt;
  const longestConfiguredTimeline = Math.max(
    0,
    ...(input.productDeliveryEstimates || []).map((estimate) =>
      deliveryDaysFromTimeline(estimate || ""),
    ),
  );
  const fallbackDeliveryDays = 7;
  return formatDate(new Date(safePlacedAt.getTime() + Math.max(longestConfiguredTimeline, fallbackDeliveryDays) * DAY_MS));
}
