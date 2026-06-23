import { Link, useRouterState } from "@tanstack/react-router";
import { useCart } from "@/lib/cart-store";
import { useEffect, useState } from "react";

const NAV = [
  { to: "/", label: "Store" },
  { to: "/catalog", label: "Catalog" },
  { to: "/legal/about", label: "About" },
  { to: "/legal/contact", label: "Support" },
] as const;

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? items.reduce((a, i) => a + i.qty, 0) : 0;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white border-b border-outline-variant/30">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto h-16">
        <Link to="/" className="font-bold text-2xl tracking-tighter text-primary">
          TECHLAB
        </Link>
        <div className="hidden md:flex items-center gap-8 font-medium text-sm uppercase tracking-wider">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  active
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-on-surface-variant hover:text-primary transition-colors"
                }
              >
                {n.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-4">
          <Link to="/catalog" aria-label="Search" className="material-symbols-outlined text-primary hover:opacity-70 transition-opacity">
            search
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative material-symbols-outlined text-primary hover:opacity-70 transition-opacity">
            shopping_cart
            {count > 0 && (
              <span className="absolute -top-1 -right-2 bg-primary text-on-primary text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                {count}
              </span>
            )}
          </Link>
          <Link to="/account" aria-label="Account" className="material-symbols-outlined text-primary hover:opacity-70 transition-opacity">
            account_circle
          </Link>
        </div>
      </div>
    </nav>
  );
}