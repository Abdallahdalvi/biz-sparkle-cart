import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { getStorefrontCms, type StorefrontCms } from "@/lib/products";

export const Route = createFileRoute("/legal/about")({
  loader: async () => {
    const cms = await getStorefrontCms();
    return { cms };
  },
  head: () => ({
    meta: [
      { title: "About TECHLAB" },
      {
        name: "description",
        content:
          "TECHLAB is a boutique technology store curating niche, tactile, minimalist hardware.",
      },
      { property: "og:title", content: "About TECHLAB" },
      {
        property: "og:description",
        content: "A boutique technology store curating niche, tactile hardware.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { cms } = Route.useLoaderData() as { cms: StorefrontCms };

  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12 md:py-16">
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            <Link to="/" className="hover:text-primary">Home</Link> / About Us
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary max-w-2xl">
            {cms.about_title || "About TECHLAB"}
          </h1>
          <p className="text-lg font-medium text-on-surface-variant mt-4 max-w-2xl leading-relaxed">
            {cms.about_subtitle}
          </p>
        </div>

        {cms.about_image && (
          <div className="my-12 aspect-[16/9] w-full overflow-hidden border border-outline-variant/40 bg-white shadow-sm rounded">
            <img
              src={cms.about_image}
              alt="TechLab Workspace"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 my-12">
          <div className="bg-surface-container-lowest border border-outline-variant/40 p-8 rounded shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Our Story & Background
            </h2>
            <p className="text-on-surface-variant leading-relaxed">{cms.about_story}</p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant/40 p-8 rounded shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">rocket_launch</span>
              Our Mission
            </h2>
            <p className="text-on-surface-variant leading-relaxed">{cms.about_mission}</p>
          </div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/40 p-8 rounded shadow-sm my-12 border-l-4 border-l-primary">
          <h2 className="text-xl font-bold text-primary mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">verified</span>
            Core Values
          </h2>
          <p className="font-medium text-on-surface leading-relaxed text-base">
            {cms.about_values}
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/40 p-8 rounded shadow-sm my-12">
          <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">handshake</span>
            Our Promise
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-4 border border-outline-variant/20 rounded bg-white shadow-2xs">
              <span className="material-symbols-outlined text-primary text-2xl mt-0.5">manage_search</span>
              <div>
                <h4 className="font-bold text-sm text-primary mb-1">Hand-picked & Tested</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Hand-picked, in-house tested hardware — no drop-ship junk.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border border-outline-variant/20 rounded bg-white shadow-2xs">
              <span className="material-symbols-outlined text-primary text-2xl mt-0.5">local_shipping</span>
              <div>
                <h4 className="font-bold text-sm text-primary mb-1">Fast, Free Shipping</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Fast, free shipping across India via Shiprocket couriers.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border border-outline-variant/20 rounded bg-white shadow-2xs">
              <span className="material-symbols-outlined text-primary text-2xl mt-0.5">shield_lock</span>
              <div>
                <h4 className="font-bold text-sm text-primary mb-1">Secured Payments</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Razorpay-secured payments, instant refunds where possible.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 border border-outline-variant/20 rounded bg-white shadow-2xs">
              <span className="material-symbols-outlined text-primary text-2xl mt-0.5">support_agent</span>
              <div>
                <h4 className="font-bold text-sm text-primary mb-1">Real Human Support</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">Real humans on email and phone, 6 days a week.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
