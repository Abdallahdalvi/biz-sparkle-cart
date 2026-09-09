import { createServerFn } from "@tanstack/react-start";
import { getStorefrontCms, type StorefrontCms } from "@/lib/products";
import type { TrackingSettings } from "@/lib/tracking";

type PublicTrackingEnvironment = {
  GOOGLE_ANALYTICS_ID?: string;
  GOOGLE_ADS_ID?: string;
  GOOGLE_ADS_PURCHASE_LABEL?: string;
};

function validGa4Id(value: string) {
  return /^G-[A-Z0-9]+$/i.test(value) ? value.toUpperCase() : "";
}

function validGoogleAdsId(value: string) {
  return /^AW-\d+$/i.test(value) ? value.toUpperCase() : "";
}

export function resolveTrackingConfiguration(
  cms: StorefrontCms,
  environment: PublicTrackingEnvironment = {},
) {
  const environmentGa4Id = validGa4Id(environment.GOOGLE_ANALYTICS_ID?.trim() || "");
  const environmentGoogleAdsId = validGoogleAdsId(environment.GOOGLE_ADS_ID?.trim() || "");
  const googleAnalyticsId = validGa4Id(cms.tracking_google_analytics_id.trim()) || environmentGa4Id;
  const googleAdsId = validGoogleAdsId(cms.tracking_google_ads_id.trim()) || environmentGoogleAdsId;
  const googleAdsPurchaseLabel =
    cms.tracking_google_ads_purchase_label.trim() ||
    environment.GOOGLE_ADS_PURCHASE_LABEL?.trim() ||
    "";

  const tracking: TrackingSettings = {
    clarityEnabled: cms.tracking_clarity_enabled,
    clarityProjectId: cms.tracking_clarity_project_id,
    metaEnabled: cms.tracking_meta_enabled,
    metaPixelId: cms.tracking_meta_pixel_id,
    googleAnalyticsEnabled:
      (cms.tracking_google_analytics_enabled && Boolean(googleAnalyticsId)) ||
      Boolean(environmentGa4Id),
    googleAnalyticsId,
    googleAdsEnabled:
      (cms.tracking_google_ads_enabled && Boolean(googleAdsId)) || Boolean(environmentGoogleAdsId),
    googleAdsId,
    googleAdsPurchaseLabel,
  };

  return {
    tracking,
    metaDomainVerification: cms.tracking_meta_domain_verification,
  };
}

export const getTrackingConfiguration = createServerFn({ method: "GET" }).handler(async () => {
  const cms = await getStorefrontCms();
  return resolveTrackingConfiguration(cms, process.env);
});
