import { useEffect, useState } from "react";
import { MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DELIVERY_GUIDE_STEPS } from "@/lib/delivery-guide";
import { OFFICIAL_WHATSAPP_PHONE, whatsappChatUrl } from "@/lib/social-links";
import { formatINR } from "@/lib/format";

export function DeliveryGuide({
  orderId,
  orderNumber,
  deliveryBalancePaise,
  onAcknowledged,
}: {
  orderId: string;
  orderNumber: string;
  deliveryBalancePaise: number;
  onAcknowledged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const acknowledgementKey = `aghanims-delivery-guide-v1:${orderId}`;
  useEffect(() => {
    try {
      const acknowledged = localStorage.getItem(acknowledgementKey) === "read";
      setOpen(!acknowledged);
      if (acknowledged) onAcknowledged();
    } catch {
      setOpen(true);
    }
  }, [acknowledgementKey, onAcknowledged]);
  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) {
      try {
        localStorage.setItem(acknowledgementKey, "read");
      } catch {
        /* Guidance must work even when browser storage is unavailable. */
      }
      onAcknowledged();
    }
  };
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <div className="flex flex-col gap-3 rounded border border-amber-300 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-amber-950">
            <ShieldCheck className="h-5 w-5" />
            Before your parcel arrives
          </h2>
          <p className="mt-1 text-sm text-amber-950">
            Save our number and read the delivery checks. Call us if anything feels wrong.
          </p>
        </div>
        <DialogTrigger asChild>
          <button
            type="button"
            className="min-h-11 shrink-0 rounded bg-primary px-4 py-3 text-sm font-bold text-on-primary"
          >
            Read delivery guide
          </button>
        </DialogTrigger>
      </div>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto bg-white text-primary">
        <DialogHeader>
          <DialogTitle className="pr-6 text-xl leading-tight">
            Your order is confirmed. Here’s how to receive it safely.
          </DialogTitle>
          <DialogDescription>
            Order {orderNumber}. Keep this guide handy on delivery day.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <strong>Pay on delivery: {formatINR(deliveryBalancePaise)}</strong>
          <p className="mt-1">Any advance or prepaid payment is already accounted for.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={`tel:+${OFFICIAL_WHATSAPP_PHONE}`}
            className="flex min-h-12 items-center justify-center gap-2 rounded bg-primary px-3 py-3 text-sm font-bold text-on-primary"
          >
            <Phone className="h-4 w-4" />
            Call +91 93721 68726
          </a>
          <a
            href={whatsappChatUrl(
              `Hi Aghanims, I am receiving order ${orderNumber} and need urgent help verifying the parcel. Can we have a WhatsApp video call?`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded bg-[#128C7E] px-3 py-3 text-sm font-bold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Request a video call
          </a>
        </div>
        <p className="text-xs text-on-surface-variant">
          Call us as soon as you are unsure. If a call is not answered, message us and verify the
          parcel before accepting it.
        </p>
        <ol className="space-y-4">
          {DELIVERY_GUIDE_STEPS.map((step, index) => (
            <li key={step.title} className="rounded border border-outline-variant/40 p-3">
              <h3 className="text-sm font-bold">
                {index + 1}. {step.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{step.body}</p>
            </li>
          ))}
        </ol>
        <Link to="/legal/returns" className="text-sm underline">
          Read replacement and return terms
        </Link>
        <button
          type="button"
          onClick={() => changeOpen(false)}
          className="min-h-12 rounded bg-primary px-4 py-3 text-sm font-bold text-on-primary"
        >
          Got it — view my order
        </button>
      </DialogContent>
    </Dialog>
  );
}
