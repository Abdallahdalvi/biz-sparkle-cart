import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, BIZ } from "@/components/legal/LegalPage";

export const Route = createFileRoute("/legal/returns")({
  head: () => ({
    meta: [
      { title: "Return & Refund Policy — Aghanims Phones and Gadgets" },
      {
        name: "description",
        content:
          "Aghanims Phones and Gadgets 48-hour delivery damage, defect, replacement, and refund policy.",
      },
    ],
  }),
  component: () => (
    <LegalPage title="Return & Refund Policy" updated="August 2026">
      <p className="text-lg font-medium text-on-surface leading-relaxed border-b border-outline-variant/30 pb-6 mb-8">
        {BIZ.legalReturnsText}
      </p>
      <h2>No change-of-mind returns</h2>
      <p>
        We do not accept returns because a customer changed their mind, ordered the wrong model,
        found a different price elsewhere, or no longer wants the product after delivery.
      </p>
      <h2>48-hour delivery issue window</h2>
      <p>
        Damage-on-arrival, wrong-item, missing-accessory, or functional-defect claims must be
        reported within <strong>48 hours of delivery</strong>. Requests raised after 48 hours are
        not eligible for replacement, return, or refund except where required by applicable law.
      </p>
      <h2>Non-returnable items</h2>
      <ul>
        <li>Used, opened, incomplete, or customer-damaged products.</li>
        <li>Products with scratches, liquid damage, impact damage, burns, dents, or tampering.</li>
        <li>Items repaired, modified, rooted, flashed, unlocked, or altered after delivery.</li>
        <li>
          Products returned without original box, accessories, labels, invoice, or IMEI match.
        </li>
        <li>Software, gift cards, personalised items, and final-sale/limited-drop items.</li>
      </ul>
      <h2>How to raise a 48-hour claim</h2>
      <ol className="list-decimal pl-6 text-on-surface-variant space-y-1">
        <li>
          Email <a href={`mailto:${BIZ.email}`}>{BIZ.email}</a> with your order ID within 48 hours
          of delivery.
        </li>
        <li>
          Attach clear unboxing photos/video showing the packaging, label, product, and issue.
        </li>
        <li>
          Keep the original box, courier packaging, invoice, labels, and all accessories intact.
        </li>
        <li>
          Do not use, repair, modify, or further damage the product while the claim is reviewed.
        </li>
        <li>
          If approved, we will arrange the appropriate resolution: replacement, repair support, or
          refund where applicable.
        </li>
      </ol>
      <h2>Inspection before approval</h2>
      <p>
        Every claim is subject to verification. A pickup, replacement, or refund approval is not
        automatic. If inspection shows customer misuse, missing parts, tampering, unauthorised
        repair, or a mismatch with the shipped product/IMEI, the claim will be rejected.
      </p>
      <h2>Refunds</h2>
      <p>
        Refunds are processed only for approved cases or where required by applicable law. Approved
        refunds are credited to the original payment method within{" "}
        <strong>5–7 business days</strong> after approval, subject to payment-provider and bank
        timelines.
      </p>
      <h2>Replacements</h2>
      <p>
        Replacement is available only for approved 48-hour delivery damage, wrong-item,
        missing-accessory, or functional-defect claims. After 48 hours from delivery, no replacement
        is provided except where required by applicable law.
      </p>
      <h2>Manufacturer warranty</h2>
      <p>
        Any manufacturer warranty, if applicable to a specific product, is separate from this
        store-level 48-hour delivery issue policy. Warranty coverage does not apply to customer
        misuse, physical damage, liquid damage, tampering, or unauthorised repair.
      </p>
      <h2>Contact</h2>
      <p>
        <a href={`mailto:${BIZ.email}`}>{BIZ.email}</a> · {BIZ.phone}
      </p>
    </LegalPage>
  ),
});
