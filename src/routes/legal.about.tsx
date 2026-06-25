import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
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
    <LegalPage title={cms.about_title || "About TECHLAB"}>
      <p className="text-lg font-medium text-primary mb-6">{cms.about_subtitle}</p>

      {cms.about_image && (
        <div className="my-8 aspect-[16/9] w-full overflow-hidden shopify-border bg-white shadow-sm">
          <img
            src={cms.about_image}
            alt="TechLab Workspace"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <h2>Our Story & Background</h2>
      <p>{cms.about_story}</p>

      <h2>Our Mission</h2>
      <p>{cms.about_mission}</p>

      <h2>Core Values</h2>
      <p className="font-bold text-primary p-4 bg-surface-container-low border-l-4 border-primary my-6">
        {cms.about_values}
      </p>

      <h2>Our promise</h2>
      <ul>
        <li>Hand-picked, in-house tested hardware — no drop-ship junk.</li>
        <li>Fast, free shipping across India via Shiprocket couriers.</li>
        <li>Razorpay-secured payments, instant refunds where possible.</li>
        <li>Real humans on email and phone, 6 days a week.</li>
      </ul>
    </LegalPage>
  );
}
