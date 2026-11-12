import { readGiftCard } from "@/lib/gift-card";
import { formatINR } from "@/lib/format";

export function GiftCardSummary({ address }: { address: unknown }) {
  const gift = readGiftCard(address);
  if (!gift) return null;
  return (
    <section className="rounded border border-purple-200 bg-purple-50 p-4 text-sm text-purple-950">
      <h3 className="font-bold">Gift wrapping + greeting card · {formatINR(gift.fee_paise)}</h3>
      <p className="mt-1 text-xs">
        Gift-wrap this order and include a greeting card with the message below.
      </p>
      {gift.to && (
        <p className="mt-2">
          To:{" "}
          <span translate="no" dir="auto">
            {gift.to}
          </span>
        </p>
      )}
      {gift.from && (
        <p>
          From:{" "}
          <span translate="no" dir="auto">
            {gift.from}
          </span>
        </p>
      )}
      <p translate="no" dir="auto" className="mt-2 whitespace-pre-wrap break-words">
        {gift.message}
      </p>
    </section>
  );
}
