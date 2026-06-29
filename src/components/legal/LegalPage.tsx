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

export const BIZ = {
  get name() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.biz_name) return data.biz_name;
        }
      } catch (e) {}
    }
    return "TECHLAB Hardware Co.";
  },
  get legalName() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.biz_legal_name) return data.biz_legal_name;
        }
      } catch (e) {}
    }
    return "TECHLAB Technologies LLP";
  },
  get address() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.biz_address) return data.biz_address;
        }
      } catch (e) {}
    }
    return "Bandra Kurla Complex, Bandra East, Mumbai, 400051";
  },
  get state() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.biz_state) return data.biz_state;
        }
      } catch (e) {}
    }
    return "Maharashtra";
  },
  get gstin() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.biz_gstin) return data.biz_gstin;
        }
      } catch (e) {}
    }
    return "27AADCS1456Q1ZV";
  },
  get email() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.biz_email) return data.biz_email;
        }
      } catch (e) {}
    }
    return "support@techlab.example";
  },
  get phone() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.biz_phone) return data.biz_phone;
        }
      } catch (e) {}
    }
    return "+91 98765 43210";
  },
  get hours() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.biz_hours) return data.biz_hours;
        }
      } catch (e) {}
    }
    return "Mon–Sat, 10:00 – 18:00 IST";
  },
  get grievanceOfficer() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.biz_grievance_officer) return data.biz_grievance_officer;
        }
      } catch (e) {}
    }
    return "Vikram Malhotra";
  },
  get legalTermsText() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.legal_terms_text) return data.legal_terms_text;
        }
      } catch (e) {}
    }
    return "These Terms & Conditions (\"Terms\") govern your access to and use of the TECHLAB website operated by our company, and any purchase of products listed on the Site. By using the Site you agree to these Terms. All prices are in Indian Rupees (INR) and are inclusive of applicable GST. We accept the offer when we dispatch the product and email an order confirmation with tracking.";
  },
  get legalPrivacyText() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.legal_privacy_text) return data.legal_privacy_text;
        }
      } catch (e) {}
    }
    return "We respect your privacy. This Policy explains what we collect, how we use it, and your rights under the Digital Personal Data Protection Act, 2023 (DPDP Act). We share data only with processors needed to deliver your order: Razorpay (payments), Shiprocket and the assigned courier (delivery). We do not sell your data.";
  },
  get legalShippingText() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.legal_shipping_text) return data.legal_shipping_text;
        }
      } catch (e) {}
    }
    return "We currently ship across India via Shiprocket and its courier partners (Bluedart, Delhivery, DTDC, India Post, Xpressbees). Orders are processed within 1–2 business days from payment confirmation. Delivery takes 2–4 business days in Metro cities and 3–6 business days in other Tier-1 & Tier-2 cities. Shipping is free on all prepaid orders within India.";
  },
  get legalReturnsText() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.legal_returns_text) return data.legal_returns_text;
        }
      } catch (e) {}
    }
    return "We accept returns within 7 days of delivery for items that are unused, in original condition, and with all original packaging. Approved refunds credit to the original payment method within 5–7 business days of receipt. For damaged-on-arrival (DOA) products, we offer a free replacement if reported within 48 hours of delivery.";
  },
  get legalCancellationText() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.legal_cancellation_text) return data.legal_cancellation_text;
        }
      } catch (e) {}
    }
    return "You can cancel any time before your order is marked 'Shipped' — usually within 24 hours. A full refund is issued to your original payment method within 5–7 business days. Once handed to the courier we cannot cancel. You may refuse delivery and we'll process it as a return.";
  },
  get footerTagline() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.footer_tagline) return data.footer_tagline;
        }
      } catch (e) {}
    }
    return "TECHLAB. PRECISION ENGINEERED LOGISTICS.";
  },
  get footerCopyright() {
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("storefront_cms_custom");
        if (local) {
          const data = JSON.parse(local);
          if (data.footer_copyright) return data.footer_copyright;
        }
      } catch (e) {}
    }
    return `© ${new Date().getFullYear()} TECHLAB. ALL RIGHTS RESERVED.`;
  },
};
