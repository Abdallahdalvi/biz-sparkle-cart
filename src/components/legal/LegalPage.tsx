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
};
