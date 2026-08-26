const SHIPROCKET_API = "https://apiv2.shiprocket.in/v1/external";

let cachedToken: { token: string; expiresAt: number } | null = null;
let cachedCourierNetwork: {
  totalCouriers: number;
  serviceablePincodes: number;
  pickupPincodes: number;
  expiresAt: number;
} | null = null;

type JsonRecord = Record<string, unknown>;

export interface ShipmentPackage {
  weightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  pickupLocation?: string;
  courierId?: number;
}

export interface ShiprocketCourierOption {
  id: number;
  name: string;
  rate: number;
  freightCharge: number;
  codCharge: number;
  etd: string;
  estimatedDays: string;
  rating: number | null;
  mode: string;
  recommended: boolean;
  codAvailable: boolean;
  chargeWeightKg: number;
  minWeightKg: number;
  rtoCharge: number;
  coverageCharge: number;
  otherCharges: number;
  etdHours: number | null;
  pickupAvailableToday: boolean;
  nextPickupDate: string;
  cutoffTime: string;
  realtimeTracking: string;
  podAvailable: string;
  callBeforeDelivery: string;
  pickupPerformance: number | null;
  deliveryPerformance: number | null;
  trackingPerformance: number | null;
  rtoPerformance: number | null;
}

export interface ShiprocketCourierQuotes {
  paymentMode: "COD" | "Prepaid";
  pickupPincode: string;
  deliveryPincode: string;
  shipmentValue: number;
  accountCourierCount: number;
  serviceablePincodeCount: number;
  pickupPincodeCount: number;
  options: ShiprocketCourierOption[];
}

export interface PublicTrackingMilestone {
  time: string;
  title: string;
  location: string;
  status: "completed" | "active" | "pending";
  description: string;
}

export interface PublicTrackingResult {
  orderId: string;
  orderNumber: string;
  awb: string | null;
  carrier: string;
  estimatedDelivery: string;
  statusText: string;
  paymentMode: string;
  trackingUrl: string | null;
  shipmentCreated: boolean;
  milestones: PublicTrackingMilestone[];
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" ? (value as JsonRecord) : {};
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function extractMessage(body: unknown, fallback: string): string {
  const record = asRecord(body);
  const response = asRecord(record.response);
  const responseData = asRecord(response.data);
  return (
    asString(record.message) ||
    asString(record.error) ||
    asString(response.message) ||
    asString(responseData.message) ||
    fallback
  );
}

async function getShiprocketToken(): Promise<string> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error("Shiprocket is not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const response = await fetch(`${SHIPROCKET_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = (await response.json().catch(() => ({}))) as JsonRecord;
  const token = asString(body.token);
  if (!response.ok || !token) {
    throw new Error(extractMessage(body, `Shiprocket authentication failed (${response.status})`));
  }

  cachedToken = { token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 };
  return token;
}

async function shiprocketRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getShiprocketToken();
  const response = await fetch(`${SHIPROCKET_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await response.json().catch(() => ({}))) as T;
  if (!response.ok) {
    throw new Error(extractMessage(body, `Shiprocket request failed (${response.status})`));
  }
  return body;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function trackingUrlFor(awb: string): string {
  return `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;
}

function awbFromTrackingUrl(url: string | null | undefined): string {
  if (!url) return "";
  const tail = url.split("/").filter(Boolean).pop() ?? "";
  return decodeURIComponent(tail);
}

async function getOrderWithItems(orderId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, order_number, email, phone, shipping_address, subtotal_paise, total_paise, razorpay_order_id, razorpay_payment_id, shiprocket_order_id, shiprocket_shipment_id, tracking_url, status, created_at, notes",
    )
    .eq("id", orderId)
    .single();
  if (error || !order) throw new Error(error?.message ?? "Order not found");

  const { data: items, error: itemsError } = await supabaseAdmin
    .from("order_items")
    .select("name, qty, unit_price_paise, variant_label")
    .eq("order_id", order.id);
  if (itemsError) throw new Error(itemsError.message);
  if (!items?.length) throw new Error("This order has no line items and cannot be shipped");

  return { order, items, supabaseAdmin };
}

async function getShiprocketOrderValuePaise(order: {
  total_paise: number;
  notes: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
}) {
  let valuePaise = Number(order.total_paise);
  if (order.notes === "cod" && order.razorpay_payment_id) {
    const { getCapturedRazorpayPaymentInternal } = await import("@/lib/razorpay.server");
    const payment = await getCapturedRazorpayPaymentInternal(
      order.razorpay_payment_id,
      asString(order.razorpay_order_id),
    );
    valuePaise = Math.max(0, valuePaise - payment.amountPaise);
  }
  return valuePaise;
}

async function recoverShipmentId(shiprocketOrderId: string): Promise<string> {
  const details = asRecord(
    await shiprocketRequest<unknown>(`/orders/show/${encodeURIComponent(shiprocketOrderId)}`),
  );
  const data = asRecord(details.data);
  const shipments = Array.isArray(data.shipments)
    ? data.shipments
    : Array.isArray(details.shipments)
      ? details.shipments
      : [];
  const shipment = asRecord(shipments[0]);
  return asString(shipment.id || shipment.shipment_id);
}

export async function createShiprocketOrderInternal(
  orderId: string,
  packageDetails: ShipmentPackage = {
    weightKg: 0.5,
    lengthCm: 20,
    breadthCm: 15,
    heightCm: 10,
  },
) {
  const { order, items, supabaseAdmin } = await getOrderWithItems(orderId);

  if (order.shiprocket_shipment_id) {
    return {
      orderId: asString(order.shiprocket_order_id),
      shipmentId: asString(order.shiprocket_shipment_id),
      alreadyExists: true,
    };
  }

  if (order.shiprocket_order_id) {
    const recoveredShipmentId = await recoverShipmentId(asString(order.shiprocket_order_id));
    if (recoveredShipmentId) {
      await supabaseAdmin
        .from("orders")
        .update({ shiprocket_shipment_id: recoveredShipmentId })
        .eq("id", order.id);
      return {
        orderId: asString(order.shiprocket_order_id),
        shipmentId: recoveredShipmentId,
        alreadyExists: true,
      };
    }
  }

  const address = asRecord(order.shipping_address);
  let shiprocketOrderValuePaise: number;
  try {
    shiprocketOrderValuePaise = await getShiprocketOrderValuePaise(order);
  } catch (error) {
    throw new Error(
      `Could not calculate the remaining COD amount: ${error instanceof Error ? error.message : "Razorpay verification failed"}`,
    );
  }
  const payload = {
    order_id: order.order_number,
    order_date: new Date(order.created_at).toISOString().replace("T", " ").slice(0, 16),
    pickup_location:
      packageDetails.pickupLocation || process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
    billing_customer_name: asString(address.first_name) || "Customer",
    billing_last_name: asString(address.last_name),
    billing_address: asString(address.line1),
    billing_address_2: asString(address.line2),
    billing_city: asString(address.city),
    billing_pincode: asString(address.pincode),
    billing_state: asString(address.state),
    billing_country:
      asString(address.country) === "IN" ? "India" : asString(address.country) || "India",
    billing_email: order.email,
    billing_phone: normalizePhone(order.phone),
    shipping_is_billing: true,
    order_items: items.map((item, index) => ({
      name: `${item.name}${item.variant_label ? ` (${item.variant_label})` : ""}`,
      sku: `${order.order_number}-${index + 1}`.slice(0, 40),
      units: item.qty,
      selling_price: (item.unit_price_paise / 100).toFixed(2),
    })),
    payment_method: order.notes === "cod" ? "COD" : "Prepaid",
    sub_total: (shiprocketOrderValuePaise / 100).toFixed(2),
    length: packageDetails.lengthCm,
    breadth: packageDetails.breadthCm,
    height: packageDetails.heightCm,
    weight: packageDetails.weightKg,
  };

  const created = asRecord(
    await shiprocketRequest<unknown>("/orders/create/adhoc", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
  const shiprocketOrderId = asString(created.order_id);
  const shipmentId = asString(created.shipment_id);
  if (!shiprocketOrderId || !shipmentId) {
    throw new Error(extractMessage(created, "Shiprocket did not return an order and shipment ID"));
  }

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      shiprocket_order_id: shiprocketOrderId,
      shiprocket_shipment_id: shipmentId,
      status: "processing",
    })
    .eq("id", order.id);
  if (updateError) throw new Error(updateError.message);

  return { orderId: shiprocketOrderId, shipmentId, alreadyExists: false };
}

async function getShipmentDetails(shipmentId: string): Promise<JsonRecord> {
  return asRecord(await shiprocketRequest<unknown>(`/shipments/${encodeURIComponent(shipmentId)}`));
}

function shipmentAwb(details: JsonRecord): string {
  const data = asRecord(details.data);
  return (
    asString(details.awb) ||
    asString(details.awb_code) ||
    asString(data.awb) ||
    asString(data.awb_code)
  );
}

function shipmentCourier(details: JsonRecord): string {
  const data = asRecord(details.data);
  return (
    asString(details.courier_name) ||
    asString(data.courier_name) ||
    asString(data.courier) ||
    "Shiprocket courier"
  );
}

export async function generateShiprocketAwbInternal(
  orderId: string,
  packageDetails: ShipmentPackage,
) {
  const { order, supabaseAdmin } = await getOrderWithItems(orderId);
  if (["pending", "cancelled", "refunded"].includes(order.status)) {
    throw new Error(`Order must be paid before shipping (current status: ${order.status})`);
  }

  const created = await createShiprocketOrderInternal(orderId, packageDetails);
  let shipmentDetails = await getShipmentDetails(created.shipmentId).catch(() => ({}));
  let awb = shipmentAwb(shipmentDetails);
  let courier = shipmentCourier(shipmentDetails);

  if (!awb) {
    const assignmentPayload: { shipment_id: number; courier_id?: number } = {
      shipment_id: Number(created.shipmentId),
    };
    if (packageDetails.courierId) {
      assignmentPayload.courier_id = packageDetails.courierId;
    }
    const assigned = asRecord(
      await shiprocketRequest<unknown>("/courier/assign/awb", {
        method: "POST",
        body: JSON.stringify(assignmentPayload),
      }),
    );
    const response = asRecord(assigned.response);
    const data = asRecord(response.data);
    awb = asString(data.awb_code || assigned.awb_code);
    courier =
      asString(data.courier_name || data.courier_company_name || assigned.courier_name) || courier;
    if (!awb) {
      throw new Error(extractMessage(assigned, "Shiprocket could not assign an AWB"));
    }
    shipmentDetails = await getShipmentDetails(created.shipmentId).catch(() => shipmentDetails);
    courier = shipmentCourier(shipmentDetails) || courier;
  }

  let pickupScheduled = false;
  let pickupMessage = "";
  try {
    const pickup = asRecord(
      await shiprocketRequest<unknown>("/courier/generate/pickup", {
        method: "POST",
        body: JSON.stringify({ shipment_id: [Number(created.shipmentId)] }),
      }),
    );
    pickupScheduled = Number(pickup.pickup_status ?? 1) === 1;
    pickupMessage = extractMessage(pickup, pickupScheduled ? "Pickup scheduled" : "Pickup pending");
  } catch (error) {
    pickupMessage = error instanceof Error ? error.message : "Pickup request failed";
  }

  let labelUrl: string | null = null;
  try {
    const label = asRecord(
      await shiprocketRequest<unknown>("/courier/generate/label", {
        method: "POST",
        body: JSON.stringify({ shipment_id: [Number(created.shipmentId)] }),
      }),
    );
    labelUrl = asString(label.label_url) || null;
  } catch {
    // A label can be generated later; AWB assignment remains successful.
  }

  const trackingUrl = trackingUrlFor(awb);
  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({ tracking_url: trackingUrl, status: "shipped" })
    .eq("id", order.id);
  if (updateError) throw new Error(updateError.message);

  return {
    awb,
    courier,
    trackingUrl,
    shiprocketOrderId: created.orderId,
    shipmentId: created.shipmentId,
    pickupScheduled,
    pickupMessage,
    labelUrl,
  };
}

function findDocumentUrl(value: unknown): string {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findDocumentUrl(item);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    const preferredKeys = ["label_url", "invoice_url", "manifest_url", "combined_url", "url"];
    for (const key of preferredKeys) {
      const found = findDocumentUrl(record[key]);
      if (found) return found;
    }
    for (const nested of Object.values(record)) {
      const found = findDocumentUrl(nested);
      if (found) return found;
    }
  }
  return "";
}

export async function generateShiprocketDocumentInternal(
  orderId: string,
  type: "label" | "invoice" | "manifest" | "label-invoice",
) {
  const { order } = await getOrderWithItems(orderId);
  const shipmentId = Number(order.shiprocket_shipment_id);
  const shiprocketOrderId = Number(order.shiprocket_order_id);
  if (!Number.isInteger(shipmentId) || shipmentId <= 0) {
    throw new Error("Create the Shiprocket shipment before generating documents");
  }

  let response: unknown;
  if (type === "label") {
    response = await shiprocketRequest<unknown>("/courier/generate/label", {
      method: "POST",
      body: JSON.stringify({ shipment_id: [shipmentId] }),
    });
  } else if (type === "invoice") {
    if (!Number.isInteger(shiprocketOrderId) || shiprocketOrderId <= 0) {
      throw new Error("Shiprocket order ID is missing");
    }
    response = await shiprocketRequest<unknown>("/orders/print/invoice", {
      method: "POST",
      body: JSON.stringify({ ids: [shiprocketOrderId] }),
    });
  } else if (type === "label-invoice") {
    response = await shiprocketRequest<unknown>("/courier/generate/label-invoice", {
      method: "POST",
      body: JSON.stringify({ shipment_ids: [shipmentId] }),
    });
  } else {
    if (!Number.isInteger(shiprocketOrderId) || shiprocketOrderId <= 0) {
      throw new Error("Shiprocket order ID is missing");
    }
    const generated = await shiprocketRequest<unknown>("/manifests/generate", {
      method: "POST",
      body: JSON.stringify({ shipment_id: [shipmentId] }),
    });
    const generatedUrl = findDocumentUrl(generated);
    response = generatedUrl
      ? generated
      : await shiprocketRequest<unknown>("/manifests/print", {
          method: "POST",
          body: JSON.stringify({ order_ids: [shiprocketOrderId] }),
        });
  }

  const url = findDocumentUrl(response);
  if (!url) throw new Error(extractMessage(response, `Shiprocket did not return a ${type} URL`));
  return { type, url };
}

export async function requestShiprocketPickupInternal(orderId: string) {
  const { order } = await getOrderWithItems(orderId);
  const shipmentId = Number(order.shiprocket_shipment_id);
  if (!Number.isInteger(shipmentId) || shipmentId <= 0) {
    throw new Error("Create the Shiprocket shipment before requesting pickup");
  }
  const pickup = asRecord(
    await shiprocketRequest<unknown>("/courier/generate/pickup", {
      method: "POST",
      body: JSON.stringify({ shipment_id: [shipmentId] }),
    }),
  );
  return {
    scheduled: Number(pickup.pickup_status ?? 1) === 1,
    message: extractMessage(pickup, "Pickup request sent to Shiprocket"),
  };
}

export async function cancelShiprocketShipmentInternal(orderId: string) {
  const { order, supabaseAdmin } = await getOrderWithItems(orderId);
  let awb = awbFromTrackingUrl(order.tracking_url);
  if (!awb && order.shiprocket_shipment_id) {
    awb = shipmentAwb(await getShipmentDetails(asString(order.shiprocket_shipment_id)));
  }
  if (!awb || /^SRK-ES-/i.test(awb)) throw new Error("No real AWB is available to cancel");

  const response = await shiprocketRequest<unknown>("/orders/cancel/shipment/awbs", {
    method: "POST",
    body: JSON.stringify({ awbs: [awb] }),
  });
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", order.id);
  if (error) throw new Error(error.message);
  return { cancelled: true, awb, message: extractMessage(response, "Cancellation requested") };
}

export async function getShiprocketPickupLocationsInternal() {
  const response = asRecord(await shiprocketRequest<unknown>("/settings/company/pickup"));
  const data = asRecord(response.data);
  const rows = Array.isArray(data.shipping_address) ? data.shipping_address : [];
  return rows.map((row) => {
    const location = asRecord(row);
    return {
      name: asString(location.pickup_location),
      city: asString(location.city),
      state: asString(location.state),
      pincode: asString(location.pin_code || location.pincode),
      active: Number(location.status ?? 1) > 0,
    };
  });
}

async function getShiprocketCourierNetworkStatsInternal() {
  if (cachedCourierNetwork && cachedCourierNetwork.expiresAt > Date.now()) {
    return cachedCourierNetwork;
  }
  const response = asRecord(
    await shiprocketRequest<unknown>("/courier/courierListWithCounts?type=active"),
  );
  cachedCourierNetwork = {
    totalCouriers: Number(response.total_courier_count) || 0,
    serviceablePincodes: Number(response.serviceable_pincodes_count) || 0,
    pickupPincodes: Number(response.pickup_pincodes_count) || 0,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  return cachedCourierNetwork;
}

export async function getShiprocketCourierOptionsInternal(
  orderId: string,
  packageDetails: ShipmentPackage,
): Promise<ShiprocketCourierQuotes> {
  const { order } = await getOrderWithItems(orderId);
  const address = asRecord(order.shipping_address);
  const deliveryPincode = asString(address.pincode).trim();
  if (!/^\d{6}$/.test(deliveryPincode)) {
    throw new Error("The customer delivery address needs a valid 6-digit PIN code");
  }

  const pickupLocations = await getShiprocketPickupLocationsInternal();
  const network = await getShiprocketCourierNetworkStatsInternal();
  const requestedPickup =
    packageDetails.pickupLocation || process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";
  const pickup = pickupLocations.find(
    (location) => location.active && location.name.toLowerCase() === requestedPickup.toLowerCase(),
  );
  if (!pickup || !/^\d{6}$/.test(pickup.pincode)) {
    throw new Error(`Shiprocket pickup location "${requestedPickup}" has no valid PIN code`);
  }

  const shipmentValuePaise = await getShiprocketOrderValuePaise(order);
  const response = asRecord(
    await checkShiprocketServiceabilityInternal({
      pickupPincode: pickup.pincode,
      deliveryPincode,
      weightKg: packageDetails.weightKg,
      cod: order.notes === "cod",
      lengthCm: packageDetails.lengthCm,
      breadthCm: packageDetails.breadthCm,
      heightCm: packageDetails.heightCm,
      declaredValue: shipmentValuePaise / 100,
    }),
  );
  const data = asRecord(response.data);
  const rows = Array.isArray(data.available_courier_companies)
    ? data.available_courier_companies
    : [];

  const options = rows
    .map((value): ShiprocketCourierOption | null => {
      const row = asRecord(value);
      const id = Number(row.courier_company_id);
      const name = asString(row.courier_name);
      if (!Number.isInteger(id) || id <= 0 || !name) return null;
      const ratingValue = Number(row.rating);
      const rawMode = asString(row.mode);
      const performance = (value: unknown) => {
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? number : null;
      };
      return {
        id,
        name,
        rate: Number(row.rate) || 0,
        freightCharge: Number(row.freight_charge) || 0,
        codCharge: Number(row.cod_charges) || 0,
        etd: asString(row.etd),
        estimatedDays: asString(row.estimated_delivery_days),
        rating: Number.isFinite(ratingValue) && ratingValue > 0 ? ratingValue : null,
        mode:
          rawMode && rawMode !== "0" && rawMode !== "1"
            ? rawMode
            : Number(row.is_surface) === 1 || rawMode === "0"
              ? "Surface"
              : "Air",
        recommended:
          Number(row.recommended_by_shiprocket) === 1 || Number(row.recommended_lt) === 1,
        codAvailable: Number(row.cod) === 1,
        chargeWeightKg: Number(row.charge_weight) || packageDetails.weightKg,
        minWeightKg: Number(row.min_weight) || 0,
        rtoCharge: Number(row.rto_charges) || 0,
        coverageCharge: Number(row.coverage_charges) || 0,
        otherCharges: Number(row.other_charges) || 0,
        etdHours: Number.isFinite(Number(row.etd_hours)) ? Number(row.etd_hours) : null,
        pickupAvailableToday: asString(row.pickup_availability) === "1",
        nextPickupDate: asString(row.suppress_date),
        cutoffTime: asString(row.cutoff_time),
        realtimeTracking: asString(row.realtime_tracking),
        podAvailable: asString(row.pod_available),
        callBeforeDelivery: asString(row.call_before_delivery),
        pickupPerformance: performance(row.pickup_performance),
        deliveryPerformance: performance(row.delivery_performance),
        trackingPerformance: performance(row.tracking_performance),
        rtoPerformance: performance(row.rto_performance),
      };
    })
    .filter((option): option is ShiprocketCourierOption => option !== null)
    .sort((a, b) => Number(b.recommended) - Number(a.recommended) || a.rate - b.rate);

  return {
    paymentMode: order.notes === "cod" ? "COD" : "Prepaid",
    pickupPincode: pickup.pincode,
    deliveryPincode,
    shipmentValue: shipmentValuePaise / 100,
    accountCourierCount: network.totalCouriers,
    serviceablePincodeCount: network.serviceablePincodes,
    pickupPincodeCount: network.pickupPincodes,
    options,
  };
}

function parseTrackingActivities(trackingData: JsonRecord): PublicTrackingMilestone[] {
  const activities = Array.isArray(trackingData.shipment_track_activities)
    ? trackingData.shipment_track_activities
    : [];
  return activities.map((activity, index) => {
    const row = asRecord(activity);
    return {
      time: asString(row.date) || "Update pending",
      title: asString(row["sr-status-label"] || row.status || row.activity) || "Shipment update",
      location: asString(row.location) || "Courier network",
      status: index === 0 ? ("active" as const) : ("completed" as const),
      description: asString(row.activity) || asString(row.status) || "Shipment status updated",
    };
  });
}

export async function getPublicTrackingInternal(identifier: string): Promise<PublicTrackingResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const select = "id, order_number, status, notes, shiprocket_shipment_id, tracking_url";
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    identifier,
  );

  let order = null;
  if (isUuid) {
    const result = await supabaseAdmin
      .from("orders")
      .select(select)
      .eq("id", identifier)
      .maybeSingle();
    order = result.data;
  } else {
    const byNumber = await supabaseAdmin
      .from("orders")
      .select(select)
      .eq("order_number", identifier)
      .maybeSingle();
    order = byNumber.data;
    if (!order) {
      const byAwb = await supabaseAdmin
        .from("orders")
        .select(select)
        .ilike("tracking_url", `%/${identifier}`)
        .maybeSingle();
      order = byAwb.data;
    }
  }

  if (!order) throw new Error("No order or AWB was found with that reference");

  const storedAwb = awbFromTrackingUrl(order.tracking_url);
  const fallbackAwb = /^SRK-ES-/i.test(storedAwb) ? "" : storedAwb;
  const base: PublicTrackingResult = {
    orderId: order.id,
    orderNumber: order.order_number,
    awb: fallbackAwb || null,
    carrier: "Awaiting courier assignment",
    estimatedDelivery: "Available after the courier's first scan",
    statusText: order.status,
    paymentMode: order.notes === "cod" ? "CASH ON DELIVERY (COD)" : "PREPAID",
    trackingUrl: order.tracking_url,
    shipmentCreated: Boolean(order.shiprocket_shipment_id),
    milestones: [],
  };

  if (!order.shiprocket_shipment_id) return base;

  const response = asRecord(
    await shiprocketRequest<unknown>(
      `/courier/track/shipment/${encodeURIComponent(order.shiprocket_shipment_id)}`,
    ),
  );
  const trackingData = asRecord(response.tracking_data);
  const tracks = Array.isArray(trackingData.shipment_track) ? trackingData.shipment_track : [];
  const current = asRecord(tracks[0]);
  const awb = asString(current.awb_code) || fallbackAwb;

  return {
    ...base,
    awb: awb || null,
    carrier: asString(current.courier_name) || base.carrier,
    estimatedDelivery: asString(trackingData.etd || current.etd) || base.estimatedDelivery,
    statusText: asString(current.current_status) || base.statusText,
    trackingUrl: asString(trackingData.track_url) || base.trackingUrl,
    milestones: parseTrackingActivities(trackingData),
  };
}

export async function checkShiprocketServiceabilityInternal(input: {
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  cod: boolean;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  declaredValue?: number;
}) {
  const params = new URLSearchParams({
    pickup_postcode: input.pickupPincode,
    delivery_postcode: input.deliveryPincode,
    weight: String(input.weightKg),
    cod: input.cod ? "1" : "0",
  });
  if (input.lengthCm) params.set("length", String(input.lengthCm));
  if (input.breadthCm) params.set("breadth", String(input.breadthCm));
  if (input.heightCm) params.set("height", String(input.heightCm));
  if (input.declaredValue) params.set("declared_value", String(input.declaredValue));
  return shiprocketRequest<unknown>(`/courier/serviceability/?${params.toString()}`);
}
