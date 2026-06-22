import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";

export function LegalPage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-16">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">Legal</p>
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">{title}</h1>
        {updated && <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-12">Last updated: {updated}</p>}
        <div className="space-y-6 text-on-surface leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:text-on-surface-variant [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-on-surface-variant [&_li]:mb-1 [&_a]:text-primary [&_a]:underline">
          {children}
        </div>
      </article>
    </SiteShell>
  );
}

export const BIZ = {
  name: "[YOUR BUSINESS NAME]",
  legalName: "[YOUR REGISTERED ENTITY NAME]",
  address: "[FULL REGISTERED ADDRESS, STATE, PIN]",
  state: "[STATE]",
  gstin: "[GSTIN — IF REGISTERED]",
  email: "support@techlab.example",
  phone: "+91 [10-DIGIT NUMBER]",
  hours: "Mon–Sat, 10:00 – 18:00 IST",
};