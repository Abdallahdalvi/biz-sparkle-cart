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
      <div className="py-12 px-margin-mobile md:px-margin-desktop max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="font-bold text-2xl tracking-tighter text-primary">{BIZ.name.split(" ")[0]}</div>
          <div className="flex flex-row justify-center items-center gap-4 lg:gap-8 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
            {LEGAL.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-primary transition-colors flex-shrink-0">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="border-t border-outline-variant/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          <p>
            {BIZ.footerCopyright} {BIZ.footerTagline}
          </p>
          <p className="text-on-surface-variant/70">RAZORPAY VERIFIED MERCHANT</p>
        </div>
      </div>
    </footer>
  );
}
