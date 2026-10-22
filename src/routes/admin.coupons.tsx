import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createAdminCoupon, disableAdminCoupon, getAdminCoupons } from "@/lib/coupons.functions";
import { formatINR } from "@/lib/format";
import type { Coupon } from "@/lib/coupons";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({
    meta: [
      { title: "Single-use Coupons — Aghanims Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCoupons,
});

type AdminCoupon = Coupon & { order: { id: string; order_number: string; status: string } | null };
async function adminToken() {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error("Your admin session has expired.");
  return data.session.access_token;
}
function newCode() {
  return `SORRY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
function status(coupon: AdminCoupon) {
  if (coupon.orderId)
    return coupon.order?.status === "pending" ? "Reserved for payment" : "Used / claimed";
  if (coupon.disabled) return "Disabled";
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) <= Date.now()) return "Expired";
  return "Available";
}

function AdminCoupons() {
  const getCoupons = useServerFn(getAdminCoupons);
  const createCoupon = useServerFn(createAdminCoupon);
  const disableCoupon = useServerFn(disableAdminCoupon);
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [loadError, setLoadError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setCoupons(await getCoupons({ data: { token: await adminToken() } }));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load coupons.");
    } finally {
      setLoading(false);
    }
  }, [getCoupons]);
  useEffect(() => {
    setCode(newCode());
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Single-use coupons</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Create a personal apology or goodwill coupon. Prepaid only: a ₹500 coupon replaces the
          ₹250 prepaid discount, giving ₹500 off in total.
        </p>
      </div>
      <form
        className="grid gap-4 rounded border bg-white p-5 sm:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const values = new FormData(form);
          setBusy(true);
          try {
            const expiry = String(values.get("expiry") || "");
            await createCoupon({
              data: {
                token: await adminToken(),
                code,
                amountPaise: Math.round(Number(values.get("amount")) * 100),
                email: String(values.get("email") || "").trim(),
                reason: String(values.get("reason") || ""),
                expiresAt: expiry ? new Date(`${expiry}T23:59:59+05:30`).toISOString() : null,
              },
            });
            toast.success(`Coupon ${code} created. Share it privately with the customer.`);
            form.reset();
            setCode(newCode());
            await refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not create coupon.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="space-y-1 text-sm font-medium">
          Coupon code
          <div className="flex gap-2">
            <input
              required
              minLength={4}
              maxLength={40}
              pattern="[A-Za-z0-9-]+"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className="min-w-0 flex-1 rounded border p-2"
            />
            <button
              type="button"
              onClick={() => setCode(newCode())}
              className="rounded border px-3 text-xs"
            >
              Generate
            </button>
          </div>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Discount amount (₹)
          <input
            name="amount"
            type="number"
            min="1"
            max="100000"
            step="1"
            defaultValue="500"
            required
            className="block w-full rounded border p-2"
          />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Recipient email (recommended)
          <input
            name="email"
            type="email"
            placeholder="Leave blank to allow anyone with the code"
            className="block w-full rounded border p-2"
          />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Expiry date (optional, India time)
          <input name="expiry" type="date" className="block w-full rounded border p-2" />
        </label>
        <label className="space-y-1 text-sm font-medium sm:col-span-2">
          Internal reason / order reference
          <input
            name="reason"
            maxLength={500}
            placeholder="Late delivery apology for order ES-…"
            className="block w-full rounded border p-2"
          />
        </label>
        <p className="text-xs text-on-surface-variant sm:col-span-2">
          One order per code, with at least ₹1 payable online. Product discount only; gift wrapping
          is excluded. Any unused coupon value is forfeited. A code is reserved when checkout
          starts; payment retries use the same order. Claimed codes are never reactivated, including
          after cancellation or refund. Issue a new code if needed.
        </p>
        <button
          disabled={busy}
          className="min-h-11 rounded bg-primary px-4 py-3 font-bold text-on-primary disabled:opacity-50 sm:col-span-2"
        >
          {busy ? "Saving…" : "Create single-use coupon"}
        </button>
      </form>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Recent coupons (up to 500)</h2>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading || busy}
            className="min-h-11 px-3 text-sm underline"
          >
            Refresh
          </button>
        </div>
        {loadError && (
          <p role="alert" className="text-sm text-red-700">
            {loadError}
          </p>
        )}
        {loading ? (
          <p>Loading coupons…</p>
        ) : !coupons.length ? (
          <p className="text-sm text-on-surface-variant">No coupons yet.</p>
        ) : (
          <div className="overflow-x-auto rounded border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-surface-container-low">
                  <th className="p-3">Code / value</th>
                  <th className="p-3">Recipient / reason</th>
                  <th className="p-3">Status / order</th>
                  <th className="p-3">Expires</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.code} className="border-b align-top">
                    <td className="p-3">
                      <strong>{coupon.code}</strong>
                      <p>{formatINR(coupon.amountPaise)}</p>
                    </td>
                    <td className="p-3">
                      <p>{coupon.email || "Anyone with this code"}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{coupon.reason}</p>
                    </td>
                    <td className="p-3">
                      <p>{status(coupon)}</p>
                      <p className="text-xs">
                        {coupon.order?.order_number} {coupon.order?.status}
                      </p>
                    </td>
                    <td className="p-3">
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })
                        : "No expiry"}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        className="min-h-11 px-2 underline"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(coupon.code);
                            toast.success("Coupon code copied.");
                          } catch {
                            toast.error("Select and copy the code manually.");
                          }
                        }}
                      >
                        Copy
                      </button>
                      {!coupon.orderId && !coupon.disabled && (
                        <button
                          type="button"
                          disabled={busy}
                          className="min-h-11 px-2 text-red-700 underline"
                          onClick={async () => {
                            setBusy(true);
                            try {
                              await disableCoupon({
                                data: { token: await adminToken(), code: coupon.code },
                              });
                              await refresh();
                            } catch (error) {
                              toast.error(
                                error instanceof Error
                                  ? error.message
                                  : "Could not disable coupon.",
                              );
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          Disable
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
