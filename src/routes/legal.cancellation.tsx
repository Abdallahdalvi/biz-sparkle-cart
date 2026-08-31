import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, BIZ } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/legal/cancellation")({
  head: () => ({
    meta: [
      { title: "Cancellation Policy — Aghanims Phones and Gadgets" },
      {
        name: "description",
        content: "How to cancel an Aghanims Phones and Gadgets order before dispatch.",
      },
    ],
  }),
  component: () => (
    <LegalPage title="Cancellation Policy" updated="August 2026">
      <p className="text-lg font-medium text-on-surface leading-relaxed border-b border-outline-variant/30 pb-6 mb-8">
        {BIZ.legalCancellationText}
      </p>
      <h2>Before dispatch</h2>
      <p>
        You can request cancellation only before the order is packed, assigned to courier, or marked
        shipped. Email <a href={`mailto:${BIZ.email}`}>{BIZ.email}</a> with your order ID. Approved
        prepaid refunds are issued to the original payment method within 5–7 business days, subject
        to payment-provider and bank timelines.
      </p>
      <h2>After dispatch</h2>
      <p>
        Once the shipment is handed to the courier, cancellation is not available. Refusing delivery
        is not treated as a normal return. Failed, refused, or returned-to-origin shipments are
        reviewed case-by-case and courier/payment costs may be deducted where legally permitted.
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
        page. After dispatch, the standard cancellation and 48-hour delivery issue policy applies.
      </p>
    </LegalPage>
  ),
});
