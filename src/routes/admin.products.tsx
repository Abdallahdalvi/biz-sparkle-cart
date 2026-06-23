import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

interface Row {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  price_paise: number;
  stock: number;
  is_active: boolean;
  category_id: string | null;
}
interface Category { id: string; name: string; slug: string }

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

function AdminProducts() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [showNew, setShowNew] = useState(false);

  async function refresh() {
    const { data, error } = await supabase
      .from("products")
      .select("id, slug, name, tagline, price_paise, stock, is_active, category_id")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
  }

  useEffect(() => {
    refresh();
    supabase.from("categories").select("id, name, slug").then(({ data }) => setCats((data as Category[]) ?? []));
  }, []);

  async function toggle(id: string, is_active: boolean) {
    const { error } = await supabase.from("products").update({ is_active: !is_active }).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Products</h2>
        <button
          onClick={() => setShowNew(true)}
          className="bg-primary text-on-primary px-4 py-2 text-[11px] font-bold uppercase tracking-widest"
        >
          + New Product
        </button>
      </div>

      {showNew && (
        <NewProductForm cats={cats} onDone={() => { setShowNew(false); refresh(); }} onCancel={() => setShowNew(false)} />
      )}

      {!rows ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-on-surface-variant">No products yet. Click <strong>New Product</strong> to add one.</p>
      ) : (
        <div className="bg-white shopify-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low">
              <tr className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant">
                <th className="p-3">Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-outline-variant/40">
                  <td className="p-3 font-bold">{r.name}</td>
                  <td className="p-3 text-on-surface-variant">{r.slug}</td>
                  <td className="p-3">{formatINR(r.price_paise)}</td>
                  <td className="p-3">{r.stock}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggle(r.id, r.is_active)}
                      className={"text-[10px] uppercase tracking-widest font-bold px-2 py-1 " + (r.is_active ? "bg-primary text-on-primary" : "border border-outline text-on-surface-variant")}
                    >
                      {r.is_active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => remove(r.id)} className="text-destructive text-[11px] uppercase tracking-widest font-bold">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewProductForm({ cats, onDone, onCancel }: { cats: Category[]; onDone: () => void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        const priceRupees = Number(fd.get("price"));
        const { error } = await supabase.from("products").insert({
          slug: String(fd.get("slug")),
          name: String(fd.get("name")),
          tagline: String(fd.get("tagline") ?? ""),
          description: String(fd.get("description") ?? ""),
          price_paise: Math.round(priceRupees * 100),
          stock: Number(fd.get("stock") ?? 0),
          category_id: (fd.get("category") as string) || null,
          is_active: true,
        });
        setBusy(false);
        if (error) return toast.error(error.message);
        toast.success("Product created");
        onDone();
      }}
      className="bg-white shopify-border p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <input name="name" required placeholder="Name" className="border border-outline-variant/40 px-3 py-2 text-sm" />
      <input name="slug" required pattern="[a-z0-9-]+" placeholder="slug-with-dashes" className="border border-outline-variant/40 px-3 py-2 text-sm" />
      <input name="tagline" placeholder="Tagline" className="border border-outline-variant/40 px-3 py-2 text-sm md:col-span-2" />
      <textarea name="description" placeholder="Description" rows={3} className="border border-outline-variant/40 px-3 py-2 text-sm md:col-span-2" />
      <input name="price" required type="number" step="0.01" placeholder="Price (₹)" className="border border-outline-variant/40 px-3 py-2 text-sm" />
      <input name="stock" type="number" defaultValue={0} placeholder="Stock" className="border border-outline-variant/40 px-3 py-2 text-sm" />
      <select name="category" className="border border-outline-variant/40 px-3 py-2 text-sm md:col-span-2">
        <option value="">— Category —</option>
        {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div className="md:col-span-2 flex gap-2">
        <button disabled={busy} className="bg-primary text-on-primary px-4 py-2 text-[11px] font-bold uppercase tracking-widest disabled:opacity-50">
          {busy ? "Saving…" : "Save Product"}
        </button>
        <button type="button" onClick={onCancel} className="border border-outline px-4 py-2 text-[11px] font-bold uppercase tracking-widest">
          Cancel
        </button>
      </div>
    </form>
  );
}