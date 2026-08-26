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
    "Return eligibility and resolution depend on the product condition, reason for return, and the policy shown at the time of purchase. Contact support promptly after delivery and retain the original packaging while a request is reviewed.",
  legalCancellationText:
    "An order may be cancelled before it is handed to the courier. Once shipped, cancellation may no longer be possible and the applicable return process will apply.",
  footerTagline: "Aghanims Phones and Gadgets.",
  footerCopyright: `© ${new Date().getFullYear()} Aghanims Phones and Gadgets. ALL RIGHTS RESERVED.`,
};
