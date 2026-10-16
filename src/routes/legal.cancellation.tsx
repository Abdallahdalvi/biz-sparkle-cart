import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, BIZ } from "@/components/legal/LegalPage";
import {
  CANCELLATION_EFFECTIVE_DATE,
  CUSTOMER_CANCELLATION_POLICY,
  STORE_CANCELLATION_POLICY,
} from "@/lib/cancellation-policy";

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
    <LegalPage title="Cancellation Policy" updated={CANCELLATION_EFFECTIVE_DATE}>
      <p className="text-lg font-medium text-on-surface leading-relaxed border-b border-outline-variant/30 pb-6 mb-8">
        {BIZ.legalCancellationText}
      </p>
      <h2>Before dispatch</h2>
      <p>{CUSTOMER_CANCELLATION_POLICY}</p>
      <p>
        Contact <a href="/legal/contact">our support team</a> with your order ID as soon as
        possible. Packing, generating a shipping label, or assigning a courier alone does not mean
        the parcel has been handed over. Support will verify whether dispatch has occurred before
        confirming cancellation.
      </p>
      <h2>Refund amount and timing</h2>
      <ul>
        <li>
          ₹499 COD advance paid → ₹449 refund after an eligible ₹50 deduction. The remaining COD
          balance is not collected for the cancelled order.
        </li>
        <li>₹7,999 prepaid → ₹7,949 refund after an eligible ₹50 deduction.</li>
        <li>
          If we cancel a confirmed order: full refund of the amount paid plus ₹50 compensation.
        </li>
        <li>
          No deduction applies where the customer is entitled to a full refund under applicable law.
        </li>
      </ul>
      <p>
        Approved refunds are credited to the original payment method within 5–7 business days,
        subject to payment-provider and bank timelines. We will confirm the refund breakdown,
        including any deduction, before processing it.
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
        suspected fraud, or undeliverable addresses. You will be notified of the cancellation.
      </p>
      <p>{STORE_CANCELLATION_POLICY}</p>
      <h2>Pre-orders and limited drops</h2>
      <p>
        Pre-order cancellations may be requested before actual courier handover, under the same
        refund and deduction rules above. After dispatch, the return, replacement and warranty
        policies apply, subject to applicable law.
      </p>
    </LegalPage>
  ),
});
