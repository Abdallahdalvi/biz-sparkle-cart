import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  cancelShiprocketShipment,
  generateShiprocketAwb,
  generateShiprocketDocument,
  getShiprocketCourierOptions,
  getShiprocketPickupLocations,
  requestShiprocketPickup,
} from "@/lib/shiprocket.functions";
import type { ShiprocketCourierOption, ShiprocketCourierQuotes } from "@/lib/shiprocket.functions";
import { getSellerNotes, saveSellerNote as saveSellerNoteServer } from "@/lib/operations.functions";

interface ShippingAddress {
  first_name?: string;
  last_name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
}

interface OrderItem {
  name: string;
  qty: number;
  unit_price_paise: number;
  variant_label?: string | null;
}

interface Order {
  id: string;
  order_number: string;
  email: string;
  phone?: string | null;
  shipping_address?: ShippingAddress | null;
  status: string;
  total_paise: number;
  created_at: string;
  tracking_url: string | null;
  shiprocket_order_id: string | null;
  shiprocket_shipment_id: string | null;
  notes?: string | null;
  cashfree_payment_id?: string | null;
  razorpay_payment_id?: string | null;
  order_items?: OrderItem[];
  seller_notes?: string;
}

interface PickupLocation {
  name: string;
  city: string;
  state: string;
  pincode: string;
  active: boolean;
}

function trackingCode(order: Order) {
  if (!order.tracking_url) return "";
  return decodeURIComponent(order.tracking_url.split("/").filter(Boolean).pop() ?? "");
}

function hasRealAwb(order: Order) {
  const code = trackingCode(order);
  return Boolean(order.shiprocket_shipment_id && code && !/^SRK-ES-/i.test(code));
}

const STATUSES = [
  "pending",
  "paid",
  "processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sellerNotes, setSellerNotes] = useState<Record<string, string>>({});
  const [pkgWeight, setPkgWeight] = useState("0.5");
  const [pkgDims, setPkgDims] = useState("20x15x10");
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [pickupLocation, setPickupLocation] = useState("Primary");
  const [courierOptions, setCourierOptions] = useState<ShiprocketCourierOption[]>([]);
  const [courierQuote, setCourierQuote] = useState<Omit<ShiprocketCourierQuotes, "options"> | null>(
    null,
  );
  const [selectedCourierId, setSelectedCourierId] = useState<number | null>(null);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [courierSort, setCourierSort] = useState<"recommended" | "cheapest" | "fastest" | "rating">(
    "recommended",
  );
  const [courierMode, setCourierMode] = useState<"all" | "Air" | "Surface">("all");
  const [shiprocketAction, setShiprocketAction] = useState<string | null>(null);
  const generateAwbFn = useServerFn(generateShiprocketAwb);
  const pickupLocationsFn = useServerFn(getShiprocketPickupLocations);
  const courierOptionsFn = useServerFn(getShiprocketCourierOptions);
  const documentFn = useServerFn(generateShiprocketDocument);
  const pickupFn = useServerFn(requestShiprocketPickup);
  const cancelShipmentFn = useServerFn(cancelShiprocketShipment);
  const getSellerNotesFn = useServerFn(getSellerNotes);
  const saveSellerNoteFn = useServerFn(saveSellerNoteServer);

  async function load() {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, email, phone, shipping_address, status, total_paise, created_at, tracking_url, shiprocket_order_id, shiprocket_shipment_id, notes, cashfree_payment_id, razorpay_payment_id, order_items(name, qty, unit_price_paise, variant_label)",
      )
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const loaded = (data as Order[]) ?? [];
    setOrders(loaded);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (token) setSellerNotes(await getSellerNotesFn({ data: { token } }));
    } catch (notesError) {
      toast.error(notesError instanceof Error ? notesError.message : "Unable to load seller notes");
    }
  }

  useEffect(() => {
    load();
    void loadPickupLocations();
    // The admin route mounts only after auth has resolved; reloads are triggered explicitly after mutations.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPickupLocations() {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      const locations = await pickupLocationsFn({ data: { token } });
      const active = locations.filter((location) => location.active && location.name);
      setPickupLocations(active);
      if (active.length && !active.some((location) => location.name === pickupLocation)) {
        setPickupLocation(active[0].name);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load Shiprocket pickup locations",
      );
    }
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order status updated to ${status}`);
    load();
  }

  function readPackageDetails() {
    const weight = Number(pkgWeight);
    const dimensions = pkgDims
      .toLowerCase()
      .split("x")
      .map((part) => Number(part.trim()));
    if (!Number.isFinite(weight) || weight <= 0) {
      throw new Error("Enter a valid package weight in kilograms");
    }
    if (
      dimensions.length !== 3 ||
      dimensions.some((dimension) => !Number.isFinite(dimension) || dimension <= 0)
    ) {
      throw new Error("Enter dimensions as length × breadth × height, for example 20x15x10");
    }
    return {
      weightKg: weight,
      lengthCm: dimensions[0],
      breadthCm: dimensions[1],
      heightCm: dimensions[2],
      pickupLocation,
    };
  }

  async function loadCourierOptions(id: string) {
    setLoadingCouriers(true);
    setCourierOptions([]);
    setCourierQuote(null);
    setSelectedCourierId(null);
    try {
      const packageDetails = readPackageDetails();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Your admin session has expired. Sign in again.");
      const quote = await courierOptionsFn({
        data: { token, orderId: id, package: packageDetails },
      });
      setCourierQuote({
        paymentMode: quote.paymentMode,
        pickupPincode: quote.pickupPincode,
        deliveryPincode: quote.deliveryPincode,
        shipmentValue: quote.shipmentValue,
        accountCourierCount: quote.accountCourierCount,
        serviceablePincodeCount: quote.serviceablePincodeCount,
        pickupPincodeCount: quote.pickupPincodeCount,
      });
      setCourierOptions(quote.options);
      setSelectedCourierId(quote.options[0]?.id ?? null);
      if (!quote.options.length) {
        toast.warning("No Shiprocket courier currently services this package and route");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load live courier rates");
    } finally {
      setLoadingCouriers(false);
    }
  }

  function toggleOrderPanel(order: Order) {
    if (expandedId === order.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(order.id);
    if (!hasRealAwb(order)) void loadCourierOptions(order.id);
  }

  async function generateAWB(id: string) {
    if (!selectedCourierId) {
      toast.error("Choose a live Shiprocket courier before generating the AWB");
      return;
    }

    setSimulatingId(id);
    try {
      const packageDetails = readPackageDetails();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Your admin session has expired. Sign in again.");
      const result = await generateAwbFn({
        data: {
          token,
          orderId: id,
          package: {
            ...packageDetails,
            courierId: selectedCourierId,
          },
        },
      });
      if (result.pickupScheduled) {
        toast.success(`Real AWB ${result.awb} assigned via ${result.courier}; pickup requested.`);
      } else {
        toast.warning(
          `AWB ${result.awb} assigned, but pickup needs attention: ${result.pickupMessage}`,
        );
      }
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Shiprocket AWB generation failed");
    } finally {
      setSimulatingId(null);
    }
  }

  async function getAdminToken() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Your admin session has expired. Sign in again.");
    return token;
  }

  async function openShiprocketDocument(
    orderId: string,
    type: "label" | "invoice" | "manifest" | "label-invoice",
  ) {
    const popup = window.open("about:blank", "_blank");
    setShiprocketAction(`${orderId}:${type}`);
    try {
      const token = await getAdminToken();
      const result = await documentFn({ data: { token, orderId, type } });
      if (popup) popup.location.href = result.url;
      else window.open(result.url, "_blank", "noopener,noreferrer");
      toast.success(`${type.replace("-", " + ")} generated by Shiprocket`);
    } catch (error) {
      popup?.close();
      toast.error(error instanceof Error ? error.message : "Document generation failed");
    } finally {
      setShiprocketAction(null);
    }
  }

  async function retryPickup(orderId: string) {
    setShiprocketAction(`${orderId}:pickup`);
    try {
      const token = await getAdminToken();
      const result = await pickupFn({ data: { token, orderId } });
      if (result.scheduled) toast.success(result.message);
      else toast.warning(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pickup request failed");
    } finally {
      setShiprocketAction(null);
    }
  }

  async function cancelShipment(orderId: string) {
    if (!window.confirm("Cancel this real Shiprocket shipment before pickup?")) return;
    setShiprocketAction(`${orderId}:cancel`);
    try {
      const token = await getAdminToken();
      const result = await cancelShipmentFn({ data: { token, orderId } });
      toast.success(result.message);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Shipment cancellation failed");
    } finally {
      setShiprocketAction(null);
    }
  }

  async function handleBulkStatus(newStatus: string) {
    if (selectedIds.length === 0) return toast.error("Select at least one order");
    for (const id of selectedIds) {
      await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    }
    toast.success(`Bulk updated ${selectedIds.length} orders to ${newStatus}`);
    setSelectedIds([]);
    load();
  }

  async function saveSellerNote(id: string) {
    try {
      const token = await getAdminToken();
      await saveSellerNoteFn({ data: { token, orderId: id, note: sellerNotes[id] || "" } });
      toast.success("Seller internal note saved for the whole admin team");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save seller note");
    }
  }

  function printPackingSlip(o: Order) {
    const addr = o.shipping_address || {};
    const itemRows = (o.order_items ?? [])
      .map(
        (item) => `
          <tr>
            <td>${item.name}${item.variant_label ? ` — ${item.variant_label}` : ""}</td>
            <td>${item.qty}</td>
            <td>${formatINR(item.unit_price_paise)}</td>
            <td>${formatINR(item.unit_price_paise * item.qty)}</td>
          </tr>`,
      )
      .join("");
    const content = `
      <html>
        <head>
          <title>Packing Slip - ${o.order_number}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
            .store-name { font-size: 28px; font-weight: bold; letter-spacing: 2px; }
            .title { font-size: 20px; font-weight: bold; color: #555; }
            .details-grid { display: flex; justify-content: space-between; margin-bottom: 40px; font-size: 14px; }
            .box { border: 1px solid #ccc; padding: 20px; width: 45%; background: #fafafa; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 14px; }
            .table th { background-color: #f5f5f5; font-weight: bold; }
            .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">Aghanims Phones and Gadgets</div>
             <div class="title">PACKING SLIP</div>
          </div>
          <div class="details-grid">
            <div class="box">
              <h3><strong>Ship To:</strong></h3>
              <p><strong>${addr.first_name || "Customer"} ${addr.last_name || ""}</strong></p>
              <p>${addr.line1 || "No address provided"}</p>
              ${addr.line2 ? `<p>${addr.line2}</p>` : ""}
              <p>${addr.city || ""}, ${addr.state || ""} - ${addr.pincode || ""}</p>
              <p><strong>Phone:</strong> ${o.phone || "N/A"}</p>
              ${addr.gstin ? `<p><strong>Buyer GSTIN:</strong> ${addr.gstin}</p>` : ""}
            </div>
            <div class="box">
              <h3><strong>Order Details:</strong></h3>
              <p><strong>Order ID:</strong> ${o.order_number}</p>
              <p><strong>Order Date:</strong> ${new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
               <p><strong>Payment Mode:</strong> ${o.notes === "cod" ? "Cash on Delivery" : "Prepaid"}</p>
               <p><strong>Order Status:</strong> ${o.status.toUpperCase()}</p>
              <p><strong>Grand Total:</strong> ${formatINR(o.total_paise)}</p>
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Quantity</th>
                 <th>Unit Price (INR)</th>
                 <th>Total Price (INR)</th>
              </tr>
            </thead>
            <tbody>
               ${itemRows || '<tr><td colspan="4">No line items found for this legacy order.</td></tr>'}
            </tbody>
          </table>
          <div class="footer">
            <p>Thank you for shopping with Aghanims Phones and Gadgets! If you have any questions about your order, please contact support.</p>
             <p>Fulfilment managed through the Aghanims order system.</p>
          </div>
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(content);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 500);
    }
  }

  if (!orders)
    return (
      <p className="text-on-surface-variant animate-pulse">Loading orders and fulfilment logs…</p>
    );

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const visibleCourierOptions = [...courierOptions]
    .filter((courier) => courierMode === "all" || courier.mode === courierMode)
    .sort((a, b) => {
      if (courierSort === "cheapest") return a.rate - b.rate;
      if (courierSort === "fastest")
        return (a.etdHours ?? Number.MAX_SAFE_INTEGER) - (b.etdHours ?? Number.MAX_SAFE_INTEGER);
      if (courierSort === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      return Number(b.recommended) - Number(a.recommended) || a.rate - b.rate;
    });

  return (
    <div className="space-y-6">
      {/* Bulk Actions Header */}
      {selectedIds.length > 0 && (
        <div className="bg-primary text-on-primary p-4 rounded shadow-sm flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
          <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_box</span>
            {selectedIds.length} Orders Selected
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Bulk Change Status:</span>
            <div className="flex flex-wrap gap-1">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handleBulkStatus(s)}
                  className="bg-white text-primary hover:bg-surface-container-low px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-surface-container-low shopify-border p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
          <span>Filter Status:</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setFilter("all")}
              className={
                "px-3 py-1 " +
                (filter === "all"
                  ? "bg-primary text-on-primary"
                  : "bg-white border border-outline-variant/40 hover:bg-surface-container")
              }
            >
              All
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={
                  "px-3 py-1 " +
                  (filter === s
                    ? "bg-primary text-on-primary"
                    : "bg-white border border-outline-variant/40 hover:bg-surface-container")
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-on-surface-variant font-medium">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white shopify-border p-12 text-center text-on-surface-variant">
          No orders yet.
        </div>
      ) : (
        <div className="bg-white shopify-border overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant/40">
              <tr className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredOrders.length > 0 && selectedIds.length === filteredOrders.length
                    }
                    onChange={(e) =>
                      setSelectedIds(e.target.checked ? filteredOrders.map((o) => o.id) : [])
                    }
                    className="cursor-pointer"
                  />
                </th>
                <th className="p-4">Order Info</th>
                <th className="p-4">Customer & Phone</th>
                <th className="p-4">Payment Tracking</th>
                <th className="p-4">Shipment Tracking</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {filteredOrders.map((o) => {
                const isExpanded = expandedId === o.id;
                const isSelected = selectedIds.includes(o.id);
                const addr = o.shipping_address || {};

                return (
                  <React.Fragment key={o.id}>
                    <tr
                      className={`hover:bg-surface-container-lowest transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            setSelectedIds(
                              e.target.checked
                                ? [...selectedIds, o.id]
                                : selectedIds.filter((id) => id !== o.id),
                            )
                          }
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="p-4 cursor-pointer" onClick={() => toggleOrderPanel(o)}>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-on-surface-variant">
                            {isExpanded ? "expand_less" : "expand_more"}
                          </span>
                          <div>
                            <p className="font-bold text-primary hover:underline">
                              {o.order_number}
                            </p>
                            <p className="text-[11px] text-on-surface-variant">
                              {new Date(o.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 cursor-pointer" onClick={() => toggleOrderPanel(o)}>
                        <p className="font-medium text-primary">{o.email}</p>
                        <p className="text-xs text-on-surface-variant">
                          {o.phone || "No phone provided"}
                        </p>
                        {addr.gstin && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            GSTIN: {addr.gstin}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-primary">{formatINR(o.total_paise)}</p>
                        {o.cashfree_payment_id || o.razorpay_payment_id ? (
                          <p className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                            {o.cashfree_payment_id || o.razorpay_payment_id}
                          </p>
                        ) : o.notes === "cod" ? (
                          <p className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                            Cash on Delivery
                          </p>
                        ) : (
                          <p className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded inline-block mt-0.5">
                            Awaiting Online Payment
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        {hasRealAwb(o) ? (
                          <div className="space-y-1">
                            <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded block w-max">
                              {trackingCode(o)}
                            </span>
                            <a
                              href={o.tracking_url ?? undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-primary underline hover:text-primary/80 block"
                            >
                              Open Live Tracking ↗
                            </a>
                          </div>
                        ) : o.tracking_url ? (
                          <span className="text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded inline-block font-medium">
                            Legacy test AWB — replace it
                          </span>
                        ) : (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block font-medium">
                            Pending AWB Assignment
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className="border border-outline-variant/40 bg-white px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest shadow-sm focus:border-primary"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-right space-y-1.5">
                        <button
                          onClick={() => toggleOrderPanel(o)}
                          className="border border-outline-variant/40 bg-white text-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest block w-full text-center hover:bg-surface-container-lowest transition-colors shadow-sm"
                        >
                          {isExpanded ? "Close Panel" : "Expand OMS ⚙️"}
                        </button>
                        {!hasRealAwb(o) &&
                          !["pending", "cancelled", "refunded"].includes(o.status) && (
                            <button
                              disabled={loadingCouriers}
                              onClick={() => {
                                setExpandedId(o.id);
                                void loadCourierOptions(o.id);
                              }}
                              className="bg-blue-600 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest block w-full text-center hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                            >
                              {loadingCouriers && expandedId === o.id
                                ? "Loading couriers…"
                                : "+ Choose Courier & AWB"}
                            </button>
                          )}
                      </td>
                    </tr>

                    {/* Expanded OMS Details Panel */}
                    {isExpanded && (
                      <tr className="bg-surface-container-lowest border-b border-outline-variant/40">
                        <td colSpan={7} className="p-6 md:p-8">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Shipping Address & Details */}
                            <div className="bg-white p-6 border border-outline-variant/40 rounded shadow-sm space-y-4">
                              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                                <h4 className="font-bold text-sm text-primary uppercase tracking-tight flex items-center gap-2">
                                  <span className="material-symbols-outlined text-base text-primary">
                                    local_shipping
                                  </span>
                                  Customer Shipping Address
                                </h4>
                                <button
                                  onClick={() => printPackingSlip(o)}
                                  className="bg-primary text-on-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm hover:opacity-90 flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-xs">print</span>
                                  Print Slip
                                </button>
                              </div>
                              <div className="text-xs text-on-surface-variant space-y-1.5 leading-relaxed font-medium">
                                <p className="font-bold text-primary text-sm">
                                  {addr.first_name || "Customer"} {addr.last_name || ""}
                                </p>
                                <p>{addr.line1 || "No address line 1 provided"}</p>
                                {addr.line2 && <p>{addr.line2}</p>}
                                <p>
                                  {addr.city || "City"}, {addr.state || "State"} -{" "}
                                  <span className="font-bold text-primary">
                                    {addr.pincode || "PIN"}
                                  </span>
                                </p>
                                <p className="pt-2 border-t border-outline-variant/20">
                                  <strong>Phone:</strong> {o.phone || "N/A"}
                                </p>
                                <p>
                                  <strong>Email:</strong> {o.email}
                                </p>
                                {addr.gstin && (
                                  <p className="text-purple-700 font-bold">
                                    <strong>Business GSTIN:</strong> {addr.gstin}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Shiprocket AWB Preparation */}
                            <div className="bg-white p-6 border border-outline-variant/40 rounded shadow-sm space-y-4">
                              <h4 className="font-bold text-sm text-primary uppercase tracking-tight border-b border-outline-variant/30 pb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-blue-600">
                                  inventory_2
                                </span>
                                Shiprocket Package Prep
                              </h4>
                              <div className="space-y-3 text-xs">
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                                    Package Weight (KG)
                                  </label>
                                  <input
                                    type="text"
                                    value={pkgWeight}
                                    onChange={(e) => {
                                      setPkgWeight(e.target.value);
                                      setCourierOptions([]);
                                      setCourierQuote(null);
                                      setSelectedCourierId(null);
                                    }}
                                    className="w-full bg-surface-container-low border border-outline-variant/40 p-2 font-medium focus:outline-none focus:border-primary"
                                    placeholder="e.g. 0.5"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                                    Dimensions L×W×H (CM)
                                  </label>
                                  <input
                                    type="text"
                                    value={pkgDims}
                                    onChange={(e) => {
                                      setPkgDims(e.target.value);
                                      setCourierOptions([]);
                                      setCourierQuote(null);
                                      setSelectedCourierId(null);
                                    }}
                                    className="w-full bg-surface-container-low border border-outline-variant/40 p-2 font-medium focus:outline-none focus:border-primary"
                                    placeholder="e.g. 20x15x10"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                                    Pickup Location
                                  </label>
                                  <select
                                    value={pickupLocation}
                                    onChange={(event) => {
                                      setPickupLocation(event.target.value);
                                      setCourierOptions([]);
                                      setCourierQuote(null);
                                      setSelectedCourierId(null);
                                    }}
                                    className="w-full bg-surface-container-low border border-outline-variant/40 p-2 font-medium focus:outline-none focus:border-primary"
                                  >
                                    {pickupLocations.length ? (
                                      pickupLocations.map((location) => (
                                        <option key={location.name} value={location.name}>
                                          {location.name} — {location.city}, {location.state}{" "}
                                          {location.pincode}
                                        </option>
                                      ))
                                    ) : (
                                      <option value="Primary">Primary</option>
                                    )}
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                      Live Shiprocket Courier Quotes
                                    </label>
                                    <button
                                      type="button"
                                      disabled={loadingCouriers}
                                      onClick={() => loadCourierOptions(o.id)}
                                      className="text-[10px] font-bold text-blue-700 hover:underline disabled:opacity-50"
                                    >
                                      {loadingCouriers ? "Checking…" : "Refresh rates"}
                                    </button>
                                  </div>

                                  {courierQuote && (
                                    <div className="rounded border border-outline-variant/40 bg-surface-container-lowest p-2 text-[10px] grid grid-cols-2 gap-2">
                                      <span>
                                        <strong>Payment:</strong>{" "}
                                        <b
                                          className={
                                            courierQuote.paymentMode === "COD"
                                              ? "text-amber-700"
                                              : "text-emerald-700"
                                          }
                                        >
                                          {courierQuote.paymentMode}
                                        </b>
                                      </span>
                                      <span>
                                        <strong>
                                          {courierQuote.paymentMode === "COD"
                                            ? "COD collection"
                                            : "Shipment value"}
                                          :
                                        </strong>{" "}
                                        ₹{courierQuote.shipmentValue.toFixed(2)}
                                      </span>
                                      <span>
                                        <strong>Route:</strong> {courierQuote.pickupPincode} →{" "}
                                        {courierQuote.deliveryPincode}
                                      </span>
                                      <span>
                                        <strong>Available:</strong> {courierOptions.length} courier
                                        {courierOptions.length === 1 ? "" : "s"}
                                      </span>
                                      <span className="col-span-2 text-on-surface-variant">
                                        Shiprocket account network:{" "}
                                        {courierQuote.accountCourierCount} couriers ·{" "}
                                        {courierQuote.serviceablePincodeCount.toLocaleString(
                                          "en-IN",
                                        )}{" "}
                                        delivery PIN codes. Only couriers eligible for this exact
                                        route, payment mode, weight and dimensions can be selected.
                                      </span>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-2">
                                    <select
                                      value={courierSort}
                                      onChange={(event) =>
                                        setCourierSort(event.target.value as typeof courierSort)
                                      }
                                      className="bg-surface-container-low border border-outline-variant/40 p-2 font-medium"
                                    >
                                      <option value="recommended">Recommended first</option>
                                      <option value="cheapest">Cheapest first</option>
                                      <option value="fastest">Fastest first</option>
                                      <option value="rating">Highest rating</option>
                                    </select>
                                    <select
                                      value={courierMode}
                                      onChange={(event) =>
                                        setCourierMode(event.target.value as typeof courierMode)
                                      }
                                      className="bg-surface-container-low border border-outline-variant/40 p-2 font-medium"
                                    >
                                      <option value="all">Air + Surface</option>
                                      <option value="Air">Air only</option>
                                      <option value="Surface">Surface only</option>
                                    </select>
                                  </div>

                                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                                    {loadingCouriers ? (
                                      <div className="p-4 text-center bg-blue-50 text-blue-800">
                                        Checking live rates, COD and pickup availability…
                                      </div>
                                    ) : visibleCourierOptions.length ? (
                                      visibleCourierOptions.map((courier) => (
                                        <button
                                          type="button"
                                          key={courier.id}
                                          onClick={() => setSelectedCourierId(courier.id)}
                                          className={`w-full text-left rounded border p-3 transition-colors ${selectedCourierId === courier.id ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-outline-variant/40 bg-white hover:border-blue-300"}`}
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div>
                                              <div className="font-bold text-primary flex flex-wrap items-center gap-1">
                                                <span
                                                  className={`inline-block w-3 h-3 rounded-full border ${selectedCourierId === courier.id ? "bg-blue-600 border-blue-600" : "border-outline"}`}
                                                ></span>
                                                {courier.name}
                                                {courier.recommended && (
                                                  <span className="bg-violet-100 text-violet-800 px-1.5 py-0.5 rounded text-[9px]">
                                                    Recommended
                                                  </span>
                                                )}
                                              </div>
                                              <div className="mt-1 flex flex-wrap gap-1 text-[9px]">
                                                <span className="bg-surface-container px-1.5 py-0.5 rounded">
                                                  {courier.mode}
                                                </span>
                                                <span
                                                  className={
                                                    courier.codAvailable
                                                      ? "bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded"
                                                      : "bg-surface-container px-1.5 py-0.5 rounded"
                                                  }
                                                >
                                                  {courier.codAvailable
                                                    ? "COD available"
                                                    : "Prepaid only"}
                                                </span>
                                                {courier.realtimeTracking && (
                                                  <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">
                                                    {courier.realtimeTracking} tracking
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                              <div className="text-base font-bold text-blue-700">
                                                ₹{courier.rate.toFixed(2)}
                                              </div>
                                              <div className="text-[9px] text-on-surface-variant">
                                                total shipping
                                              </div>
                                            </div>
                                          </div>
                                          <div className="mt-3 grid grid-cols-4 gap-2 border-t border-outline-variant/30 pt-2 text-[9px]">
                                            <span>
                                              <strong>Freight</strong>
                                              <br />₹{courier.freightCharge.toFixed(2)}
                                            </span>
                                            <span>
                                              <strong>COD fee</strong>
                                              <br />₹{courier.codCharge.toFixed(2)}
                                            </span>
                                            <span>
                                              <strong>RTO</strong>
                                              <br />₹{courier.rtoCharge.toFixed(2)}
                                            </span>
                                            <span>
                                              <strong>Weight</strong>
                                              <br />
                                              {courier.chargeWeightKg} kg
                                            </span>
                                            <span>
                                              <strong>ETA</strong>
                                              <br />
                                              {courier.etd ||
                                                `${courier.estimatedDays || "?"} days`}
                                            </span>
                                            <span>
                                              <strong>Rating</strong>
                                              <br />
                                              {courier.rating?.toFixed(1) ?? "N/A"}
                                            </span>
                                            <span>
                                              <strong>POD</strong>
                                              <br />
                                              {courier.podAvailable || "N/A"}
                                            </span>
                                            <span>
                                              <strong>Pickup</strong>
                                              <br />
                                              {courier.pickupAvailableToday
                                                ? "Today"
                                                : courier.nextPickupDate || "Next slot"}
                                            </span>
                                          </div>
                                          <div className="mt-2 text-[9px] text-on-surface-variant">
                                            Delivery{" "}
                                            {courier.deliveryPerformance?.toFixed(1) ?? "N/A"}/5 ·
                                            Tracking{" "}
                                            {courier.trackingPerformance?.toFixed(1) ?? "N/A"}/5 ·
                                            Pickup {courier.pickupPerformance?.toFixed(1) ?? "N/A"}
                                            /5
                                            {courier.callBeforeDelivery
                                              ? ` · Call before delivery: ${courier.callBeforeDelivery}`
                                              : ""}
                                          </div>
                                        </button>
                                      ))
                                    ) : (
                                      <div className="p-3 text-center bg-amber-50 text-amber-800">
                                        {courierOptions.length
                                          ? `No ${courierMode} couriers in this live quote. Change the filter.`
                                          : "No courier quote loaded. Refresh rates after checking package details."}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {hasRealAwb(o) ? (
                                  <div className="space-y-2 border-t border-outline-variant/30 pt-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                                      Live AWB Operations
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {(
                                        ["label", "invoice", "manifest", "label-invoice"] as const
                                      ).map((type) => (
                                        <button
                                          type="button"
                                          key={type}
                                          disabled={Boolean(shiprocketAction)}
                                          onClick={() => openShiprocketDocument(o.id, type)}
                                          className="border border-outline-variant/40 bg-white hover:bg-blue-50 py-2 text-[9px] font-bold uppercase tracking-wider disabled:opacity-50"
                                        >
                                          {shiprocketAction === `${o.id}:${type}`
                                            ? "Generating…"
                                            : type.replace("-", " + ")}
                                        </button>
                                      ))}
                                      <button
                                        type="button"
                                        disabled={Boolean(shiprocketAction)}
                                        onClick={() => retryPickup(o.id)}
                                        className="border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 py-2 text-[9px] font-bold uppercase tracking-wider disabled:opacity-50"
                                      >
                                        {shiprocketAction === `${o.id}:pickup`
                                          ? "Requesting…"
                                          : "Schedule / Retry Pickup"}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={Boolean(shiprocketAction)}
                                        onClick={() => cancelShipment(o.id)}
                                        className="border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 py-2 text-[9px] font-bold uppercase tracking-wider disabled:opacity-50"
                                      >
                                        {shiprocketAction === `${o.id}:cancel`
                                          ? "Cancelling…"
                                          : "Cancel Before Pickup"}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    disabled={simulatingId === o.id || !selectedCourierId}
                                    onClick={() => generateAWB(o.id)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-bold text-[11px] uppercase tracking-widest rounded shadow-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                                  >
                                    <span className="material-symbols-outlined text-sm">send</span>
                                    {o.tracking_url
                                      ? "Replace Test AWB with Selected Courier"
                                      : "Generate AWB with Selected Courier"}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Internal Seller Notes */}
                            <div className="bg-white p-6 border border-outline-variant/40 rounded shadow-sm space-y-4">
                              <h4 className="font-bold text-sm text-primary uppercase tracking-tight border-b border-outline-variant/30 pb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-amber-600">
                                  note_alt
                                </span>
                                Seller Operational Notes
                              </h4>
                              <div className="space-y-3 text-xs">
                                <p className="text-[11px] text-on-surface-variant">
                                  Add internal reminders about customer requests, packaging
                                  preferences, or verification calls.
                                </p>
                                <textarea
                                  value={sellerNotes[o.id] || ""}
                                  onChange={(e) =>
                                    setSellerNotes({ ...sellerNotes, [o.id]: e.target.value })
                                  }
                                  rows={4}
                                  className="w-full bg-surface-container-low border border-outline-variant/40 p-3 font-medium focus:outline-none focus:border-primary resize-none"
                                  placeholder="e.g. Customer called to confirm express delivery before Friday..."
                                />
                                <button
                                  onClick={() => saveSellerNote(o.id)}
                                  className="w-full bg-surface-container-high hover:bg-primary hover:text-on-primary text-primary border border-outline-variant/40 py-2.5 font-bold text-[11px] uppercase tracking-widest rounded shadow-sm transition-all flex items-center justify-center gap-1.5"
                                >
                                  <span className="material-symbols-outlined text-sm">save</span>
                                  Save Internal Notes
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
