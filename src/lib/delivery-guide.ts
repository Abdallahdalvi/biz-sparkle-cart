export function canShowDeliveryGuide(order: {
  status: string;
  paymentMethod: "cod" | "prepaid";
  onlinePaymentReceived: boolean;
  codAdvancePaise: number;
  advancePaidPaise: number;
}) {
  if (!["paid", "processing", "shipped", "delivered"].includes(order.status)) return false;
  if (order.paymentMethod === "prepaid") return order.onlinePaymentReceived;
  return (
    order.codAdvancePaise === 0 ||
    (order.onlinePaymentReceived && order.advancePaidPaise >= order.codAdvancePaise)
  );
}

export const DELIVERY_GUIDE_STEPS = [
  {
    title: "Match the parcel to your order",
    body: "Check the tracking/AWB number against your store order and official tracking link. Check the recipient, COD amount and sender details. A missing seller/return address, unexpected amount or damaged seal is a reason to contact us before paying or accepting; a label alone does not prove whether a parcel is genuine.",
  },
  {
    title: "A light parcel alone does not mean a scam",
    body: "Phone parcels can be compact. If a delivery agent raises a concern, or you feel unsure, ask them to wait while you call us or request a WhatsApp video call. Share your order number and show the parcel and label so we can help verify it. If you cannot verify it or reach us, do not pay or accept under pressure.",
  },
  {
    title: "Open and inspect with an unboxing video",
    body: "The courier may not permit open-box inspection before payment. Follow the courier’s handover rules. After accepting the parcel, record one continuous video showing the unopened package, label, seals, opening and contents. You can open and check your order; our store takes responsibility for reviewing and resolving eligible wrong-item, missing-item, damage or defect issues under our replacement policy. Report any issue within 48 hours and keep the packaging.",
  },
  {
    title: "Pay only the confirmed balance",
    body: "Your online advance is already deducted from the total. Pay only the delivery balance on this receipt. Never disclose your UPI PIN, banking OTP or card details, install an app at someone’s request, or make an extra transfer to release the parcel. Share a delivery OTP only when the correct parcel is physically being handed to you and you are ready to accept it.",
  },
] as const;
