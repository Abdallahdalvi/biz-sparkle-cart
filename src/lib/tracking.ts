export type TrackingConsent = {
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: 1;
};

export type TrackingSettings = {
  clarityEnabled: boolean;
  clarityProjectId: string;
  metaEnabled: boolean;
  metaPixelId: string;
  googleAnalyticsEnabled: boolean;
  googleAnalyticsId: string;
  googleAdsEnabled: boolean;
  googleAdsId: string;
  googleAdsPurchaseLabel: string;
};

export type TrackingItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_variant?: string;
};

export type CommerceEvent = "view_item" | "add_to_cart" | "begin_checkout" | "purchase";

export type CommerceEventData = {
  value: number;
  currency?: "INR";
  items: TrackingItem[];
  transactionId?: string;
  contentCategory?: string;
};

type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
  push?: (...args: unknown[]) => void;
};
type Clarity = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    fbq?: Fbq;
    _fbq?: Fbq;
    clarity?: Clarity;
    __aghanimsTrackingSettings?: TrackingSettings;
  }
}

export const TRACKING_CONSENT_KEY = "aghanims-tracking-consent-v1";
export const TRACKING_PREFERENCES_EVENT = "aghanims:open-tracking-preferences";

export function readTrackingConsent(): TrackingConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(TRACKING_CONSENT_KEY) || "null",
    ) as Partial<TrackingConsent> | null;
    if (!parsed || parsed.version !== 1) return null;
    return {
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      updatedAt: String(parsed.updatedAt || ""),
      version: 1,
    };
  } catch {
    return null;
  }
}

export function saveTrackingConsent(consent: Pick<TrackingConsent, "analytics" | "marketing">) {
  const value: TrackingConsent = {
    ...consent,
    updatedAt: new Date().toISOString(),
    version: 1,
  };
  window.localStorage.setItem(TRACKING_CONSENT_KEY, JSON.stringify(value));
  return value;
}

export function openTrackingPreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TRACKING_PREFERENCES_EVENT));
  }
}

export function hasConfiguredTracking(settings: TrackingSettings) {
  return Boolean(
    (settings.clarityEnabled && settings.clarityProjectId) ||
    (settings.metaEnabled && settings.metaPixelId) ||
    (settings.googleAnalyticsEnabled && settings.googleAnalyticsId) ||
    (settings.googleAdsEnabled && settings.googleAdsId),
  );
}

function metaEventName(event: CommerceEvent) {
  return {
    view_item: "ViewContent",
    add_to_cart: "AddToCart",
    begin_checkout: "InitiateCheckout",
    purchase: "Purchase",
  }[event];
}

function contentIds(items: TrackingItem[]) {
  return items.map((item) => item.item_id);
}

function createEventId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function purchaseAlreadyTracked(transactionId?: string) {
  if (!transactionId || typeof window === "undefined") return false;
  const key = `aghanims-tracked-purchase:${transactionId}`;
  if (window.localStorage.getItem(key)) return true;
  window.localStorage.setItem(key, new Date().toISOString());
  return false;
}

export function trackPageView(path: string) {
  if (typeof window === "undefined" || path.startsWith("/admin")) return;

  window.gtag?.("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
  window.fbq?.("track", "PageView", {}, { eventID: createEventId("pageview") });
  window.clarity?.("event", "spa_page_view");
}

export function trackCommerceEvent(event: CommerceEvent, data: CommerceEventData) {
  if (typeof window === "undefined") return;
  if (!window.gtag && !window.fbq && !window.clarity) return;
  if (event === "purchase" && purchaseAlreadyTracked(data.transactionId)) return;

  const currency = data.currency || "INR";
  const eventId =
    event === "purchase" && data.transactionId
      ? `purchase_${data.transactionId}`
      : createEventId(event);
  window.gtag?.("event", event, {
    currency,
    value: data.value,
    transaction_id: data.transactionId,
    items: data.items,
  });

  window.fbq?.(
    "track",
    metaEventName(event),
    {
      content_ids: contentIds(data.items),
      content_name: data.items.map((item) => item.item_name).join(", "),
      content_type: "product",
      content_category: data.contentCategory,
      contents: data.items.map((item) => ({
        id: item.item_id,
        quantity: item.quantity,
        item_price: item.price,
      })),
      currency,
      num_items: data.items.reduce((sum, item) => sum + item.quantity, 0),
      value: data.value,
    },
    { eventID: eventId },
  );

  window.clarity?.("event", event);

  const settings = window.__aghanimsTrackingSettings;
  if (
    event === "purchase" &&
    settings?.googleAdsEnabled &&
    settings.googleAdsId &&
    settings.googleAdsPurchaseLabel
  ) {
    window.gtag?.("event", "conversion", {
      send_to: `${settings.googleAdsId}/${settings.googleAdsPurchaseLabel}`,
      value: data.value,
      currency,
      transaction_id: data.transactionId,
    });
  }
}

export function trackLead(contentName: string) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", "generate_lead", { content_name: contentName });
  window.fbq?.("track", "Lead", { content_name: contentName }, { eventID: createEventId("lead") });
  window.clarity?.("event", "generate_lead");
}
