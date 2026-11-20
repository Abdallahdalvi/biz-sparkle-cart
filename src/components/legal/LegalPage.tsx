import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { RETURNS_POLICY_SUMMARY } from "@/lib/warranty-policy";
import { CANCELLATION_POLICY_SUMMARY } from "@/lib/cancellation-policy";
import { useStorefrontLanguage } from "@/components/StorefrontLanguage";
import { POLICY_LANGUAGE_SUMMARIES } from "@/lib/policy-language-summaries";
import { BUSINESS_LLPIN, LEGAL_BUSINESS_NAME, REGISTERED_OFFICE } from "@/lib/business-identity";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  const { language } = useStorefrontLanguage();
  const summary = language !== "en" ? POLICY_LANGUAGE_SUMMARIES[title]?.[language] : undefined;
  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-16">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
          Legal
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">{title}</h1>
        <p className="text-sm text-on-surface-variant mb-6">
          {BIZ.name} is operated by <span translate="no">{BIZ.legalName}</span> · LLPIN {BIZ.llpin}{" "}
          · Registered with limited liability.
        </p>
        {updated && (
          <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-12">
            Last updated: {updated}
          </p>
        )}
        <div className="space-y-6 text-on-surface leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-on-surface-variant [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-on-surface-variant [&_li]:mb-1 [&_a]:text-primary [&_a]:underline">
          {summary ? (
            <>
              <section className="rounded border border-outline-variant/50 bg-white p-5">
                <h2>Policy summary</h2>
                <p data-no-translate lang={language}>
                  {summary}
                </p>
              </section>
              <details>
                <summary className="cursor-pointer font-bold">Full policy (English)</summary>
                <div translate="no" lang="en" dir="ltr" className="mt-5 space-y-6">
                  {children}
                </div>
              </details>
            </>
          ) : (
            children
          )}
        </div>
      </article>
    </SiteShell>
  );
}

export const BIZ = {
  name: "Aghanims Phones and Gadgets",
  legalName: LEGAL_BUSINESS_NAME,
  llpin: BUSINESS_LLPIN,
  address: REGISTERED_OFFICE,
  state: "India",
  email: "support@aghanimsgroup.in",
  phone: "+919372168726",
  hours: "",
  grievanceOfficer: "Abdallah Dalvi",
  legalTermsText:
    'These Terms & Conditions ("Terms") govern access to and use of the Aghanims Phones and Gadgets website and purchases made through the store. By using the site, you agree to these Terms. Prices are shown in Indian Rupees (INR). An order is accepted when it is confirmed for fulfilment.',
  legalPrivacyText:
    "We collect only the information needed to operate the store, support customers, and fulfil orders. We share order data with service providers involved in payment (when enabled), hosting, shipping, and customer communication. We do not sell personal data.",
  legalShippingText:
    "We ship through Shiprocket and the courier selected for each serviceable order. Courier availability, price, and estimated delivery depend on the pickup and delivery PIN codes, parcel details, and payment mode.",
  legalReturnsText: RETURNS_POLICY_SUMMARY,
  legalCancellationText: CANCELLATION_POLICY_SUMMARY,
  footerTagline: "Aghanims Phones and Gadgets.",
  footerCopyright: `© ${new Date().getFullYear()} Aghanims Phones and Gadgets. ALL RIGHTS RESERVED.`,
};
