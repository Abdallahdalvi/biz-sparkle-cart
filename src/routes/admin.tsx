import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { useServerFn } from "@tanstack/react-start";
import { getIntegrationStatus } from "@/lib/integration-status.functions";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Aghanims Phones and Gadgets" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const TABS: {
  to: "/admin" | "/admin/products" | "/admin/orders" | "/admin/compliance" | "/admin/cms";
  label: string;
  exact?: boolean;
}[] = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/compliance", label: "LLP Compliance" },
  { to: "/admin/cms", label: "🏠 Storefront CMS" },
];

interface DashboardProduct {
  id: string;
  name: string;
  price_paise: number;
  stock: number;
  metadata?: {
    images?: string[];
    cost_price_paise?: number | string;
    gst_rate?: number | string;
    wholesale_gst_rate?: number | string;
    packaging_cost_paise?: number | string;
  } | null;
  categories?: { name?: string | null } | null;
}

interface DashboardOrderItem {
  name: string;
  qty: number;
  unit_price_paise: number;
  product_id: string | null;
}

interface DashboardOrder {
  id: string;
  order_number: string;
  subtotal_paise: number;
  total_paise: number;
  shipping_paise: number | null;
  status: string;
  created_at: string;
  order_items?: DashboardOrderItem[] | null;
}

interface AnalyticsOrder {
  id: string;
  item_name: string;
  price_paise: number;
  qty: number;
  cost_paise: number;
  gst_rate: number;
  wholesale_gst_rate: number;
  shipping_paise: number;
  pkg_paise: number;
  date: string;
  category?: string;
}

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <SiteShell>
        <div className="max-w-3xl mx-auto py-32 text-center text-on-surface-variant">Loading…</div>
      </SiteShell>
    );
  }
  if (!user) return null;
  if (!isAdmin) {
    return (
      <SiteShell>
        <div className="max-w-xl mx-auto py-32 text-center">
          <h1 className="text-3xl font-bold text-primary mb-4">Access denied</h1>
          <p className="text-on-surface-variant mb-6">
            Your account isn't an admin. Run this in your Supabase SQL editor to promote it:
          </p>
          <pre className="bg-white shopify-border p-4 text-left text-xs overflow-auto">
            {`insert into electronic_shop.user_roles (user_id, role)
values ('${user.id}', 'admin');`}
          </pre>
        </div>
      </SiteShell>
    );
  }

  const isIndex = pathname === "/admin";
  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6 md:mb-8">
          Admin Dashboard
        </h1>
        <div className="-mx-margin-mobile mb-8 flex gap-4 overflow-x-auto border-b border-outline-variant/40 px-margin-mobile pb-px whitespace-nowrap md:mx-0 md:gap-6 md:px-0">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={
                  "pb-3 text-[11px] font-bold uppercase tracking-widest " +
                  (active
                    ? "border-b-2 border-primary text-primary"
                    : "text-on-surface-variant hover:text-primary")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        {isIndex ? <AdminOverview /> : <Outlet />}
      </section>
    </SiteShell>
  );
}

function AdminOverview() {
  const [timeRange, setTimeRange] = useState<"weekly" | "monthly" | "yearly" | "custom">("monthly");
  const [customStartDate, setCustomStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [integrationStatus, setIntegrationStatus] = useState<{
    cashfree: { apiKeysConfigured: boolean; environment: "sandbox" | "production" };
    shiprocket: { credentialsConfigured: boolean; pickupLocation: string };
    orderNotifications: { emailConfigured: boolean; webhookConfigured: boolean };
  } | null>(null);
  const getIntegrationStatusFn = useServerFn(getIntegrationStatus);

  const [rawOrders, setRawOrders] = useState<AnalyticsOrder[]>([]);
  const [rawProducts, setRawProducts] = useState<DashboardProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<DashboardProduct[]>([]);

  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [categoryData, setCategoryData] = useState<
    Array<{ category: string; sales: number; units: number }>
  >([]);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, order_number, subtotal_paise, total_paise, shipping_paise, tax_paise, status, created_at, order_items(name, qty, unit_price_paise, product_id)",
          );
        const { data: products } = await supabase
          .from("products")
          .select("*, categories(name)")
          .eq("is_active", true);
        if (ordersError) throw ordersError;

        const loadedProducts = (products ?? []) as unknown as DashboardProduct[];
        const loadedOrders = (orders ?? []) as unknown as DashboardOrder[];
        setRawProducts(loadedProducts);

        const lowStock = loadedProducts.filter((product) => product.stock <= 10);
        setLowStockProducts(lowStock);

        const productById = new Map(loadedProducts.map((product) => [product.id, product]));
        const completedOrders = loadedOrders.filter(
          (order) => !["pending", "cancelled", "refunded"].includes(order.status),
        );
        const realRows = completedOrders.flatMap<AnalyticsOrder>((order) => {
          const items = Array.isArray(order.order_items) ? order.order_items : [];
          if (!items.length) {
            return [
              {
                id: order.order_number,
                item_name: "Legacy order (line items unavailable)",
                price_paise: Number(order.total_paise) || 0,
                qty: 1,
                cost_paise: 0,
                gst_rate: 0,
                wholesale_gst_rate: 0,
                shipping_paise: Number(order.shipping_paise) || 0,
                pkg_paise: 0,
                date: order.created_at?.slice(0, 10) || "",
              },
            ];
          }
          const ratio =
            Number(order.subtotal_paise) > 0
              ? Number(order.total_paise) / Number(order.subtotal_paise)
              : 1;
          return items.map((item) => {
            const product = item.product_id ? productById.get(item.product_id) : undefined;
            const itemLineTotal = Number(item.unit_price_paise) * (Number(item.qty) || 1);
            return {
              id: order.order_number,
              item_name: item.name,
              price_paise: Math.round(Number(item.unit_price_paise) * ratio),
              qty: Number(item.qty) || 1,
              cost_paise: Number(product?.metadata?.cost_price_paise) || 0,
              gst_rate: Number(product?.metadata?.gst_rate) || 0,
              wholesale_gst_rate: Number(product?.metadata?.wholesale_gst_rate) || 0,
              shipping_paise:
                Number(order.subtotal_paise) > 0
                  ? Math.round(
                      (Number(order.shipping_paise) * itemLineTotal) / Number(order.subtotal_paise),
                    )
                  : 0,
              pkg_paise:
                (Number(product?.metadata?.packaging_cost_paise) || 0) * (Number(item.qty) || 1),
              date: order.created_at?.slice(0, 10) || "",
              category: product?.categories?.name || "Uncategorised",
            };
          });
        });
        setRawOrders(realRows);

        const now = new Date();
        const months = Array.from({ length: 6 }, (_, index) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
          return {
            key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
            month: date.toLocaleDateString("en-IN", { month: "short" }),
            revenue: 0,
          };
        });
        for (const order of completedOrders) {
          const key = String(order.created_at).slice(0, 7);
          const month = months.find((entry) => entry.key === key);
          if (month) month.revenue += Number(order.total_paise) / 100;
        }
        setRevenueData(months.map(({ month, revenue }) => ({ month, revenue })));

        const categoryMap = new Map<string, { sales: number; units: number }>();
        for (const row of realRows) {
          const category = row.category || "Uncategorised";
          const current = categoryMap.get(category) || { sales: 0, units: 0 };
          current.sales += (row.price_paise * row.qty) / 100;
          current.units += row.qty;
          categoryMap.set(category, current);
        }
        setCategoryData(
          [...categoryMap.entries()].map(([category, values]) => ({ category, ...values })),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      try {
        setIntegrationStatus(await getIntegrationStatusFn({ data: { token } }));
      } catch {
        setIntegrationStatus(null);
      }
    })();
    // This dashboard loads once after the authenticated admin layout mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date();
  let rangeStart = new Date(today.getFullYear(), today.getMonth(), 1);
  let rangeEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  if (timeRange === "weekly") {
    rangeStart = new Date(today);
    rangeStart.setDate(today.getDate() - 6);
    rangeStart.setHours(0, 0, 0, 0);
  } else if (timeRange === "yearly") {
    rangeStart = new Date(today.getFullYear(), 0, 1);
  } else if (timeRange === "custom") {
    rangeStart = new Date(`${customStartDate}T00:00:00`);
    rangeEnd = new Date(`${customEndDate}T23:59:59`);
  }
  const analyticsOrders = rawOrders.filter((order) => {
    const date = new Date(`${order.date}T12:00:00`);
    return date >= rangeStart && date <= rangeEnd;
  });

  // Calculate aggregate metrics
  let baseGrossRevenue = 0;
  let baseCOGS = 0;
  let baseGST = 0;
  let baseWholesaleGST = 0;
  let baseShipping = 0;
  let basePkg = 0;
  let baseNetProfit = 0;

  analyticsOrders.forEach((o) => {
    const gross = o.price_paise * o.qty;
    const gstVal = Math.round(gross - gross / (1 + o.gst_rate / 100));
    const cogs = o.cost_paise * o.qty;
    const wholesaleGstVal = Math.round(cogs * (o.wholesale_gst_rate / 100));
    const ship = o.shipping_paise;
    const pkg = o.pkg_paise;
    const net = gross - gstVal - cogs - ship - pkg;

    baseGrossRevenue += gross;
    baseCOGS += cogs;
    baseGST += gstVal;
    baseWholesaleGST += wholesaleGstVal;
    baseShipping += ship;
    basePkg += pkg;
    baseNetProfit += net;
  });

  const grossRevenue = Math.round(baseGrossRevenue);
  const cogsTotal = Math.round(baseCOGS);
  const gstTotal = Math.round(baseGST);
  const wholesaleGstTotal = Math.round(baseWholesaleGST);
  const shippingTotal = Math.round(baseShipping);
  const pkgTotal = Math.round(basePkg);
  const netProfitTotal = Math.round(baseNetProfit);
  const profitMarginPercent =
    grossRevenue > 0 ? ((netProfitTotal / grossRevenue) * 100).toFixed(1) : "0.0";

  const fiscalStartYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  const fiscalStart = new Date(fiscalStartYear, 3, 1);
  const fiscalOrders = rawOrders.filter(
    (order) => new Date(`${order.date}T12:00:00`) >= fiscalStart,
  );
  let fyGrossRevenue = 0;
  fiscalOrders.forEach((order) => {
    const gross = order.price_paise * order.qty;
    fyGrossRevenue += gross;
  });
  const fyTransactionCount = new Set(fiscalOrders.map((order) => order.id)).size;

  // Calculate Total Worth of Inventory (Valuation)
  let inventoryValuationPaise = 0;
  let inventoryItemCount = 0;
  if (rawProducts.length > 0) {
    rawProducts.forEach((p) => {
      const cost = p.metadata?.cost_price_paise ? Number(p.metadata.cost_price_paise) : 0;
      inventoryValuationPaise += p.stock * cost;
      inventoryItemCount += p.stock;
    });
  }

  const downloadAnalyticsReport = () => {
    let csv =
      "Order ID,Item Name,Qty,Selling Price (INR),Selling GST Collected (INR),Cost Price Bought For (INR),Wholesale GST Paid (INR),Net GST Payable Govt (INR),Shipping Cost (INR),Packaging Cost (INR),Net Profit (INR),Profit Margin %\n";
    analyticsOrders.forEach((o) => {
      const gross = (o.price_paise * o.qty) / 100;
      const gstVal =
        Math.round(o.price_paise * o.qty - (o.price_paise * o.qty) / (1 + o.gst_rate / 100)) / 100;
      const cogs = (o.cost_paise * o.qty) / 100;
      const wholesaleGstVal = Math.round(o.cost_paise * o.qty * (o.wholesale_gst_rate / 100)) / 100;
      const netGstPayable = Math.max(0, gstVal - wholesaleGstVal);
      const ship = o.shipping_paise / 100;
      const pkg = o.pkg_paise / 100;
      const net = gross - gstVal - cogs - ship - pkg;
      const margin = gross > 0 ? ((net / gross) * 100).toFixed(1) : "0.0";
      csv += `"${o.id}","${o.item_name}",${o.qty},${gross},${gstVal},${cogs},${wholesaleGstVal},${netGstPayable},${ship},${pkg},${net},${margin}%\n`;
    });
    csv += `\nTOTAL INVENTORY VALUATION (Worth of Inventory),,,,₹${(inventoryValuationPaise / 100).toLocaleString("en-IN")}\n`;
    csv += `TOTAL INVENTORY UNITS,,,,${inventoryItemCount} units\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aghanims_financial_analytics_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cashfreeReady = Boolean(integrationStatus?.cashfree.apiKeysConfigured);
  const shiprocketReady = Boolean(integrationStatus?.shiprocket.credentialsConfigured);
  const notificationsReady = Boolean(
    integrationStatus?.orderNotifications.emailConfigured ||
    integrationStatus?.orderNotifications.webhookConfigured,
  );

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Timeframe selector & Report Download */}
      <div className="bg-white shopify-border p-6 md:p-8 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-l-4 border-l-primary">
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            Advanced Financial & Inventory Analytics
          </h2>
          <p className="text-xs text-on-surface-variant">
            Operational estimates based on completed orders and the cost, tax, shipping, and
            packaging values configured for each product. These figures are not tax-filing advice.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex w-full overflow-x-auto bg-surface-container-low p-1 border border-outline-variant/40 rounded sm:w-auto">
            {(["weekly", "monthly", "yearly", "custom"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${timeRange === t ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={downloadAnalyticsReport}
            className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 font-bold text-xs uppercase tracking-widest shadow-sm flex items-center gap-2 transition-all sm:w-auto sm:flex-shrink-0"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Download CSV Report
          </button>
        </div>
      </div>

      {/* Custom Date Inputs if selected */}
      {timeRange === "custom" && (
        <div className="bg-surface-container-lowest shopify-border p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6 animate-fadeIn">
          <div className="w-full sm:w-auto space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
              Start Date
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-white border border-outline-variant/40 p-2 text-sm font-medium focus:border-primary focus:outline-none"
            />
          </div>
          <div className="w-full sm:w-auto space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
              End Date
            </label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-white border border-outline-variant/40 p-2 text-sm font-medium focus:border-primary focus:outline-none"
            />
          </div>
          <div className="w-full sm:w-auto pt-4 sm:pt-0">
            <p className="text-xs text-primary font-bold">
              Showing filtered analytics for custom interval
            </p>
            <p className="text-[11px] text-on-surface-variant">
              Real-time aggregate query executed
            </p>
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
        <div className="bg-white shopify-border p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Gross Selling Rev
          </p>
          <p className="text-xl font-bold text-primary">{formatINR(grossRevenue)}</p>
          <p className="text-[10px] text-on-surface-variant mt-1 font-medium">
            Customer paid total
          </p>
        </div>
        <div className="bg-white shopify-border p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Estimated GST Collected
          </p>
          <p className="text-xl font-bold text-red-600">{formatINR(gstTotal)}</p>
          <p className="text-[10px] text-red-700 mt-1 font-medium">Output tax liability</p>
        </div>
        <div className="bg-white shopify-border p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Original Buy Cost
          </p>
          <p className="text-xl font-bold text-amber-600">{formatINR(cogsTotal)}</p>
          <p className="text-[10px] text-amber-700 mt-1 font-medium">Wholesale COGS</p>
        </div>
        <div className="bg-white shopify-border p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-600"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Wholesale GST (ITC)
          </p>
          <p className="text-xl font-bold text-amber-700">{formatINR(wholesaleGstTotal)}</p>
          <p className="text-[10px] text-amber-800 mt-1 font-medium">Input Tax Credit claim</p>
        </div>
        <div className="bg-white shopify-border p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Shipping & Pkg
          </p>
          <p className="text-xl font-bold text-blue-600">{formatINR(shippingTotal + pkgTotal)}</p>
          <p className="text-[10px] text-blue-700 mt-1 font-medium">Shiprocket & boxes</p>
        </div>
        <div className="bg-white shopify-border p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Net Seller Profit
          </p>
          <p className="text-xl font-bold text-emerald-600">{formatINR(netProfitTotal)}</p>
          <p className="text-[10px] text-emerald-700 mt-1 font-bold">
            {profitMarginPercent}% Net Margin
          </p>
        </div>
        <div className="bg-white shopify-border p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Total Worth Inv
          </p>
          <p className="text-xl font-bold text-purple-700">{formatINR(inventoryValuationPaise)}</p>
          <p className="text-[10px] text-purple-800 mt-1 font-medium">
            {inventoryItemCount} active stock units
          </p>
        </div>
      </div>

      <div className="bg-white shopify-border shadow-sm overflow-hidden p-6 md:p-8 border-l-4 border-l-amber-500">
        <div className="flex flex-col lg:flex-row justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">verified_user</span>
              <h3 className="text-xl font-bold text-primary">Business registration & compliance</h3>
              <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2.5 py-1 rounded">
                TRACKER RESTORED
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              The private LLP tracker separates core MCA filings, conditional tax/GST/TDS reviews,
              and state or workforce checks. It remains independent from CMS products and order
              data.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-on-surface-variant">
              <li>
                Mark whether PAN, TAN, GST and setup documents are obtained; never put full
                identifiers, passwords or OTPs in tracker notes.
              </li>
              <li>
                Set your own due dates after a CA/CS confirms applicability for the LLP and
                financial year.
              </li>
              <li>
                Keep online-payment onboarding deferred until KYC documents are ready; Cash on
                Delivery remains independent.
              </li>
            </ul>
            <Link
              to="/admin/compliance"
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-3 text-xs font-bold uppercase tracking-widest"
            >
              Open Compliance Tracker
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-full lg:min-w-[340px] text-xs">
            <div className="bg-surface-container-lowest border border-outline-variant/40 p-4">
              <p className="text-on-surface-variant">Current FY order revenue</p>
              <p className="font-bold text-primary text-lg mt-1">{formatINR(fyGrossRevenue)}</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/40 p-4">
              <p className="text-on-surface-variant">Current FY orders</p>
              <p className="font-bold text-primary text-lg mt-1">{fyTransactionCount}</p>
            </div>
            <div className="col-span-2 bg-amber-50 border border-amber-200 p-4 text-amber-900">
              Internal estimates only. Do not copy dashboard values directly into statutory filings.
            </div>
          </div>
        </div>
      </div>

      {/* Per-Order / Per-Product Profitability Breakdown Table */}
      <div className="bg-white shopify-border shadow-sm overflow-hidden space-y-4 p-4 md:p-8">
        <div>
          <h3 className="text-xl font-bold text-primary">
            Per-Order Profitability Audit (Real-time Seller Analysis)
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Detailed unit economics showing exactly how much net profit the seller makes per device
            after subtracting GST, original wholesale cost, Wholesale GST Paid (ITC), shipping, and
            packaging.
          </p>
        </div>
        <div className="-mx-4 overflow-x-auto border border-outline-variant/40 md:mx-0">
          <table className="min-w-[980px] w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40 text-[11px] uppercase tracking-wider text-primary font-bold">
                <th className="p-4">Order ID</th>
                <th className="p-4">Device / Product Name</th>
                <th className="p-4 text-right">Selling Price</th>
                <th className="p-4 text-right">GST Collected</th>
                <th className="p-4 text-right">Bought For (Cost)</th>
                <th className="p-4 text-right">Wholesale GST (ITC)</th>
                <th className="p-4 text-right">Net GST Payable</th>
                <th className="p-4 text-right">Shipping</th>
                <th className="p-4 text-right">Packaging</th>
                <th className="p-4 text-right bg-emerald-50 text-emerald-900">Net Profit</th>
                <th className="p-4 text-right bg-emerald-50 text-emerald-900">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-medium">
              {analyticsOrders.map((o, i) => {
                const gross = o.price_paise * o.qty;
                const gstVal = Math.round(gross - gross / (1 + o.gst_rate / 100));
                const cogs = o.cost_paise * o.qty;
                const wholesaleGstVal = Math.round(cogs * (o.wholesale_gst_rate / 100));
                const netGstPayable = Math.max(0, gstVal - wholesaleGstVal);
                const ship = o.shipping_paise;
                const pkg = o.pkg_paise;
                const net = gross - gstVal - cogs - ship - pkg;
                const margin = gross > 0 ? ((net / gross) * 100).toFixed(1) : "0.0";

                return (
                  <tr key={i} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">{o.id}</td>
                    <td className="p-4 font-bold text-primary">
                      {o.item_name}{" "}
                      {o.qty > 1 && (
                        <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded text-primary font-bold">
                          x{o.qty}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-primary">{formatINR(gross)}</td>
                    <td className="p-4 text-right text-red-600">-{formatINR(gstVal)}</td>
                    <td className="p-4 text-right text-amber-700">-{formatINR(cogs)}</td>
                    <td className="p-4 text-right text-emerald-700 font-semibold">
                      +{formatINR(wholesaleGstVal)}
                    </td>
                    <td className="p-4 text-right text-red-700 font-bold">
                      {formatINR(netGstPayable)}
                    </td>
                    <td className="p-4 text-right text-blue-600">-{formatINR(ship)}</td>
                    <td className="p-4 text-right text-blue-600">-{formatINR(pkg)}</td>
                    <td className="p-4 text-right font-bold bg-emerald-50/50 text-emerald-700">
                      {formatINR(net)}
                    </td>
                    <td className="p-4 text-right font-bold bg-emerald-50/50 text-emerald-800">
                      {margin}%
                    </td>
                  </tr>
                );
              })}
              {analyticsOrders.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-on-surface-variant">
                    No completed orders in this date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Interactive Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MRR Revenue Trend Chart */}
        <div className="bg-white shopify-border p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-primary">trending_up</span>
              Monthly Gross Sales Trend
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Real completed-order revenue for the latest six calendar months.
            </p>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18181b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#18181b" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => [formatINR(Number(value) * 100), "Actual Sales"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                    borderRadius: "4px",
                    fontSize: "12px",
                    padding: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#18181b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueColor)"
                  name="revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Performance Bar Chart */}
        <div className="bg-white shopify-border p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-primary">bar_chart</span>
              Actual Sales by Category
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Completed-order sales and units sold, grouped by the products' real categories.
            </p>
          </div>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="category"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === "sales" ? formatINR(Number(value) * 100) : `${value} Units`,
                    name === "sales" ? "Category Sales" : "Units Sold",
                  ]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                    borderRadius: "4px",
                    fontSize: "12px",
                    padding: "8px",
                  }}
                />
                <Bar dataKey="sales" fill="#18181b" radius={[4, 4, 0, 0]} name="sales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      <div className="bg-white shopify-border p-6 shadow-sm space-y-6 border-l-4 border-l-amber-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-amber-500">warning</span>
              Low-Stock & Inventory Health Alerts
            </h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Real-time monitor for products with 10 or fewer units remaining in inventory.
            </p>
          </div>
          <Link
            to="/admin/products"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            Manage Inventory <span className="material-symbols-outlined text-xs">open_in_new</span>
          </Link>
        </div>
        {loading ? (
          <p className="text-xs text-on-surface-variant animate-pulse">
            Checking inventory levels...
          </p>
        ) : lowStockProducts.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-xs rounded font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            All active products are well stocked (over 10 units available).
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="bg-surface-container-lowest border border-outline-variant/40 p-4 rounded flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {p.metadata?.images?.[0] && (
                    <img
                      src={p.metadata.images[0]}
                      alt=""
                      className="w-10 h-10 object-cover shopify-border flex-shrink-0"
                    />
                  )}
                  <div>
                    <p className="font-bold text-sm text-primary">{p.name}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      Price: {formatINR(p.price_paise)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded">
                    {p.stock} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Action Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/products"
          className="bg-white shopify-border p-5 md:p-8 hover:shopify-shadow transition-all group relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] uppercase tracking-widest text-primary font-bold bg-primary/10 px-3 py-1">
                Catalog Management
              </span>
              <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary">Products & Inventory</h2>
            <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">
              Manage your store catalog, add new electronic products, update pricing, set stock
              quantities, and instantly toggle product visibility across the storefront.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-outline-variant/40 flex flex-col gap-2 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
            <span>Active database table: electronic_shop.products</span>
            <span className="font-bold text-primary">Manage Catalog</span>
          </div>
        </Link>

        <Link
          to="/admin/orders"
          className="bg-white shopify-border p-5 md:p-8 hover:shopify-shadow transition-all group relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] uppercase tracking-widest text-primary font-bold bg-blue-500/10 text-blue-700 px-3 py-1">
                Fulfilment & Payments
              </span>
              <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              Orders & Shipment Tracking
            </h2>
            <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">
              View incoming orders, verify payment status, compare live courier services, generate
              Shiprocket AWBs, and manage delivery operations.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-outline-variant/40 flex flex-col gap-2 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
            <span>Active database table: electronic_shop.orders</span>
            <span className="font-bold text-primary">Manage Orders</span>
          </div>
        </Link>

        <Link
          to="/admin/cms"
          className="bg-white shopify-border p-5 md:p-8 hover:shopify-shadow transition-all group relative overflow-hidden flex flex-col justify-between md:col-span-2"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] uppercase tracking-widest text-primary font-bold bg-emerald-500/10 text-emerald-700 px-3 py-1">
                Storefront Customization (WordPress Style)
              </span>
              <span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-primary">
              Storefront CMS & Live Banners
            </h2>
            <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">
              Fully customize your storefront layout, hero titles, custom promotional image banners,
              Keypad collection highlights, and Homepage FAQ sections. Upload images directly from
              your device storage or provide direct URLs.
            </p>
          </div>
          <div className="mt-8 pt-4 border-t border-outline-variant/40 flex flex-col gap-2 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
            <span>Active database table: electronic_shop.store_settings</span>
            <span className="font-bold text-primary">Open Storefront CMS</span>
          </div>
        </Link>
      </div>

      {/* API integration status */}
      <div className="bg-surface-container-low shopify-border p-4 md:p-8 space-y-6">
        <div className="flex flex-col gap-3 border-b border-outline-variant/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-primary">Live API Integrations Health</h3>
            <p className="text-xs text-on-surface-variant mt-1">
              Status of third-party webhooks, payment gateways, and logistics providers.
            </p>
          </div>
          <span
            className={`inline-block ${cashfreeReady && shiprocketReady && notificationsReady ? "bg-emerald-500" : "bg-amber-500"} text-on-primary text-[10px] font-bold uppercase tracking-widest px-3 py-1`}
          >
            {cashfreeReady && shiprocketReady && notificationsReady
              ? "Integrations Ready"
              : "Setup Required"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cashfree Gateway */}
          <div className="bg-white p-6 shopify-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${cashfreeReady ? "bg-emerald-500" : "bg-amber-500"}`}
                ></div>
                <h4 className="font-bold text-sm text-primary uppercase tracking-widest">
                  Cashfree Payments Gateway
                </h4>
              </div>
              <span className="text-[11px] font-mono bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
                {cashfreeReady
                  ? integrationStatus?.cashfree.environment === "production"
                    ? "Production Ready"
                    : "Sandbox Ready"
                  : "Credentials Needed"}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Checkout uses server-created Cashfree orders, hosted checkout, server-side payment
              status confirmation, and signed webhooks. Enable payment and refund events in the
              Cashfree dashboard.
            </p>
            <div className="bg-surface-container-lowest p-3 border border-outline-variant/40 text-[11px] space-y-1 rounded">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">API Keys:</span>
                <span
                  className={`font-mono ${integrationStatus?.cashfree.apiKeysConfigured ? "text-emerald-700" : "text-amber-700"}`}
                >
                  {integrationStatus?.cashfree.apiKeysConfigured ? "Configured" : "Missing"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Environment:</span>
                <span className="font-mono text-primary uppercase">
                  {integrationStatus?.cashfree.environment || "sandbox"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Endpoint:</span>
                <code>/api/public/webhooks/cashfree</code>
              </div>
            </div>
          </div>

          {/* Shiprocket Logistics */}
          <div className="bg-white p-6 shopify-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${shiprocketReady ? "bg-blue-500" : "bg-amber-500"}`}
                ></div>
                <h4 className="font-bold text-sm text-primary uppercase tracking-widest">
                  Shiprocket Logistics API
                </h4>
              </div>
              <span className="text-[11px] font-mono bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
                {shiprocketReady ? "Configured" : "Credentials Needed"}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Live courier availability, rates, ETA, rating, and transport mode are loaded for each
              package. The selected courier is passed explicitly when the AWB is assigned.
            </p>
            <div className="bg-surface-container-lowest p-3 border border-outline-variant/40 text-[11px] space-y-1 rounded">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Pickup Location:</span>
                <span className="font-mono text-blue-700">
                  {integrationStatus?.shiprocket.pickupLocation || "Checking…"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Courier Selection:</span>
                <span>{shiprocketReady ? "Live per order" : "Unavailable"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 shopify-border space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start xl:flex-row xl:items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${notificationsReady ? "bg-emerald-500" : "bg-amber-500"}`}
                ></div>
                <h4 className="font-bold text-sm text-primary uppercase tracking-widest">
                  New Order Alerts
                </h4>
              </div>
              <span className="text-[11px] font-mono bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
                {notificationsReady ? "Enabled" : "Env Needed"}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Sends an admin alert after a full-COD order is reserved or after Cashfree verifies a
              prepaid payment/COD advance. Notification failures are logged without blocking
              checkout.
            </p>
            <div className="bg-surface-container-lowest p-3 border border-outline-variant/40 text-[11px] space-y-1 rounded">
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">Email:</span>
                <span
                  className={`font-mono ${integrationStatus?.orderNotifications.emailConfigured ? "text-emerald-700" : "text-amber-700"}`}
                >
                  {integrationStatus?.orderNotifications.emailConfigured ? "Configured" : "Missing"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">Webhook:</span>
                <span
                  className={`font-mono ${integrationStatus?.orderNotifications.webhookConfigured ? "text-emerald-700" : "text-on-surface-variant"}`}
                >
                  {integrationStatus?.orderNotifications.webhookConfigured ? "Configured" : "Off"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
