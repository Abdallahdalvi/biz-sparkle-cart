import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { trackPublicShipment, type PublicTrackingResult } from "@/lib/shiprocket.functions";

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: search.orderId as string | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Track Your Order — Aghanims Phones and Gadgets" },
      {
        name: "description",
        content: "Check live delivery status for your boutique tech hardware.",
      },
      { property: "og:title", content: "Track Your Order — Aghanims Phones and Gadgets" },
      {
        property: "og:description",
        content: "Check live delivery status for your boutique tech hardware.",
      },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const searchParams = Route.useSearch();
  const [orderId, setOrderId] = useState(searchParams.orderId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublicTrackingResult | null>(null);
  const trackShipmentFn = useServerFn(trackPublicShipment);

  React.useEffect(() => {
    if (searchParams.orderId) {
      fetchTracking(searchParams.orderId);
    }
    // The route search value is the only trigger; the server-function binding is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.orderId]);

  async function fetchTracking(idToSearch: string) {
    if (!idToSearch.trim()) {
      setError("Please enter a valid Order ID or AWB Tracking Number");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const cleanId = idToSearch.trim();
      const result = await trackShipmentFn({ data: { identifier: cleanId } });
      setData(result);
      toast.success(
        result.milestones.length
          ? "Live Shiprocket tracking loaded."
          : "Order found. Courier scans are not available yet.",
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to fetch tracking details. Please verify your Order ID.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await fetchTracking(orderId);
  }

  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12 md:py-16">
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>{" "}
            / Track Order
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary max-w-2xl">
            Order Tracking Engine
          </h1>
          <p className="text-on-surface-variant mt-4 max-w-xl">
            Real-time fulfillment telemetry. Track your priority shipments across customs, air
            gateways, and local courier networks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant/40 p-6 rounded shadow-sm space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">saved_search</span>
                Enter Dispatch Credentials
              </h3>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
                    Order ID or Tracking AWB
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. Aghanims Phones and Gadgets-99482 or SR-AWB-..."
                    className="w-full bg-white border border-outline-variant/40 px-3 py-2.5 text-xs font-medium focus:outline-none font-mono focus:border-primary shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary py-3.5 font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Interrogating Telemetry...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">
                        location_searching
                      </span>{" "}
                      Track Hardware
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded text-rose-900 text-xs space-y-1">
                  <p className="font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span> Tracking
                    Exception
                  </p>
                  <p>{error}</p>
                </div>
              )}
            </div>

            <div className="bg-white border border-outline-variant/40 p-6 rounded shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-emerald-600">
                  support_agent
                </span>
                Priority Support Gateway
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Need help with an address or delivery update? Contact support and include your order
                number or AWB.
              </p>
              <Link
                to="/legal/contact"
                className="w-full bg-[#25D366] text-white py-3 font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2 rounded"
              >
                <span className="material-symbols-outlined text-base">forum</span> Contact Support
              </Link>
            </div>
          </div>

          {/* Tracking Telemetry Panel */}
          <div className="lg:col-span-2">
            {data ? (
              <div className="bg-white border border-outline-variant/40 rounded shadow-sm overflow-hidden space-y-6">
                {/* Meta Summary Banner */}
                <div className="bg-surface-container-lowest border-b border-outline-variant/40 p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                      Waybill AWB
                    </span>
                    <span className="text-xs font-bold text-primary font-mono">
                      {data.awb || "Not assigned yet"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                      Assigned Carrier
                    </span>
                    <span className="text-xs font-bold text-primary">{data.carrier}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                      Payment Protocol
                    </span>
                    <span className="text-xs font-bold text-emerald-700">{data.paymentMode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                      Estimated Handover
                    </span>
                    <span className="text-xs font-bold text-primary">{data.estimatedDelivery}</span>
                  </div>
                </div>

                {/* Vertical Timeline */}
                <div className="p-6 sm:p-8">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">route</span>
                    Shiprocket Webhook Milestone History
                  </h3>

                  {data.milestones.length ? (
                    <div className="relative pl-6 sm:pl-8 space-y-10 border-l-2 border-outline-variant/40 ml-2 sm:ml-4">
                      {data.milestones.map((m, idx) => (
                        <div key={idx} className="relative group">
                          {/* Status Node */}
                          <span
                            className={
                              "absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white transition-transform group-hover:scale-110 " +
                              (m.status === "completed"
                                ? "border-emerald-600 bg-emerald-50 text-emerald-600"
                                : m.status === "active"
                                  ? "border-primary bg-primary text-on-primary animate-pulse"
                                  : "border-outline text-outline")
                            }
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {m.status === "completed"
                                ? "check"
                                : m.status === "active"
                                  ? "flight_takeoff"
                                  : "schedule"}
                            </span>
                          </span>

                          {/* Milestone Content */}
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4
                                className={
                                  "text-sm font-bold uppercase tracking-wider " +
                                  (m.status === "pending"
                                    ? "text-on-surface-variant"
                                    : "text-primary")
                                }
                              >
                                {m.title}
                              </h4>
                              <span className="text-[11px] font-mono font-semibold text-on-surface-variant bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/30">
                                {m.time}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">
                                pin_drop
                              </span>{" "}
                              {m.location}
                            </p>
                            <p className="text-xs text-on-surface-variant/80 pt-1 max-w-2xl leading-relaxed">
                              {m.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded p-5 text-xs text-on-surface-variant">
                      {data.shipmentCreated
                        ? "The shipment exists in Shiprocket, but the courier has not published scan events yet."
                        : "The order is confirmed, but a Shiprocket shipment and AWB have not been assigned yet."}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest border border-dashed border-outline-variant/60 rounded p-12 text-center text-on-surface-variant space-y-4 shadow-sm">
                <span className="material-symbols-outlined text-5xl opacity-80">
                  swap_driving_apps_wheel
                </span>
                <h3 className="text-base font-bold text-primary uppercase tracking-wider">
                  Awaiting Telemetry Interrogation
                </h3>
                <p className="text-xs max-w-md mx-auto leading-relaxed">
                  Enter your assigned Aghanims Phones and Gadgets Order ID or Shiprocket AWB
                  tracking credentials in the panel to pull live satellite and warehouse logistics
                  milestones.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
