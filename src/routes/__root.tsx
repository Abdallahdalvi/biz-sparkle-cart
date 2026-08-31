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
    return { tracking };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Aghanims Phones and Gadgets — Premium Tech Store" },
      {
        name: "description",
        content:
          "Boutique tech: keypad Androids, minimalist daily drivers, and precision-engineered gadgets. Shipping across India.",
      },
      { name: "author", content: "Aghanims Phones and Gadgets" },
      { property: "og:title", content: "Aghanims Phones and Gadgets — Premium Tech Store" },
      {
        property: "og:description",
        content:
          "Boutique tech: keypad Androids, minimalist daily drivers, and precision-engineered gadgets. Shipping across India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Aghanims Phones and Gadgets — Premium Tech Store" },
      {
        name: "twitter:description",
        content:
          "Boutique tech: keypad Androids, minimalist daily drivers, and precision-engineered gadgets. Shipping across India.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c8e38c11-c137-4a3f-aa51-4cb8ab4e9e0b/id-preview-d342fd9e--40a3ae82-080c-4e68-8561-161d6a73169b.lovable.app-1782123698453.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c8e38c11-c137-4a3f-aa51-4cb8ab4e9e0b/id-preview-d342fd9e--40a3ae82-080c-4e68-8561-161d6a73169b.lovable.app-1782123698453.png",
      },
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
