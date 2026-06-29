import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, BIZ } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/legal/cancellation")({
  head: () => ({
    meta: [
      { title: "Cancellation Policy — TECHLAB" },
      { name: "description", content: "How to cancel a TECHLAB order before it ships." },
    ],
  }),
  component: () => (
    <LegalPage title="Cancellation Policy" updated="June 2026">
      <p className="text-lg font-medium text-on-surface leading-relaxed border-b border-outline-variant/30 pb-6 mb-8">
        {BIZ.legalCancellationText}
      </p>
      <h2>Before dispatch</h2>
      <p>
        You can cancel any time before your order is marked "Shipped" — usually within 24 hours.
        Email <a href={`mailto:${BIZ.email}`}>{BIZ.email}</a> with your order ID. A full refund is
        issued to your original payment method within 5–7 business days.
      </p>
      <h2>After dispatch</h2>
      <p>
        Once handed to the courier we cannot cancel. You may refuse delivery and we'll process it as
        a return (subject to our <a href="/legal/returns">Return Policy</a>).
      </p>
      <h2>Cancellations by us</h2>
      <p>
        We reserve the right to cancel any order due to: stock unavailability, pricing errors,
        suspected fraud, or undeliverable addresses. A full refund is issued and you'll be notified
        by email.
      </p>
      <h2>Pre-orders and limited drops</h2>
      <p>
        Pre-order cancellations are allowed any time before the dispatch date stated on the product
        page. After dispatch the standard policy applies.
      </p>
    </LegalPage>
  ),
});
