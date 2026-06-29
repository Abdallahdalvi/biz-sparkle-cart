import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, BIZ } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/legal/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping & Delivery — TECHLAB" },
      {
        name: "description",
        content: "Shipping zones, delivery timelines, and tracking for TECHLAB orders.",
      },
    ],
  }),
  component: () => (
    <LegalPage title="Shipping & Delivery Policy" updated="June 2026">
      <p className="text-lg font-medium text-on-surface leading-relaxed border-b border-outline-variant/30 pb-6 mb-8">
        {BIZ.legalShippingText}
      </p>
      <h2>Where we ship</h2>
      <p>
        We currently ship across India via Shiprocket and its courier partners (Bluedart, Delhivery,
        DTDC, India Post, Xpressbees, etc.) depending on PIN-code serviceability.
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
      <p>Shipping is free on all prepaid orders within India unless stated otherwise.</p>
      <h2>Tracking</h2>
      <p>
        Once shipped you'll receive an email and SMS with the AWB number and a live tracking link,
        also available under Account → Orders.
      </p>
      <h2>Undelivered / RTO</h2>
      <p>
        If a package is returned due to incorrect address, repeated unavailability, or refusal,
        we'll contact you to arrange re-delivery (at your cost) or issue a refund less the original
        outbound shipping cost.
      </p>
      <h2>Damaged in transit</h2>
      <p>
        If your shipment arrives visibly damaged, please refuse delivery if possible and email{" "}
        <a href={`mailto:${BIZ.email}`}>{BIZ.email}</a> with photos within 48 hours for a full
        replacement or refund.
      </p>
      <h2>Questions</h2>
      <p>
        <a href={`mailto:${BIZ.email}`}>{BIZ.email}</a> · {BIZ.phone} ({BIZ.hours})
      </p>
    </LegalPage>
  ),
});
