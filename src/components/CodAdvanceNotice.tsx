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
      className="rounded-lg border border-orange-300 bg-orange-50 p-4 text-start text-orange-950"
    >
      <p className="text-sm font-bold">COD advance</p>
      <p className="mt-1 text-3xl font-black leading-tight">{formatINR(advancePaise)}</p>
      <p className="mt-2 text-sm font-semibold leading-relaxed">
        We’ll call within 1 hour to confirm your COD order and share a QR code for the advance.
      </p>
      <p className="mt-2 text-sm">
        Deducted from your total. <strong>Balance on delivery: {formatINR(balancePaise)}</strong>
      </p>
    </section>
  );
}
