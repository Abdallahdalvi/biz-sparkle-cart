import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-16">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
          Legal
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">{title}</h1>
        {updated && (
          <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-12">
            Last updated: {updated}
          </p>
        )}
        <div className="space-y-6 text-on-surface leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-on-surface-variant [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-on-surface-variant [&_li]:mb-1 [&_a]:text-primary [&_a]:underline">
          {children}
        </div>
      </article>
    </SiteShell>
  );
}

// Public legal identity stays deliberately neutral until verified business
// details are supplied. Never publish placeholder KYC or tax information.
export const BIZ = {
  name: "Aghanims Phones and Gadgets",
  legalName: "Aghanims Phones and Gadgets",
  address: "Business address pending verification",
  state: "India",
  gstin: "Not registered",
  email: "",
  phone: "",
  hours: "",
  grievanceOfficer: "To be appointed",
  legalTermsText:
    'These Terms & Conditions ("Terms") govern access to and use of the Aghanims Phones and Gadgets website and purchases made through the store. By using the site, you agree to these Terms. Prices are shown in Indian Rupees (INR). An order is accepted when it is confirmed for fulfilment.',
  legalPrivacyText:
    "We collect only the information needed to operate the store, support customers, and fulfil orders. We share order data with service providers involved in payment (when enabled), hosting, shipping, and customer communication. We do not sell personal data.",
  legalShippingText:
    "We ship through Shiprocket and the courier selected for each serviceable order. Courier availability, price, and estimated delivery depend on the pickup and delivery PIN codes, parcel details, and payment mode.",
  legalReturnsText:
    "No change-of-mind returns are accepted. Damage-on-arrival, wrong-item, missing-accessory, or functional-defect claims must be reported within 48 hours of delivery with clear photo/video proof and original packaging. After 48 hours, replacement, return, or refund requests are not accepted except where required by applicable law. Products damaged, misused, opened, repaired, modified, or made incomplete by the customer are not eligible for replacement or refund.",
  legalCancellationText:
    "Orders can be cancelled only before dispatch. Once handed to the courier, cancellation is not available. Refused, failed, or returned-to-origin deliveries are reviewed case-by-case and may have courier/payment costs deducted where legally permitted.",
  footerTagline: "Aghanims Phones and Gadgets.",
  footerCopyright: `© ${new Date().getFullYear()} Aghanims Phones and Gadgets. ALL RIGHTS RESERVED.`,
};
