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
    body: "Phone parcels can be compact; weight alone does not tell you what is inside. Match the parcel and payment details to your order. If the details do not match or the seal is damaged, contact support before accepting it. Do not pay or accept under pressure.",
  },
  {
    title: "Record your unboxing or video-call us while unpacking",
    body: "The courier may not permit open-box inspection before payment. Follow the courier’s handover rules. After accepting the parcel and completing the handover, record one continuous unboxing video, or arrange a WhatsApp video call with our team while you unpack. Start with the unopened package and clearly show the shipping label, seals, opening, phone and included items. If our team is unavailable, record the video before opening the parcel.",
  },
  {
    title: "Keep evidence and report any issue",
    body: "If you find a wrong item, missing item, damage or defect, report it within 48 hours with your order number and unboxing video, or details of the video call. Keep the packaging and any photos so we can assess your claim and resolve eligible issues under our replacement policy.",
  },
  {
    title: "Pay only the confirmed balance",
    body: "Your online advance is already deducted from the total. Pay only the delivery balance on this receipt. Never disclose your UPI PIN, banking OTP or card details, install an app at someone’s request, or make an extra transfer to release the parcel. Share a delivery OTP only when the correct parcel is physically being handed to you and you are ready to accept it.",
  },
] as const;
