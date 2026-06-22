import { Link } from "@tanstack/react-router";

const LEGAL = [
  { to: "/legal/about", label: "About" },
  { to: "/legal/contact", label: "Contact" },
  { to: "/legal/terms", label: "Terms" },
  { to: "/legal/privacy", label: "Privacy" },
  { to: "/legal/shipping", label: "Shipping" },
  { to: "/legal/returns", label: "Returns" },
  { to: "/legal/cancellation", label: "Cancellation" },
] as const;

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-outline-variant/30 mt-24">
      <div className="flex flex-col md:flex-row justify-between items-center py-12 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto gap-xl">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="font-bold text-2xl tracking-tighter text-primary">TECHLAB</div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            © {new Date().getFullYear()} TECHLAB. PRECISION ENGINEERED LOGISTICS.
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