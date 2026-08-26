import { useMemo, useState } from "react";
import type {
  BusinessBooks,
  BusinessCustomer,
  BusinessExpense,
  BusinessPhone,
  BusinessSpendEntry,
  BusinessSupplier,
} from "@/lib/business-tracker";

type Section = "dashboard" | "phones" | "expenses" | "spend" | "suppliers" | "customers";

const inputClass =
  "w-full min-w-[110px] bg-white border border-outline-variant/40 px-2.5 py-2 text-xs text-primary focus:outline-none focus:border-primary";

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function nonNegative(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function nullableMoney(value: string) {
  return value === "" ? null : nonNegative(value);
}

function phoneNumbers(phone: BusinessPhone) {
  const totalBuyCost = phone.buyCost + phone.buyCharges;
  const netSale = phone.sellPrice === null ? null : phone.sellPrice - (phone.sellCharges ?? 0);
  const profit = phone.status === "Sold" && netSale !== null ? netSale - totalBuyCost : null;
  return { totalBuyCost, netSale, profit };
}

function csvCell(value: string | number | null) {
  let text = value === null ? "" : String(value);
  if (/^[=+@]/.test(text) || (/^-/.test(text) && Number.isNaN(Number(text)))) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function BusinessBooksManager({
  books,
  onChange,
}: {
  books: BusinessBooks;
  onChange: (books: BusinessBooks) => void;
}) {
  const [section, setSection] = useState<Section>("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const dashboard = useMemo(() => {
    const sold = books.phones.filter((phone) => phone.status === "Sold");
    const inStock = books.phones.filter((phone) => phone.status === "In Stock");
    const reserved = books.phones.filter((phone) => phone.status === "Reserved");
    const totalInvestment = books.phones.reduce(
      (sum, phone) => sum + phoneNumbers(phone).totalBuyCost,
      0,
    );
    const cogs = sold.reduce((sum, phone) => sum + phoneNumbers(phone).totalBuyCost, 0);
    const revenue = sold.reduce((sum, phone) => sum + (phoneNumbers(phone).netSale ?? 0), 0);
    const grossProfit = sold.reduce((sum, phone) => sum + (phoneNumbers(phone).profit ?? 0), 0);
    const expenses = books.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const inventoryValue = inStock.reduce(
      (sum, phone) => sum + phoneNumbers(phone).totalBuyCost,
      0,
    );
    const reservedValue = reserved.reduce(
      (sum, phone) => sum + phoneNumbers(phone).totalBuyCost,
      0,
    );
    const returns = books.expenses.filter(
      (expense) => expense.category.trim().toLowerCase() === "return",
    );
    return {
      totalInvestment,
      cogs,
      revenue,
      grossProfit,
      expenses,
      netProfit: grossProfit - expenses,
      inventoryValue,
      reservedValue,
      businessSpend: books.businessSpend.reduce((sum, spend) => sum + spend.amount, 0),
      customerReceivables: books.customers.reduce(
        (sum, customer) => sum + customer.pendingAmount,
        0,
      ),
      inStock: inStock.length,
      reserved: reserved.length,
      sold: sold.length,
      returned: books.phones.filter((phone) => phone.status === "Returned").length,
      unassigned: books.phones.filter((phone) => phone.status === "Unassigned").length,
      pendingPaymentUnits: books.phones.filter((phone) => phone.paymentStatus === "Pending").length,
      returns: returns.length,
      returnCost: returns.reduce((sum, expense) => sum + expense.amount, 0),
    };
  }, [books]);

  const updatePhone = (id: string, patch: Partial<BusinessPhone>) => {
    onChange({
      ...books,
      phones: books.phones.map((phone) => (phone.id === id ? { ...phone, ...patch } : phone)),
    });
  };

  const addPhone = () => {
    const sequence = books.phones.length + 1;
    const phone: BusinessPhone = {
      id: createId("phone"),
      sku: `NEW-${String(sequence).padStart(3, "0")}`,
      model: "New phone",
      color: "",
      grade: "",
      supplier: "",
      buyCost: 0,
      buyCharges: 0,
      customer: "",
      sellPrice: null,
      sellCharges: null,
      status: "Unassigned",
      marketplace: "",
      paymentStatus: "",
      purchaseDate: "",
      soldDate: "",
    };
    onChange({ ...books, phones: [phone, ...books.phones] });
    setSection("phones");
  };

  const removePhone = (phone: BusinessPhone) => {
    if (!window.confirm(`Remove ${phone.sku} from the private business books?`)) return;
    onChange({ ...books, phones: books.phones.filter((item) => item.id !== phone.id) });
  };

  const filteredPhones = books.phones.filter((phone) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      [phone.sku, phone.model, phone.color, phone.supplier, phone.customer, phone.marketplace]
        .join(" ")
        .toLowerCase()
        .includes(term);
    return matchesSearch && (statusFilter === "All" || phone.status === statusFilter);
  });

  const exportInventory = () => {
    const headers = [
      "SKU",
      "Model",
      "Color",
      "Grade",
      "Supplier",
      "Buy Cost",
      "Buy Charges",
      "Total Buy Cost",
      "Customer",
      "Sell Price",
      "Sell Charges",
      "Net Sale",
      "Profit",
      "Status",
      "Marketplace",
      "Payment Status",
      "Purchase Date",
      "Sold Date",
    ];
    const rows = books.phones.map((phone) => {
      const numbers = phoneNumbers(phone);
      return [
        phone.sku,
        phone.model,
        phone.color,
        phone.grade,
        phone.supplier,
        phone.buyCost,
        phone.buyCharges,
        numbers.totalBuyCost,
        phone.customer,
        phone.sellPrice,
        phone.sellCharges,
        numbers.netSale,
        numbers.profit,
        phone.status,
        phone.marketplace,
        phone.paymentStatus,
        phone.purchaseDate,
        phone.soldDate,
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `aghanims-phone-books-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const sections: Array<[Section, string, string, number | null]> = [
    ["dashboard", "Dashboard", "dashboard", null],
    ["phones", "Phones", "smartphone", books.phones.length],
    ["expenses", "Expenses", "receipt_long", books.expenses.length],
    ["spend", "Business Spend", "account_balance_wallet", books.businessSpend.length],
    ["suppliers", "Suppliers", "local_shipping", books.suppliers.length],
    ["customers", "Customers", "groups", books.customers.length],
  ];

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 p-5 text-xs text-emerald-900 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="font-bold">Your spreadsheet is now the starting data—not the system.</p>
          <p className="mt-1">
            Every section below is editable and saved privately. Calculated totals update instantly;
            storefront CMS inventory remains independent.
          </p>
        </div>
        <div className="text-[10px] uppercase tracking-widest font-bold whitespace-nowrap">
          {books.sourceName ? `Seeded from ${books.sourceName}` : "Web-managed books"}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto bg-surface-container-low p-2 border border-outline-variant/40">
        {sections.map(([id, label, icon, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`flex items-center gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${section === id ? "bg-primary text-on-primary" : "bg-white text-on-surface-variant hover:text-primary"}`}
          >
            <span className="material-symbols-outlined text-base">{icon}</span>
            {label}
            {count !== null && <span className="opacity-70">({count})</span>}
          </button>
        ))}
      </div>

      {section === "dashboard" && <BooksDashboard dashboard={dashboard} books={books} />}
      {section === "phones" && (
        <PhonesTable
          phones={filteredPhones}
          search={search}
          statusFilter={statusFilter}
          setSearch={setSearch}
          setStatusFilter={setStatusFilter}
          addPhone={addPhone}
          updatePhone={updatePhone}
          removePhone={removePhone}
          exportInventory={exportInventory}
        />
      )}
      {section === "expenses" && <ExpensesTable books={books} onChange={onChange} />}
      {section === "spend" && <SpendTable books={books} onChange={onChange} />}
      {section === "suppliers" && <SuppliersTable books={books} onChange={onChange} />}
      {section === "customers" && <CustomersTable books={books} onChange={onChange} />}
    </div>
  );
}

type DashboardValues = ReturnType<typeof getDashboardType>;
function getDashboardType() {
  return {
    totalInvestment: 0,
    cogs: 0,
    revenue: 0,
    grossProfit: 0,
    expenses: 0,
    netProfit: 0,
    inventoryValue: 0,
    reservedValue: 0,
    businessSpend: 0,
    customerReceivables: 0,
    inStock: 0,
    reserved: 0,
    sold: 0,
    returned: 0,
    unassigned: 0,
    pendingPaymentUnits: 0,
    returns: 0,
    returnCost: 0,
  };
}

function BooksDashboard({
  dashboard,
  books,
}: {
  dashboard: DashboardValues;
  books: BusinessBooks;
}) {
  const metrics: Array<[string, number, string, string]> = [
    ["Total investment", dashboard.totalInvestment, "inventory_2", "All phone acquisition costs"],
    ["COGS", dashboard.cogs, "receipt_long", "Cost of sold phones"],
    ["Net sales", dashboard.revenue, "payments", "Sales minus selling charges"],
    ["Gross profit", dashboard.grossProfit, "trending_up", "Sold-phone profit"],
    ["Expenses", dashboard.expenses, "shopping_cart", "Operating expense records"],
    ["Net profit", dashboard.netProfit, "savings", "Gross profit minus expenses"],
    ["In-stock value", dashboard.inventoryValue, "warehouse", "Available inventory at cost"],
    ["Setup spend", dashboard.businessSpend, "domain", "Business-level investment"],
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(([label, value, icon, help]) => (
          <div key={label} className="bg-white shopify-border p-5 shadow-sm">
            <span className="material-symbols-outlined text-primary">{icon}</span>
            <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mt-3">
              {label}
            </p>
            <p
              className={`text-xl font-bold mt-1 ${label === "Net profit" && value < 0 ? "text-red-600" : "text-primary"}`}
            >
              {rupees(value)}
            </p>
            <p className="text-[10px] text-on-surface-variant mt-1">{help}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          ["In stock", dashboard.inStock],
          ["Reserved", dashboard.reserved],
          ["Sold", dashboard.sold],
          ["Returned", dashboard.returned],
          ["Unassigned", dashboard.unassigned],
          ["Payments pending", dashboard.pendingPaymentUnits],
        ].map(([label, value]) => (
          <div
            key={label}
            className="bg-surface-container-low border border-outline-variant/40 p-4"
          >
            <p className="text-[9px] uppercase tracking-widest font-bold text-on-surface-variant">
              {label}
            </p>
            <p className="text-2xl font-bold text-primary mt-1">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryBox label="Reserved stock value" value={rupees(dashboard.reservedValue)} />
        <SummaryBox label="Customer receivables" value={rupees(dashboard.customerReceivables)} />
        <SummaryBox
          label="Return expense"
          value={`${dashboard.returns} · ${rupees(dashboard.returnCost)}`}
        />
      </div>
      <div className="bg-white shopify-border p-6 shadow-sm">
        <h3 className="font-bold text-primary">Books health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
          <HealthItem
            ok={dashboard.unassigned === 0}
            label="Inventory classification"
            detail={
              dashboard.unassigned
                ? `${dashboard.unassigned} phone(s) still unassigned`
                : "Every phone has a stock status"
            }
          />
          <HealthItem
            ok={dashboard.pendingPaymentUnits === 0}
            label="Payment reconciliation"
            detail={
              dashboard.pendingPaymentUnits
                ? `${dashboard.pendingPaymentUnits} phone sale(s) awaiting payment`
                : "No phone payment marked pending"
            }
          />
          <HealthItem
            ok={books.suppliers.length > 0}
            label="Supplier directory"
            detail={`${books.suppliers.length} supplier record(s), ${books.customers.length} customer record(s)`}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white shopify-border p-5 shadow-sm">
      <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
        {label}
      </p>
      <p className="font-bold text-primary text-lg mt-1">{value}</p>
    </div>
  );
}

function HealthItem({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div
      className={`border p-4 ${ok ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}
    >
      <p className="font-bold text-primary flex items-center gap-2">
        <span
          className={`material-symbols-outlined text-base ${ok ? "text-emerald-600" : "text-amber-600"}`}
        >
          {ok ? "check_circle" : "warning"}
        </span>
        {label}
      </p>
      <p className="text-on-surface-variant mt-1">{detail}</p>
    </div>
  );
}

function PhonesTable({
  phones,
  search,
  statusFilter,
  setSearch,
  setStatusFilter,
  addPhone,
  updatePhone,
  removePhone,
  exportInventory,
}: {
  phones: BusinessPhone[];
  search: string;
  statusFilter: string;
  setSearch: (value: string) => void;
  setStatusFilter: (value: string) => void;
  addPhone: () => void;
  updatePhone: (id: string, patch: Partial<BusinessPhone>) => void;
  removePhone: (phone: BusinessPhone) => void;
  exportInventory: () => void;
}) {
  return (
    <div className="bg-white shopify-border shadow-sm overflow-hidden">
      <div className="p-5 md:p-6 border-b border-outline-variant/40 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-primary">Phone inventory & sales ledger</h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Edit the original 18 workbook fields; cost, net sale and profit calculate automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search SKU, model, supplier…"
            className={`${inputClass} sm:w-64`}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={`${inputClass} sm:w-36`}
          >
            {["All", "In Stock", "Reserved", "Sold", "Returned", "Unassigned"].map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportInventory}
            className="border border-primary text-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={addPhone}
            className="bg-primary text-on-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
          >
            + Add phone
          </button>
        </div>
      </div>
      <div className="overflow-auto max-h-[680px]">
        <table className="w-full text-left min-w-[2350px]">
          <thead className="sticky top-0 z-10 bg-surface-container-low">
            <tr>
              {[
                "SKU",
                "Model",
                "Color",
                "Grade",
                "Supplier",
                "Buy Cost",
                "Buy Charges",
                "Total Cost",
                "Customer",
                "Sell Price",
                "Sell Charges",
                "Net Sale",
                "Profit",
                "Status",
                "Marketplace",
                "Payment",
                "Purchase Date",
                "Sold Date",
                "",
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-2.5 py-3 text-[9px] uppercase tracking-widest font-bold text-on-surface-variant border-b border-outline-variant/40"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20">
            {phones.map((phone) => {
              const numbers = phoneNumbers(phone);
              return (
                <tr key={phone.id} className="hover:bg-surface-container-lowest align-top">
                  <td className="p-2">
                    <input
                      value={phone.sku}
                      onChange={(e) => updatePhone(phone.id, { sku: e.target.value })}
                      className={`${inputClass} font-mono font-bold`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={phone.model}
                      onChange={(e) => updatePhone(phone.id, { model: e.target.value })}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={phone.color}
                      onChange={(e) => updatePhone(phone.id, { color: e.target.value })}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={phone.grade}
                      onChange={(e) => updatePhone(phone.id, { grade: e.target.value })}
                      className={inputClass}
                      placeholder="A/B/C"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      value={phone.supplier}
                      onChange={(e) => updatePhone(phone.id, { supplier: e.target.value })}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      value={phone.buyCost}
                      onChange={(e) =>
                        updatePhone(phone.id, { buyCost: nonNegative(e.target.value) })
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      value={phone.buyCharges}
                      onChange={(e) =>
                        updatePhone(phone.id, { buyCharges: nonNegative(e.target.value) })
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="p-3 text-xs font-bold text-primary">
                    {rupees(numbers.totalBuyCost)}
                  </td>
                  <td className="p-2">
                    <input
                      value={phone.customer}
                      onChange={(e) => updatePhone(phone.id, { customer: e.target.value })}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      value={phone.sellPrice ?? ""}
                      onChange={(e) =>
                        updatePhone(phone.id, { sellPrice: nullableMoney(e.target.value) })
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      value={phone.sellCharges ?? ""}
                      onChange={(e) =>
                        updatePhone(phone.id, { sellCharges: nullableMoney(e.target.value) })
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="p-3 text-xs font-bold">
                    {numbers.netSale === null ? "—" : rupees(numbers.netSale)}
                  </td>
                  <td
                    className={`p-3 text-xs font-bold ${numbers.profit !== null && numbers.profit < 0 ? "text-red-600" : "text-emerald-700"}`}
                  >
                    {numbers.profit === null ? "—" : rupees(numbers.profit)}
                  </td>
                  <td className="p-2">
                    <select
                      value={phone.status}
                      onChange={(e) =>
                        updatePhone(phone.id, { status: e.target.value as BusinessPhone["status"] })
                      }
                      className={inputClass}
                    >
                      {["In Stock", "Reserved", "Sold", "Returned", "Unassigned"].map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      value={phone.marketplace}
                      onChange={(e) => updatePhone(phone.id, { marketplace: e.target.value })}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={phone.paymentStatus}
                      onChange={(e) =>
                        updatePhone(phone.id, {
                          paymentStatus: e.target.value as BusinessPhone["paymentStatus"],
                        })
                      }
                      className={inputClass}
                    >
                      {["", "Pending", "Paid", "Refunded"].map((status) => (
                        <option key={status} value={status}>
                          {status || "—"}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="date"
                      value={phone.purchaseDate}
                      onChange={(e) => updatePhone(phone.id, { purchaseDate: e.target.value })}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="date"
                      value={phone.soldDate}
                      onChange={(e) => updatePhone(phone.id, { soldDate: e.target.value })}
                      className={inputClass}
                    />
                  </td>
                  <td className="p-2">
                    <button
                      type="button"
                      onClick={() => removePhone(phone)}
                      className="p-2 text-red-600 hover:bg-red-50"
                      title="Remove phone"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!phones.length && (
          <div className="p-12 text-center text-xs text-on-surface-variant">
            No phones match this view.
          </div>
        )}
      </div>
    </div>
  );
}

function ExpensesTable({
  books,
  onChange,
}: {
  books: BusinessBooks;
  onChange: (books: BusinessBooks) => void;
}) {
  const update = (id: string, patch: Partial<BusinessExpense>) =>
    onChange({
      ...books,
      expenses: books.expenses.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  const add = () =>
    onChange({
      ...books,
      expenses: [
        {
          id: createId("expense"),
          date: new Date().toISOString().slice(0, 10),
          category: "General",
          description: "New expense",
          amount: 0,
        },
        ...books.expenses,
      ],
    });
  const remove = (item: BusinessExpense) => {
    if (window.confirm(`Remove expense “${item.description}”?`))
      onChange({ ...books, expenses: books.expenses.filter((entry) => entry.id !== item.id) });
  };
  return (
    <EditableLedger
      title="Expenses"
      subtitle="Returns, marketplace fees, repairs, shipping adjustments and other operating costs."
      addLabel="Add expense"
      onAdd={add}
      total={books.expenses.reduce((sum, item) => sum + item.amount, 0)}
      headers={["Date", "Category", "Description", "Amount", ""]}
    >
      {books.expenses.map((item) => (
        <tr key={item.id} className="border-b border-outline-variant/20">
          <td className="p-2">
            <input
              type="date"
              value={item.date}
              onChange={(e) => update(item.id, { date: e.target.value })}
              className={inputClass}
            />
          </td>
          <td className="p-2">
            <input
              value={item.category}
              onChange={(e) => update(item.id, { category: e.target.value })}
              className={inputClass}
            />
          </td>
          <td className="p-2">
            <input
              value={item.description}
              onChange={(e) => update(item.id, { description: e.target.value })}
              className={`${inputClass} min-w-[300px]`}
            />
          </td>
          <td className="p-2">
            <input
              type="number"
              min="0"
              value={item.amount}
              onChange={(e) => update(item.id, { amount: nonNegative(e.target.value) })}
              className={inputClass}
            />
          </td>
          <td className="p-2">
            <DeleteButton onClick={() => remove(item)} />
          </td>
        </tr>
      ))}
    </EditableLedger>
  );
}

function SpendTable({
  books,
  onChange,
}: {
  books: BusinessBooks;
  onChange: (books: BusinessBooks) => void;
}) {
  const update = (id: string, patch: Partial<BusinessSpendEntry>) =>
    onChange({
      ...books,
      businessSpend: books.businessSpend.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  const add = () =>
    onChange({
      ...books,
      businessSpend: [
        { id: createId("spend"), description: "New business spend", amount: 0 },
        ...books.businessSpend,
      ],
    });
  const remove = (item: BusinessSpendEntry) => {
    if (window.confirm(`Remove “${item.description}”?`))
      onChange({
        ...books,
        businessSpend: books.businessSpend.filter((entry) => entry.id !== item.id),
      });
  };
  return (
    <EditableLedger
      title="Business spend"
      subtitle="Formation, registration, equipment and brand-level expenditure kept separate from phone P&L."
      addLabel="Add spend"
      onAdd={add}
      total={books.businessSpend.reduce((sum, item) => sum + item.amount, 0)}
      headers={["Description", "Amount", ""]}
    >
      {books.businessSpend.map((item) => (
        <tr key={item.id} className="border-b border-outline-variant/20">
          <td className="p-2">
            <input
              value={item.description}
              onChange={(e) => update(item.id, { description: e.target.value })}
              className={`${inputClass} min-w-[320px]`}
            />
          </td>
          <td className="p-2">
            <input
              type="number"
              min="0"
              value={item.amount}
              onChange={(e) => update(item.id, { amount: nonNegative(e.target.value) })}
              className={inputClass}
            />
          </td>
          <td className="p-2">
            <DeleteButton onClick={() => remove(item)} />
          </td>
        </tr>
      ))}
    </EditableLedger>
  );
}

function SuppliersTable({
  books,
  onChange,
}: {
  books: BusinessBooks;
  onChange: (books: BusinessBooks) => void;
}) {
  const update = (id: string, patch: Partial<BusinessSupplier>) =>
    onChange({
      ...books,
      suppliers: books.suppliers.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  const add = () =>
    onChange({
      ...books,
      suppliers: [
        {
          id: createId("supplier"),
          name: "New supplier",
          phone: "",
          email: "",
          address: "",
          notes: "",
        },
        ...books.suppliers,
      ],
    });
  const remove = (item: BusinessSupplier) => {
    if (window.confirm(`Remove supplier “${item.name}”?`))
      onChange({ ...books, suppliers: books.suppliers.filter((entry) => entry.id !== item.id) });
  };
  return (
    <DirectoryTable
      title="Suppliers"
      subtitle="Contact directory for purchasing and reconciliation."
      addLabel="Add supplier"
      onAdd={add}
      headers={["Supplier", "Phone", "Email", "Address", "Notes", ""]}
    >
      {books.suppliers.map((item) => (
        <tr key={item.id} className="border-b border-outline-variant/20 align-top">
          <td className="p-2">
            <input
              value={item.name}
              onChange={(e) => update(item.id, { name: e.target.value })}
              className={inputClass}
            />
          </td>
          <td className="p-2">
            <input
              value={item.phone}
              onChange={(e) => update(item.id, { phone: e.target.value })}
              className={inputClass}
            />
          </td>
          <td className="p-2">
            <input
              type="email"
              value={item.email}
              onChange={(e) => update(item.id, { email: e.target.value })}
              className={`${inputClass} min-w-[190px]`}
            />
          </td>
          <td className="p-2">
            <textarea
              rows={2}
              value={item.address}
              onChange={(e) => update(item.id, { address: e.target.value })}
              className={`${inputClass} min-w-[240px]`}
            />
          </td>
          <td className="p-2">
            <textarea
              rows={2}
              value={item.notes}
              onChange={(e) => update(item.id, { notes: e.target.value })}
              className={`${inputClass} min-w-[240px]`}
            />
          </td>
          <td className="p-2">
            <DeleteButton onClick={() => remove(item)} />
          </td>
        </tr>
      ))}
    </DirectoryTable>
  );
}

function CustomersTable({
  books,
  onChange,
}: {
  books: BusinessBooks;
  onChange: (books: BusinessBooks) => void;
}) {
  const update = (id: string, patch: Partial<BusinessCustomer>) =>
    onChange({
      ...books,
      customers: books.customers.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  const add = () =>
    onChange({
      ...books,
      customers: [
        {
          id: createId("customer"),
          name: "New customer",
          phone: "",
          city: "",
          pendingAmount: 0,
          notes: "",
        },
        ...books.customers,
      ],
    });
  const remove = (item: BusinessCustomer) => {
    if (window.confirm(`Remove customer “${item.name}”?`))
      onChange({ ...books, customers: books.customers.filter((entry) => entry.id !== item.id) });
  };
  return (
    <DirectoryTable
      title="Customers"
      subtitle="Private customer ledger and pending receivables. This does not change website accounts or orders."
      addLabel="Add customer"
      onAdd={add}
      headers={["Customer", "Phone", "City", "Pending Amount", "Notes", ""]}
    >
      {books.customers.map((item) => (
        <tr key={item.id} className="border-b border-outline-variant/20 align-top">
          <td className="p-2">
            <input
              value={item.name}
              onChange={(e) => update(item.id, { name: e.target.value })}
              className={inputClass}
            />
          </td>
          <td className="p-2">
            <input
              value={item.phone}
              onChange={(e) => update(item.id, { phone: e.target.value })}
              className={inputClass}
            />
          </td>
          <td className="p-2">
            <input
              value={item.city}
              onChange={(e) => update(item.id, { city: e.target.value })}
              className={inputClass}
            />
          </td>
          <td className="p-2">
            <input
              type="number"
              min="0"
              value={item.pendingAmount}
              onChange={(e) => update(item.id, { pendingAmount: nonNegative(e.target.value) })}
              className={inputClass}
            />
          </td>
          <td className="p-2">
            <textarea
              rows={2}
              value={item.notes}
              onChange={(e) => update(item.id, { notes: e.target.value })}
              className={`${inputClass} min-w-[280px]`}
            />
          </td>
          <td className="p-2">
            <DeleteButton onClick={() => remove(item)} />
          </td>
        </tr>
      ))}
    </DirectoryTable>
  );
}

function EditableLedger({
  title,
  subtitle,
  addLabel,
  onAdd,
  total,
  headers,
  children,
}: {
  title: string;
  subtitle: string;
  addLabel: string;
  onAdd: () => void;
  total: number;
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white shopify-border shadow-sm overflow-hidden">
      <TableHeader
        title={title}
        subtitle={subtitle}
        addLabel={addLabel}
        onAdd={onAdd}
        aside={`Total ${rupees(total)}`}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[720px]">
          <TableHead headers={headers} />
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function DirectoryTable({
  title,
  subtitle,
  addLabel,
  onAdd,
  headers,
  children,
}: {
  title: string;
  subtitle: string;
  addLabel: string;
  onAdd: () => void;
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white shopify-border shadow-sm overflow-hidden">
      <TableHeader title={title} subtitle={subtitle} addLabel={addLabel} onAdd={onAdd} />
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <TableHead headers={headers} />
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function TableHeader({
  title,
  subtitle,
  addLabel,
  onAdd,
  aside,
}: {
  title: string;
  subtitle: string;
  addLabel: string;
  onAdd: () => void;
  aside?: string;
}) {
  return (
    <div className="p-5 md:p-6 border-b border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 className="text-xl font-bold text-primary">{title}</h3>
        <p className="text-xs text-on-surface-variant mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {aside && (
          <span className="text-xs font-bold text-primary bg-surface-container-low px-4 py-3">
            {aside}
          </span>
        )}
        <button
          type="button"
          onClick={onAdd}
          className="bg-primary text-on-primary px-4 py-3 text-[10px] font-bold uppercase tracking-widest"
        >
          + {addLabel}
        </button>
      </div>
    </div>
  );
}

function TableHead({ headers }: { headers: string[] }) {
  return (
    <thead className="bg-surface-container-low">
      <tr>
        {headers.map((heading) => (
          <th
            key={heading}
            className="px-3 py-3 text-[9px] uppercase tracking-widest font-bold text-on-surface-variant border-b border-outline-variant/40"
          >
            {heading}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-2 text-red-600 hover:bg-red-50"
      title="Remove"
    >
      <span className="material-symbols-outlined text-base">delete</span>
    </button>
  );
}
