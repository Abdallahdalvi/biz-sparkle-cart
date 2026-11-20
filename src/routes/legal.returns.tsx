import { absoluteSiteUrl } from "@/lib/site";
import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, BIZ } from "@/components/legal/LegalPage";
import { REPLACEMENT_DELIVERY_POLICY, REPLACEMENT_TIMELINE } from "@/lib/replacement-policy";
import { ACCESSORY_WARRANTY_POLICY } from "@/lib/warranty-policy";
import { CUSTOMER_CANCELLATION_POLICY, STORE_CANCELLATION_POLICY } from "@/lib/cancellation-policy";
import { getStorefrontCms } from "@/lib/products";
import { PolicySupport, PolicySupportEmail } from "@/components/legal/PolicySupport";

export const Route = createFileRoute("/legal/returns")({
  loader: () => getStorefrontCms(),
  head: () => ({
    meta: [
      { property: "og:url", content: absoluteSiteUrl("/legal/returns") },
      { title: "Return & Refund Policy — Aghanims Phones and Gadgets" },
      {
        name: "description",
        content: "Return, refund and seven-day replacement policy for Aghanims Phones and Gadgets.",
      },
    ],
    links: [{ rel: "canonical", href: absoluteSiteUrl("/legal/returns") }],
  }),
  component: ReturnsPolicy,
});

function ReturnsPolicy() {
  const cms = Route.useLoaderData();
  return (
    <LegalPage title="Return & Refund Policy" updated="20 November 2026">
      <p className="text-lg font-medium text-on-surface leading-relaxed border-b border-outline-variant/30 pb-6 mb-8">
        {BIZ.legalReturnsText}
      </p>
      <h2>No change-of-mind returns</h2>
      <p>
        We do not accept returns because a customer changed their mind, ordered the wrong model,
        found a different price elsewhere, or no longer wants the product after delivery, except
        where applicable law provides a right to return.
      </p>
      <h2>Report a problem with your order</h2>
      <ol className="list-decimal pl-6 text-on-surface-variant space-y-1">
        <li>
          Contact <PolicySupportEmail cms={cms} /> with your order ID and describe the issue.
        </li>
        <li>
          Send any photos or video you have. Keep the packaging and accessories where possible.
        </li>
        <li>
          Follow our return instructions so we can inspect the item and arrange the appropriate
          remedy.
        </li>
      </ol>
      <p>
        We assess the available evidence. An unboxing video or original packaging is welcome if
        available. Opening or inspecting an item does not by itself make a claim ineligible.
      </p>
      <h2>Refunds</h2>
      <p>
        Refunds are processed only for approved cases or where required by applicable law. Approved
        refunds are credited to the original payment method within{" "}
        <strong>5–7 business days</strong> after approval, subject to payment-provider and bank
        timelines.
      </p>
      <h2>Cancellation refunds before shipping</h2>
      <p>{CUSTOMER_CANCELLATION_POLICY}</p>
      <p>{STORE_CANCELLATION_POLICY}</p>
      <p>
        These cancellation terms apply to orders placed on or after 16 October 2026. See our{" "}
        <a href="/legal/cancellation">Cancellation Policy</a> for examples and the full process;
        earlier agreed terms are not changed. The ₹50 customer cancellation deduction does not apply
        to refunds required in full by law.
      </p>
      <h2>Replacement within seven days</h2>
      <p>{REPLACEMENT_TIMELINE}</p>
      <h2>Return and replacement shipping</h2>
      <p>{REPLACEMENT_DELIVERY_POLICY}</p>
      <h2>One-month battery & charger warranty</h2>
      <p>{ACCESSORY_WARRANTY_POLICY}</p>
      <p>
        The one-month cover is for the battery and included charger only. A charger not supplied
        with the device is not covered by this store warranty.
      </p>
      <h2>Manufacturer warranty</h2>
      <p>
        Any manufacturer warranty, if applicable to a specific product, is separate from this store
        replacement policy. Warranty coverage does not apply to customer misuse, physical damage,
        liquid damage, tampering, or unauthorised repair.
      </p>
      <h2>Contact</h2>
      <p>
        <PolicySupport cms={cms} />
      </p>
    </LegalPage>
  );
}
