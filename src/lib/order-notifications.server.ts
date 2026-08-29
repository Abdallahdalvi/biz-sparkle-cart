import { formatINR } from "@/lib/format";

interface OrderNotificationItem {
  name: string;
  qty: number;
  unit_price_paise: number;
  variant_label?: string | null;
}

interface OrderNotificationRow {
  id: string;
  order_number: string;
  email: string;
  phone?: string | null;
  shipping_address?: Record<string, unknown> | null;
  subtotal_paise: number;
  total_paise: number;
  cod_advance_paise: number;
  advance_paid_paise: number;
  cod_collectable_paise: number;
  notes?: string | null;
  status: string;
  created_at: string;
  order_items?: OrderNotificationItem[] | null;
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function htmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function adminOrderUrl(orderId: string) {
  const origin = (process.env.PUBLIC_SITE_URL || "https://aghanimsphones.in").replace(/\/$/, "");
  return `${origin}/admin/orders?order=${encodeURIComponent(orderId)}`;
}

function buildOrderMessage(order: OrderNotificationRow) {
  const address = order.shipping_address || {};
  const customerName =
    `${textValue(address.first_name)} ${textValue(address.last_name)}`.trim() || "Customer";
  const lines = (order.order_items || []).map(
    (item) =>
      `${item.qty} x ${item.name}${item.variant_label ? ` (${item.variant_label})` : ""} - ${formatINR(
        item.unit_price_paise * item.qty,
      )}`,
  );
  const paymentLine =
    order.notes === "cod"
      ? `COD: ${formatINR(order.advance_paid_paise)} advance paid, ${formatINR(
          order.cod_collectable_paise,
        )} to collect`
      : `Prepaid: ${formatINR(order.total_paise)} paid online`;
  const deliveryLine = [
    textValue(address.line1),
    textValue(address.line2),
    textValue(address.city),
    textValue(address.state),
    textValue(address.pincode),
  ]
    .filter(Boolean)
    .join(", ");

  const text = [
    `New actionable order: ${order.order_number}`,
    `Customer: ${customerName}`,
    `Email: ${order.email}`,
    `Phone: ${order.phone || "N/A"}`,
    `Payment: ${paymentLine}`,
    `Product total: ${formatINR(order.total_paise)}`,
    `Delivery: ${deliveryLine || "No address"}`,
    "",
    "Items:",
    ...(lines.length ? lines : ["No line items found"]),
    "",
    `Admin: ${adminOrderUrl(order.id)}`,
  ].join("\n");

  const itemHtml = lines.length
    ? lines.map((line) => `<li>${htmlEscape(line)}</li>`).join("")
    : "<li>No line items found</li>";
  const html = `
    <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
      <h2>New actionable order: ${htmlEscape(order.order_number)}</h2>
      <p><strong>Customer:</strong> ${htmlEscape(customerName)}</p>
      <p><strong>Email:</strong> ${htmlEscape(order.email)}</p>
      <p><strong>Phone:</strong> ${htmlEscape(order.phone || "N/A")}</p>
      <p><strong>Payment:</strong> ${htmlEscape(paymentLine)}</p>
      <p><strong>Product total:</strong> ${htmlEscape(formatINR(order.total_paise))}</p>
      <p><strong>Delivery:</strong> ${htmlEscape(deliveryLine || "No address")}</p>
      <h3>Items</h3>
      <ul>${itemHtml}</ul>
      <p><a href="${htmlEscape(adminOrderUrl(order.id))}">Open order in admin</a></p>
    </div>
  `;

  return { text, html };
}

async function sendResendEmail(order: OrderNotificationRow, text: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.ADMIN_ORDER_NOTIFICATION_EMAIL?.trim();
  if (!apiKey || !to) return false;

  const from =
    process.env.ORDER_NOTIFICATION_FROM_EMAIL?.trim() || "Aghanims Orders <onboarding@resend.dev>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `New order ${order.order_number} - ${formatINR(order.total_paise)}`,
      html,
      text,
      reply_to: order.email,
      tags: [{ name: "type", value: "new_order" }],
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend notification failed (${response.status}): ${body.slice(0, 240)}`);
  }
  return true;
}

async function sendGenericWebhook(order: OrderNotificationRow, text: string) {
  const url = process.env.ADMIN_ORDER_NOTIFICATION_WEBHOOK_URL?.trim();
  if (!url) return false;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "new_order",
      orderId: order.id,
      orderNumber: order.order_number,
      totalPaise: order.total_paise,
      paymentMode: order.notes === "cod" ? "cod" : "prepaid",
      message: text,
      adminUrl: adminOrderUrl(order.id),
    }),
  });
  if (!response.ok) {
    throw new Error(`Order notification webhook failed (${response.status})`);
  }
  return true;
}

export async function notifyAdminAboutActionableOrder(orderId: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_number, email, phone, shipping_address, subtotal_paise, total_paise, cod_advance_paise, advance_paid_paise, cod_collectable_paise, notes, status, created_at, order_items(name, qty, unit_price_paise, variant_label)",
      )
      .eq("id", orderId)
      .single();
    if (error || !order) throw new Error(error?.message || "Order not found");

    const typedOrder = order as OrderNotificationRow;
    const { text, html } = buildOrderMessage(typedOrder);
    const emailSent = await sendResendEmail(typedOrder, text, html);
    const webhookSent = await sendGenericWebhook(typedOrder, text);
    if (!emailSent && !webhookSent) {
      console.info("[order notification] skipped; no notification env vars configured");
    }
  } catch (error) {
    console.error("[order notification]", error);
  }
}
