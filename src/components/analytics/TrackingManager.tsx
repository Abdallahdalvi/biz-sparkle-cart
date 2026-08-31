import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  TRACKING_PREFERENCES_EVENT,
  hasConfiguredTracking,
  readTrackingConsent,
  saveTrackingConsent,
  trackPageView,
  type TrackingConsent,
  type TrackingSettings,
} from "@/lib/tracking";

function addScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function ensureGoogleTag(settings: TrackingSettings) {
  const primaryId = settings.googleAnalyticsEnabled
    ? settings.googleAnalyticsId
    : settings.googleAdsEnabled
      ? settings.googleAdsId
      : "";
  if (!primaryId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
  window.gtag("js", new Date());
  if (settings.googleAnalyticsEnabled && settings.googleAnalyticsId) {
    window.gtag("config", settings.googleAnalyticsId, { send_page_view: false });
  }
  if (settings.googleAdsEnabled && settings.googleAdsId) {
    window.gtag("config", settings.googleAdsId, { send_page_view: false });
  }
  addScript("aghanims-google-tag", `https://www.googletagmanager.com/gtag/js?id=${primaryId}`);
}

function ensureMetaPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  } as NonNullable<Window["fbq"]>;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = fbq;
  window.fbq = fbq;
  window._fbq = fbq;
  addScript("aghanims-meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", pixelId);
}

function ensureClarity(projectId: string) {
  if (!projectId || window.clarity) return;
  const clarity = function (...args: unknown[]) {
    clarity.q = clarity.q || [];
    clarity.q.push(args);
  } as NonNullable<Window["clarity"]>;
  window.clarity = clarity;
  addScript("aghanims-clarity", `https://www.clarity.ms/tag/${projectId}`);
}

function applyConsent(settings: TrackingSettings, consent: TrackingConsent) {
  window.gtag?.("consent", "update", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  });

  if (consent.analytics && settings.clarityEnabled) ensureClarity(settings.clarityProjectId);
  if (consent.marketing && settings.metaEnabled) ensureMetaPixel(settings.metaPixelId);
}

export function TrackingManager({ settings }: { settings: TrackingSettings }) {
  const location = useLocation();
  const configured = hasConfiguredTracking(settings);
  const [consent, setConsent] = useState<TrackingConsent | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(true);
  const [draftMarketing, setDraftMarketing] = useState(true);
  const lastPage = useRef("");

  useEffect(() => {
    if (!configured || location.pathname.startsWith("/admin")) return;
    window.__aghanimsTrackingSettings = settings;
    ensureGoogleTag(settings);
    const saved = readTrackingConsent();
    if (saved) {
      setConsent(saved);
      setDraftAnalytics(saved.analytics);
      setDraftMarketing(saved.marketing);
      applyConsent(settings, saved);
    } else {
      setPanelOpen(true);
    }
  }, [configured, location.pathname, settings]);

  useEffect(() => {
    const open = () => {
      const saved = readTrackingConsent();
      setDraftAnalytics(saved?.analytics ?? true);
      setDraftMarketing(saved?.marketing ?? true);
      setCustomizing(true);
      setPanelOpen(true);
    };
    window.addEventListener(TRACKING_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(TRACKING_PREFERENCES_EVENT, open);
  }, []);

  useEffect(() => {
    if (!configured || location.pathname.startsWith("/admin")) return;
    const path = `${location.pathname}${location.searchStr || ""}`;
    if (lastPage.current === path) return;
    lastPage.current = path;
    trackPageView(path);
  }, [configured, consent, location.pathname, location.searchStr]);

  if (!configured || location.pathname.startsWith("/admin") || !panelOpen) return null;

  const choose = (analytics: boolean, marketing: boolean) => {
    const previous = readTrackingConsent();
    const next = saveTrackingConsent({ analytics, marketing });
    const revokedPreviouslyGrantedCategory = Boolean(
      previous && ((previous.analytics && !analytics) || (previous.marketing && !marketing)),
    );
    setConsent(next);
    setDraftAnalytics(analytics);
    setDraftMarketing(marketing);
    applyConsent(settings, next);
    setPanelOpen(false);
    setCustomizing(false);
    lastPage.current = "";
    if (revokedPreviouslyGrantedCategory) window.location.reload();
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl border border-outline bg-white p-4 shadow-2xl sm:inset-x-6 sm:bottom-6 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined mt-0.5 text-xl text-primary">cookie</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-primary">Your privacy choices</h2>
          <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
            We use optional analytics to improve the store and advertising cookies to measure ads.
            Essential cart, sign-in, and security storage always remain active. Read our{" "}
            <Link to="/legal/privacy" className="font-bold underline">
              Privacy Policy
            </Link>
            .
          </p>

          {customizing && (
            <div className="mt-4 grid gap-3 border-y border-outline-variant/30 py-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={draftAnalytics}
                  onChange={(event) => setDraftAnalytics(event.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-xs font-bold text-primary">Analytics</span>
                  <span className="block text-[11px] leading-relaxed text-on-surface-variant">
                    Microsoft Clarity and Google Analytics.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={draftMarketing}
                  onChange={(event) => setDraftMarketing(event.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-xs font-bold text-primary">Advertising</span>
                  <span className="block text-[11px] leading-relaxed text-on-surface-variant">
                    Meta Pixel and Google Ads conversion measurement.
                  </span>
                </span>
              </label>
            </div>
          )}

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => choose(false, false)}
              className="border border-outline px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-primary"
            >
              Reject optional
            </button>
            {customizing ? (
              <button
                type="button"
                onClick={() => choose(draftAnalytics, draftMarketing)}
                className="bg-primary px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-on-primary"
              >
                Save choices
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setCustomizing(true)}
                  className="border border-outline px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-primary"
                >
                  Customize
                </button>
                <button
                  type="button"
                  onClick={() => choose(true, true)}
                  className="bg-primary px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-on-primary"
                >
                  Accept all
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
