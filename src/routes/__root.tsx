import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { SiteShell } from "@/components/layout/SiteShell";
import { TrackingManager } from "@/components/analytics/TrackingManager";
import { getStorefrontCms } from "@/lib/products";
import type { TrackingSettings } from "@/lib/tracking";
import { SITE_DESCRIPTION, SITE_NAME, SITE_SOCIAL_IMAGE_URL, SITE_URL } from "@/lib/site";

function NotFoundComponent() {
  return (
    <SiteShell>
      <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-7xl font-bold text-primary">404</h1>
          <h2 className="mt-4 text-2xl font-bold text-foreground">Page not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The boutique hardware page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded bg-primary px-8 py-3 text-xs font-bold uppercase tracking-widest text-on-primary transition-colors hover:opacity-90 shadow-sm"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <SiteShell>
      <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold tracking-tight text-primary">This page didn't load</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Something went wrong in our rendering engine. You can try refreshing the telemetry or
            head back home.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                router.invalidate();
                reset();
              }}
              className="inline-flex items-center justify-center rounded bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-primary transition-colors hover:opacity-90 shadow-sm"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded border border-input bg-background px-6 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-accent shadow-sm"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    const cms = await getStorefrontCms();
    const tracking: TrackingSettings = {
      clarityEnabled: cms.tracking_clarity_enabled,
      clarityProjectId: cms.tracking_clarity_project_id,
      metaEnabled: cms.tracking_meta_enabled,
      metaPixelId: cms.tracking_meta_pixel_id,
      googleAnalyticsEnabled: cms.tracking_google_analytics_enabled,
      googleAnalyticsId: cms.tracking_google_analytics_id,
      googleAdsEnabled: cms.tracking_google_ads_enabled,
      googleAdsId: cms.tracking_google_ads_id,
      googleAdsPurchaseLabel: cms.tracking_google_ads_purchase_label,
    };
    return {
      tracking,
      metaDomainVerification: cms.tracking_meta_domain_verification,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${SITE_NAME} — Hard-to-find phones and gadgets` },
      {
        name: "description",
        content: SITE_DESCRIPTION,
      },
      { name: "author", content: SITE_NAME },
      { property: "og:title", content: `${SITE_NAME} — Hard-to-find phones and gadgets` },
      {
        property: "og:description",
        content: SITE_DESCRIPTION,
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: SITE_SOCIAL_IMAGE_URL },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${SITE_NAME} — Hard-to-find phones and gadgets` },
      {
        name: "twitter:description",
        content: SITE_DESCRIPTION,
      },
      { name: "twitter:image", content: SITE_SOCIAL_IMAGE_URL },
      ...(loaderData?.metaDomainVerification
        ? [
            {
              name: "facebook-domain-verification",
              content: loaderData.metaDomainVerification,
            },
          ]
        : []),
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { tracking } = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <TrackingManager settings={tracking} />
      <ClientToaster />
    </QueryClientProvider>
  );
}

function ClientToaster() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <Toaster richColors position="top-center" />;
}
