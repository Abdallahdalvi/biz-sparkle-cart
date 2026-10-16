import { z } from "zod";

export const GIFT_CARD_PRICE_PAISE = 29900;
export const GIFT_CARD_ITEM_NAME = "Gift wrapping + personalised greeting card";
export const giftCardInputSchema = z.object({
  to: z.string().trim().max(80).default(""),
  from: z.string().trim().max(80).default(""),
  message: z.string().trim().min(1, "Write a message for the greeting card").max(300),
});
export type GiftCardInput = z.infer<typeof giftCardInputSchema>;
const storedGiftSchema = giftCardInputSchema.extend({ fee_paise: z.number().int().min(0) });
export function readGiftCard(address: unknown) {
  if (!address || typeof address !== "object") return null;
  const result = storedGiftSchema.safeParse((address as Record<string, unknown>).gift_card);
  return result.success ? result.data : null;
}

export function giftCardLines(address: unknown) {
  const gift = readGiftCard(address);
  return gift
    ? [
        "GIFT WRAP THIS ORDER — include the personalised greeting card below",
        ...(gift.to ? [`To: ${gift.to}`] : []),
        ...(gift.from ? [`From: ${gift.from}`] : []),
        gift.message,
      ]
    : [];
}
export function giftCardHtml(address: unknown) {
  const lines = giftCardLines(address);
  const escaped = lines
    .join("\n")
    .replace(
      /[&<>"']/g,
      (character) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!,
    );
  return lines.length
    ? `<div style="white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid #ccc;padding:16px;margin-top:16px">${escaped}</div>`
    : "";
}

export const GIFT_CARD_MESSAGES = [
  {
    label: "Festive wishes",
    message:
      "Wishing you a joyful festive season filled with happiness, love and wonderful surprises!",
  },
  {
    label: "With love",
    message: "A little gift to make you smile. Sending you lots of love and warm wishes!",
  },
  {
    label: "Thank you",
    message:
      "Thank you for being so special. Here is a little something to show how much you mean to me!",
  },
];

export function calculateGiftOrderAmounts(input: {
  merchandisePaise: number;
  prepaidDiscountPaise: number;
  codAdvancePaise: number;
  payMode: "cod" | "prepaid";
  hasGiftCard: boolean;
}) {
  for (const value of [input.merchandisePaise, input.codAdvancePaise]) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error("Invalid order amount");
  }
  if (!Number.isFinite(input.prepaidDiscountPaise)) throw new Error("Invalid prepaid discount");
  const giftFeePaise = input.hasGiftCard ? GIFT_CARD_PRICE_PAISE : 0;
  const discountPaise =
    input.payMode === "prepaid"
      ? Math.min(input.merchandisePaise, Math.max(0, Math.round(input.prepaidDiscountPaise)))
      : 0;
  const subtotalPaise = input.merchandisePaise + giftFeePaise;
  const totalPaise = subtotalPaise - discountPaise;
  const advancePaise = input.payMode === "cod" ? Math.min(input.codAdvancePaise, totalPaise) : 0;
  return {
    giftFeePaise,
    subtotalPaise,
    totalPaise,
    discountPaise,
    advancePaise,
    codCollectablePaise: input.payMode === "cod" ? totalPaise - advancePaise : 0,
    paymentAmountPaise: input.payMode === "cod" ? advancePaise : totalPaise,
  };
}
