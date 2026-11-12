import { formatINR } from "@/lib/format";

export function CodAdvanceNotice({
  advancePaise,
  balancePaise,
}: {
  advancePaise: number;
  balancePaise: number;
}) {
  return (
    <section
      aria-label="Required COD advance"
      className="rounded-lg border-2 border-orange-500 bg-orange-50 p-4 text-left text-orange-950 sm:p-5"
    >
      <p className="text-sm font-bold">Advance payment required for COD</p>
      <p className="mt-1 text-4xl font-black leading-tight">{formatINR(advancePaise)}</p>
      <p className="mt-2 text-sm font-semibold leading-relaxed">
        We’ll call you within 1 hour to confirm your order and arrange this payment before dispatch.
      </p>
      <p className="mt-2 text-sm">
        Deducted from your total. Pay the remaining <strong>{formatINR(balancePaise)}</strong> on
        delivery.
      </p>
    </section>
  );
}
