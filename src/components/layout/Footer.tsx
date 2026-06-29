import { Link } from "@tanstack/react-router";
import { BIZ } from "@/components/legal/LegalPage";

const LEGAL = [
  { to: "/legal/contact", label: "Contact Us" },
  { to: "/legal/terms", label: "Terms & Conditions" },
  { to: "/legal/privacy", label: "Privacy Policy" },
  { to: "/legal/shipping", label: "Shipping & Delivery Policy" },
  { to: "/legal/returns", label: "Return & Refund Policy" },
  { to: "/legal/cancellation", label: "Cancellation Policy" },
] as const;

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-outline-variant/30 mt-24">
      <div className="flex flex-col md:flex-row justify-between items-center py-12 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto gap-8">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="font-bold text-2xl tracking-tighter text-primary">{BIZ.name.split(" ")[0]}</div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            {BIZ.footerCopyright} {BIZ.footerTagline}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {LEGAL.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-primary transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
