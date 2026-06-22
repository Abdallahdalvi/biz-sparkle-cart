import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, BIZ } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/legal/returns")({
  head: () => ({
    meta: [
      { title: "Return & Refund Policy — TECHLAB" },
      { name: "description", content: "How to return a TECHLAB order and how refunds are processed." },
    ],
  }),
  component: () => (
    <LegalPage title="Return & Refund Policy" updated="June 2026">
      <h2>7-day return window</h2>
      <p>We accept returns within <strong>7 days</strong> of delivery for items that are unused, in original condition, and with all original packaging, accessories, and tags intact.</p>
      <h2>Non-returnable items</h2>
      <ul>
        <li>Items marked "Final Sale" or "Limited Drop".</li>
        <li>Software, gift cards, and personalised items.</li>
        <li>Items damaged due to misuse or unauthorised repair.</li>
      </ul>
      <h2>How to initiate a return</h2>
      <ol className="list-decimal pl-6 text-on-surface-variant space-y-1">
        <li>Email <a href={`mailto:${BIZ.email}`}>{BIZ.email}</a> with your order ID and reason.</li>
        <li>We'll respond within 1 business day with a reverse-pickup link.</li>
        <li>Hand over the parcel in original packaging on the scheduled pickup day.</li>
        <li>Once inspected (2–4 business days after pickup), we process the refund.</li>
      </ol>
      <h2>Refunds</h2>
      <p>Approved refunds credit to the original payment method within <strong>5–7 business days</strong> of receipt. UPI/net-banking refunds typically reflect within 24 hours; card refunds within 5–7 days depending on your bank.</p>
      <h2>Replacements</h2>
      <p>For damaged-on-arrival (DOA) products, we offer a free replacement if reported within 48 hours of delivery with photo/video evidence.</p>
      <h2>Manufacturer warranty</h2>
      <p>Most devices ship with a 6–12 month manufacturer warranty. For warranty claims outside the 7-day window, contact us and we'll coordinate with the manufacturer's service centre.</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${BIZ.email}`}>{BIZ.email}</a> · {BIZ.phone}</p>
    </LegalPage>
  ),
});