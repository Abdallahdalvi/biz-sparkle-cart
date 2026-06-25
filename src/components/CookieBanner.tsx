import { useEffect, useState } from "react";

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("techlab-cookies-ok")) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-white shopify-border shopify-shadow p-4 flex items-start gap-3">
      <p className="text-xs text-on-surface-variant leading-relaxed flex-1">
        We use cookies to keep your cart, remember sign-in, and improve the store. By browsing
        TECHLAB you accept our{" "}
        <a href="/legal/privacy" className="underline text-primary">
          Privacy Policy
        </a>
        .
      </p>
      <button
        onClick={() => {
          localStorage.setItem("techlab-cookies-ok", "1");
          setShow(false);
        }}
        className="bg-primary text-on-primary px-4 py-2 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap"
      >
        OK
      </button>
    </div>
  );
}
