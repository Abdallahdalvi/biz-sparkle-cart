import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const MERCHANT_ID = 5852904000;
const SCRIPT_ID = "google-merchant-store-widget";
const STARTED_ATTRIBUTE = "data-google-merchant-widget-started";

declare global {
  interface Window {
    merchantwidget?: {
      start: (configuration: {
        merchant_id: number;
        position: "LEFT_BOTTOM" | "RIGHT_BOTTOM";
        region: string;
        sideMargin: number;
        bottomMargin: number;
        mobileSideMargin: number;
        mobileBottomMargin: number;
      }) => void;
    };
  }
}

/** Google Customer Reviews Store Widget, excluded from private admin screens. */
export function GoogleMerchantWidget() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

    const start = () => {
      if (
        document.documentElement.hasAttribute(STARTED_ATTRIBUTE) ||
        !window.merchantwidget?.start
      ) {
        return;
      }
      window.merchantwidget.start({
        merchant_id: MERCHANT_ID,
        position: "LEFT_BOTTOM",
        region: "IN",
        sideMargin: 24,
        bottomMargin: 24,
        mobileSideMargin: 16,
        mobileBottomMargin: 56,
      });
      document.documentElement.setAttribute(STARTED_ATTRIBUTE, "true");
    };

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      start();
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://www.gstatic.com/shopping/merchant/merchantwidget.js";
    script.defer = true;
    script.addEventListener("load", start, { once: true });
    document.head.appendChild(script);
  }, [isAdmin]);

  return null;
}
