import { absoluteSiteUrl } from "@/lib/site";
import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, BIZ } from "@/components/legal/LegalPage";
import { REPLACEMENT_DELIVERY_POLICY } from "@/lib/replacement-policy";
import { getStorefrontCms } from "@/lib/products";
import { PolicySupport, PolicySupportEmail } from "@/components/legal/PolicySupport";

export const Route = createFileRoute("/legal/shipping")({
  loader: () => getStorefrontCms(),
  head: () => ({
    meta: [
      { property: "og:url", content: absoluteSiteUrl("/legal/shipping") },
      { title: "Shipping & Delivery — Aghanims Phones and Gadgets" },
      {
        name: "description",
        content:
          "Shipping zones, delivery timelines, and tracking for Aghanims Phones and Gadgets orders.",
      },
    ],
    links: [{ rel: "canonical", href: absoluteSiteUrl("/legal/shipping") }],
  }),
  component: ShippingPolicy,
});

function ShippingPolicy() {
  const cms = Route.useLoaderData();
  return (
    <LegalPage title="Shipping & Delivery Policy" updated="15 October 2026">
      <p className="text-lg font-medium text-on-surface leading-relaxed border-b border-outline-variant/30 pb-6 mb-8">
        {BIZ.legalShippingText}
      </p>
      <h2>Where we ship</h2>
      <p>
        We currently deliver only to serviceable addresses in India via Shiprocket and its courier
        partners (Bluedart, Delhivery, DTDC, India Post, Xpressbees, etc.) depending on PIN-code
        serviceability.
      </p>
      <h2>Processing time</h2>
      <p>
        Orders are processed within 1–2 business days from payment confirmation. Pre-order and
        limited-drop items display an expected ship date on the product page.
      </p>
      <h2>Delivery timelines (indicative)</h2>
      <ul>
        <li>
          <strong>Metro cities:</strong> 2–4 business days.
        </li>
        <li>
          <strong>Other Tier-1 & Tier-2 cities:</strong> 3–6 business days.
        </li>
        <li>
          <strong>Remote / North-East / Hill regions:</strong> 5–10 business days.
        </li>
      </ul>
      <h2>Shipping charges</h2>
      <p>
        No manual shipping fee is added to the customer&apos;s website order. The actual courier
        cost is calculated from Shiprocket when we assign the courier and is recorded as an internal
        fulfilment expense.
      </p>
      <h2>Replacement delivery fees</h2>
      <p>{REPLACEMENT_DELIVERY_POLICY}</p>
      <h2>Tracking</h2>
      <p>
        Once shipped you'll receive an email and SMS with the AWB number and a live tracking link,
        also available under Account → Orders.
      </p>
      <h2>Undelivered / RTO</h2>
      <p>
        If a package is returned due to an incorrect address, repeated unavailability or refusal,
        we'll contact you about redelivery or cancellation. We disclose any lawful redelivery charge
        before you agree to a new delivery. Refunds follow our{" "}
        <a href="/legal/returns">Return &amp; Refund Policy</a> and applicable consumer law.
      </p>
      <h2>Damaged in transit</h2>
      <p>
        If your shipment arrives visibly damaged, please refuse delivery if possible and email{" "}
        <PolicySupportEmail cms={cms} /> with your order number and any available evidence. We
        dispatch eligible replacements within seven calendar days of your first report. See the{" "}
        <a href="/legal/returns">Return &amp; Refund Policy</a> for refunds and other remedies.
      </p>
      <h2>Questions</h2>
      <p>
        <PolicySupport cms={cms} />
      </p>
    </LegalPage>
  );
}
