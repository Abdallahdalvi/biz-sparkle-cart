import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import { PRODUCTS } from "@/lib/products";

interface Row {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description?: string | null;
  price_paise: number;
  compare_at_paise: number | null;
  stock: number;
  is_active: boolean;
  category_id: string | null;
  metadata: any;
}
interface Category {
  id: string;
  name: string;
  slug: string;
}

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

function AdminProducts() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Row | null>(null);

  async function refresh() {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, slug, name, tagline, description, price_paise, compare_at_paise, stock, is_active, category_id, metadata",
      )
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    const dbRows = (data as Row[]) ?? [];
    const dbSlugs = new Set(dbRows.map((r) => r.slug));
    const staticRows: Row[] = PRODUCTS.filter((p) => !dbSlugs.has(p.slug)).map((p) => ({
      id: `static-${p.slug}`,
      slug: p.slug,
      name: p.name,
      tagline: p.tagline || null,
      description: p.description || null,
      price_paise: p.pricePaise,
      compare_at_paise: p.compareAtPaise || null,
      stock: p.stock,
      is_active: true,
      category_id: null,
      metadata: {
        badge: p.badge || "",
        cost_price_paise: Math.round(p.pricePaise * 0.7),
        gst_rate: 18,
        wholesale_gst_rate: 18,
        shipping_cost_paise: 15000,
        packaging_cost_paise: 5000,
        specs: p.specs,
        variants: p.variants || [],
        images: p.images,
        faqs: p.faqs || [],
      },
    }));
    setRows([...dbRows, ...staticRows]);
  }

  useEffect(() => {
    refresh();
    supabase
      .from("categories")
      .select("id, name, slug")
      .then(({ data }) => setCats((data as Category[]) ?? []));
  }, []);

  async function toggle(r: Row) {
    if (r.id.startsWith("static-")) {
      const { error } = await supabase.from("products").insert({
        slug: r.slug,
        name: r.name,
        tagline: r.tagline || "",
        description: r.description || "",
        price_paise: r.price_paise,
        compare_at_paise: r.compare_at_paise,
        stock: r.stock,
        is_active: false,
        metadata: r.metadata,
      });
      if (error) return toast.error(error.message);
      refresh();
      return;
    }
    const { error } = await supabase
      .from("products")
      .update({ is_active: !r.is_active })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function remove(r: Row) {
    if (!confirm("Delete this product?")) return;
    if (r.id.startsWith("static-")) {
      const { error } = await supabase.from("products").insert({
        slug: r.slug,
        name: r.name,
        tagline: r.tagline || "",
        description: r.description || "",
        price_paise: r.price_paise,
        compare_at_paise: r.compare_at_paise,
        stock: r.stock,
        is_active: false,
        metadata: r.metadata,
      });
      if (error) return toast.error(error.message);
      toast.success("Hidden from active catalog");
      refresh();
      return;
    }
    const { error } = await supabase.from("products").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Products Catalog</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Manage specifications, variants, flagship tags, discounted pricing, and image galleries.
          </p>
        </div>
        <button
          onClick={() => {
            setShowNew(true);
            setEditingProduct(null);
          }}
          className="bg-primary text-on-primary px-4 py-2 text-[11px] font-bold uppercase tracking-widest hover:opacity-90 shadow-sm"
        >
          + New Product
        </button>
      </div>

      {showNew && (
        <NewProductForm
          cats={cats}
          onDone={() => {
            setShowNew(false);
            refresh();
          }}
          onCancel={() => setShowNew(false)}
        />
      )}

      {editingProduct && (
        <EditProductForm
          prod={editingProduct}
          cats={cats}
          onDone={() => {
            setEditingProduct(null);
            refresh();
          }}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      {!rows ? (
        <p className="text-on-surface-variant animate-pulse">Loading catalog…</p>
      ) : rows.length === 0 ? (
        <p className="text-on-surface-variant bg-white shopify-border p-12 text-center">
          No products in database yet. Click <strong>+ New Product</strong> above to add one.
        </p>
      ) : (
        <div className="bg-white shopify-border overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant/40">
              <tr className="text-left text-[10px] uppercase tracking-widest text-on-surface-variant">
                <th className="p-4">Product Info</th>
                <th className="p-4">Tag / Badge</th>
                <th className="p-4">Price & Discount</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Specs & Variants</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {r.metadata?.images?.[0] && (
                        <img
                          src={r.metadata.images[0]}
                          alt=""
                          className="w-10 h-10 object-cover shopify-border flex-shrink-0"
                        />
                      )}
                      <div>
                        <p className="font-bold text-primary">{r.name}</p>
                        <p className="text-[11px] text-on-surface-variant">{r.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {r.metadata?.badge ? (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary border border-primary px-2 py-0.5 rounded inline-block bg-primary/5">
                        {r.metadata.badge}
                      </span>
                    ) : (
                      <span className="text-xs text-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-primary">{formatINR(r.price_paise)}</p>
                    {r.compare_at_paise && r.compare_at_paise > r.price_paise && (
                      <p className="text-xs text-on-surface-variant line-through">
                        {formatINR(r.compare_at_paise)}
                      </p>
                    )}
                  </td>
                  <td className="p-4 font-bold">{r.stock}</td>
                  <td className="p-4 text-xs text-on-surface-variant space-y-1">
                    <div>
                      <strong>Specs:</strong> {r.metadata?.specs?.length || 0} configured
                    </div>
                    <div>
                      <strong>Variants:</strong>{" "}
                      {r.metadata?.variants?.map((v: any) => v.label).join(", ") || "None"}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggle(r)}
                      className={
                        "text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded " +
                        (r.is_active
                          ? "bg-primary text-on-primary"
                          : "border border-outline text-on-surface-variant")
                      }
                    >
                      {r.is_active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        setEditingProduct(r);
                        setShowNew(false);
                      }}
                      className="text-primary text-[11px] uppercase tracking-widest font-bold hover:underline mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(r)}
                      className="text-destructive text-[11px] uppercase tracking-widest font-bold hover:underline"
                    >
                      Delete
                    </button>
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

function NewProductForm({
  cats,
  onDone,
  onCancel,
}: {
  cats: Category[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([
    { label: "Display", value: '3.54" 640×960 IPS' },
    { label: "Processor", value: "Unisoc T606 Octa-core" },
    { label: "Memory", value: "4 GB RAM • 64 GB Storage" },
    { label: "Battery", value: "3000 mAh • 18W Fast Charge" },
    { label: "Keyboard", value: "Full QWERTY with backlight" },
    { label: "OS", value: "Android 12 Stock" },
    { label: "Connectivity", value: "4G LTE • Wi-Fi 5 • BT 5.0" },
  ]);
  const [variants, setVariants] = useState<{ id: string; label: string }[]>([
    { id: "black", label: "Obsidian Black" },
    { id: "silver", label: "Brushed Silver" },
  ]);
  const [images, setImages] = useState<string[]>([
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAN4IWZ0o1xacmmTaAaeV4gJ2JM37nCA4Vu9FMZfWJ6CWZ9FReqzNA1zUw6b0z8fcVQRPejT-QofOpAaJlfeyZecXQpvnPZozhZdiZEDOj_qYqjYW64yxxY868yjxmBThtOdw-4pzxzc42bvkJogioVcwVPkGQS6ry7BHc3bO3PdOrAO0BS-A9PtmtRSFRGsIExVtxY8Knwi18rphz2LtaWGl0UbhG2lpi0gT9sXZRW0-4tpyNY7rWZZMvKc--gTZ9bjlCWX_yVWtpO",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCm_n1zeaqwYJAsYDw_UO82ywo_kvjRIEVnrSe0IXmiCc0w0f4amIl5GPi1qwb0x_zgKFT2Di4PiqffML-GPcSWoClZySpGw7qQ5KichDioDJ3LGIIdRDCp23b_h_HuycTaBl8fCwkN65HACqY2RyAUbuVYXAMUet7R9QZmQP_Hm2XrrGU9PNnw72oQQSSb34P6kf49pocIY_D43rLRUqke2u3g9uKBoBgCxKU3v86La9sWNrLWM38CWCn2F1LBUJKie2Quec_FQzp_",
  ]);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([
    {
      question: "Is this device fully unlocked?",
      answer:
        "Yes, it is factory unlocked and fully compatible with all major 4G LTE networks across India and globally.",
    },
    {
      question: "Does it support Google Play Store?",
      answer: "Yes, full Google Play Services and Play Store are pre-installed and certified.",
    },
  ]);
  const [uploadingImg, setUploadingImg] = useState<number | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImg(idx);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          const copy = [...images];
          copy[idx] = publicUrlData.publicUrl;
          setImages(copy);
          toast.success("Image uploaded successfully to Supabase storage!");
          setUploadingImg(null);
          return;
        }
      }

      // Fallback to Data URL (base64) if storage bucket isn't accessible
      const reader = new FileReader();
      reader.onloadend = () => {
        const copy = [...images];
        copy[idx] = reader.result as string;
        setImages(copy);
        toast.success("Image loaded successfully from device storage!");
        setUploadingImg(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Failed to process image file.");
      setUploadingImg(null);
    }
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        const priceRupees = Number(fd.get("price"));
        const compareRupees = Number(fd.get("compare_at") || 0);
        const costRupees = Number(fd.get("cost_price") || priceRupees * 0.7);
        const gstRate = Number(fd.get("gst_rate") || 18);
        const wholesaleGstRate = Number(fd.get("wholesale_gst_rate") || 18);
        const shippingRupees = Number(fd.get("shipping_cost") || 150);
        const packagingRupees = Number(fd.get("packaging_cost") || 50);

        const metadata = {
          badge: String(fd.get("badge") ?? ""),
          cost_price_paise: Math.round(costRupees * 100),
          gst_rate: gstRate,
          wholesale_gst_rate: wholesaleGstRate,
          shipping_cost_paise: Math.round(shippingRupees * 100),
          packaging_cost_paise: Math.round(packagingRupees * 100),
          specs: specs.filter((s) => s.label && s.value),
          variants: variants.filter((v) => v.label),
          images: images.filter((i) => i.trim() !== ""),
          faqs: faqs.filter((f) => f.question && f.answer),
        };

        const { data: newProd, error } = await supabase
          .from("products")
          .insert({
            slug: String(fd.get("slug")),
            name: String(fd.get("name")),
            tagline: String(fd.get("tagline") ?? ""),
            description: String(fd.get("description") ?? ""),
            price_paise: Math.round(priceRupees * 100),
            compare_at_paise: compareRupees > 0 ? Math.round(compareRupees * 100) : null,
            stock: Number(fd.get("stock") ?? 0),
            category_id: (fd.get("category") as string) || null,
            is_active: true,
            metadata: metadata,
          })
          .select()
          .single();

        if (error) {
          setBusy(false);
          return toast.error(`Database Error: ${error.message}`);
        }

        // Insert images into product_images table if possible
        if (newProd && metadata.images.length > 0) {
          await supabase.from("product_images").insert(
            metadata.images.map((url, index) => ({
              product_id: newProd.id,
              url: url,
              sort_order: index,
            })),
          );
        }

        // Insert variants into product_variants table if possible
        if (newProd && metadata.variants.length > 0) {
          await supabase.from("product_variants").insert(
            metadata.variants.map((v) => ({
              product_id: newProd.id,
              label: v.label,
              price_delta_paise: 0,
              stock: Number(fd.get("stock") ?? 0),
            })),
          );
        }

        setBusy(false);
        toast.success("Product successfully created with Specs, Variants, FAQs, and Images!");
        onDone();
      }}
      className="bg-surface-container-low shopify-border p-8 space-y-8"
    >
      <div>
        <h3 className="text-lg font-bold text-primary">Add New Premium Product</h3>
        <p className="text-xs text-on-surface-variant">
          Fill in the complete details including discount pricing, tags, specifications, FAQs, and
          variants.
        </p>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 shopify-border">
        <div className="md:col-span-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
            1. Basic Information
          </h4>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Product Name *
          </label>
          <input
            name="name"
            required
            placeholder="e.g. Qin F22 Pro"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Unique Slug *
          </label>
          <input
            name="slug"
            required
            pattern="[a-z0-9-]+"
            placeholder="e.g. qin-f22-pro"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Tagline
          </label>
          <input
            name="tagline"
            placeholder="e.g. Tactile QWERTY • Android 12 • LTE"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Full Description
          </label>
          <textarea
            name="description"
            placeholder="Enter product overview and engineering features..."
            rows={3}
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Category
          </label>
          <select
            name="category"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          >
            <option value="">— Select Category —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Flagship Badge / Tag
          </label>
          <select
            name="badge"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          >
            <option value="Flagship">Flagship</option>
            <option value="Viral">Viral</option>
            <option value="Editor's Choice">Editor's Choice</option>
            <option value="Best Seller">Best Seller</option>
            <option value="New Arrival">New Arrival</option>
            <option value="">None</option>
          </select>
        </div>
      </div>

      {/* Pricing & Stock & Advanced Financials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 shopify-border">
        <div className="md:col-span-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            2. Pricing, Inventory & Financial Analytics Setup
          </h4>
          <p className="text-[11px] text-on-surface-variant mb-2">
            Configure buying costs, GST rates, wholesale GST paid, shipping, and packaging for
            real-time seller profit tracking.
          </p>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Selling Price (₹) *
          </label>
          <input
            name="price"
            required
            type="number"
            step="0.01"
            placeholder="e.g. 18999"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Original Compare-At Price (₹)
          </label>
          <input
            name="compare_at"
            type="number"
            step="0.01"
            placeholder="e.g. 21999 (Shows discount)"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Initial Stock Quantity
          </label>
          <input
            name="stock"
            type="number"
            defaultValue={10}
            placeholder="e.g. 14"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Cost Price Bought For (₹)
          </label>
          <input
            name="cost_price"
            type="number"
            step="0.01"
            placeholder="e.g. 12000 (Wholesale cost)"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Selling GST Rate (%)
          </label>
          <input
            name="gst_rate"
            type="number"
            defaultValue={18}
            placeholder="e.g. 18"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Wholesale GST Paid (%)
          </label>
          <input
            name="wholesale_gst_rate"
            type="number"
            defaultValue={18}
            placeholder="e.g. 18"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:col-span-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Shipping (₹)
            </label>
            <input
              name="shipping_cost"
              type="number"
              defaultValue={150}
              placeholder="150"
              className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Packaging (₹)
            </label>
            <input
              name="packaging_cost"
              type="number"
              defaultValue={50}
              placeholder="50"
              className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Images Gallery */}
      <div className="bg-white p-6 shopify-border space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
            3. Product Image Gallery URLs & Device Storage Upload
          </h4>
          <button
            type="button"
            onClick={() => setImages([...images, ""])}
            className="text-xs text-primary font-bold hover:underline"
          >
            + Add Image Slot
          </button>
        </div>
        <div className="space-y-4">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-4 border border-outline-variant/40 space-y-2 rounded"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  Image #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, i) => i !== idx))}
                  className="text-destructive font-bold text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
              <input
                value={img}
                onChange={(e) => {
                  const copy = [...images];
                  copy[idx] = e.target.value;
                  setImages(copy);
                }}
                placeholder="https://... (Image URL)"
                className="w-full border border-outline-variant/40 px-3 py-2 text-xs font-mono focus:border-primary bg-white"
              />
              <div className="pt-1">
                <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">
                  Or Upload from Device Storage
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, idx)}
                  className="w-full text-xs file:mr-4 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {uploadingImg === idx && (
                  <p className="text-xs text-amber-600 mt-1 animate-pulse">Uploading image...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Precision Specifications Builder */}
      <div className="bg-white p-6 shopify-border space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
            4. Precision Specifications
          </h4>
          <button
            type="button"
            onClick={() => setSpecs([...specs, { label: "", value: "" }])}
            className="text-xs text-primary font-bold hover:underline"
          >
            + Add Spec
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specs.map((spec, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-surface-container-lowest p-2 border border-outline-variant/40 rounded"
            >
              <input
                value={spec.label}
                onChange={(e) => {
                  const copy = [...specs];
                  copy[idx].label = e.target.value;
                  setSpecs(copy);
                }}
                placeholder="Label (e.g. Display)"
                className="w-1/3 border border-outline-variant/40 px-2 py-1 text-xs font-bold focus:border-primary"
              />
              <input
                value={spec.value}
                onChange={(e) => {
                  const copy = [...specs];
                  copy[idx].value = e.target.value;
                  setSpecs(copy);
                }}
                placeholder="Value (e.g. 3.54'' IPS)"
                className="w-2/3 border border-outline-variant/40 px-2 py-1 text-xs focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                className="text-destructive font-bold px-1 hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Product Variants Builder */}
      <div className="bg-white p-6 shopify-border space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
            5. Product Variants
          </h4>
          <button
            type="button"
            onClick={() => setVariants([...variants, { id: `var-${Date.now()}`, label: "" }])}
            className="text-xs text-primary font-bold hover:underline"
          >
            + Add Variant
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {variants.map((v, idx) => (
            <div
              key={v.id}
              className="flex items-center gap-2 bg-surface-container-lowest p-2 border border-outline-variant/40 rounded"
            >
              <input
                value={v.label}
                onChange={(e) => {
                  const copy = [...variants];
                  copy[idx].label = e.target.value;
                  setVariants(copy);
                }}
                placeholder="Variant Name (e.g. Obsidian Black)"
                className="border border-outline-variant/40 px-2 py-1 text-xs focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                className="text-destructive font-bold px-1 hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Product FAQs Builder */}
      <div className="bg-white p-6 shopify-border space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
            6. Product Specific FAQs
          </h4>
          <button
            type="button"
            onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
            className="text-xs text-primary font-bold hover:underline"
          >
            + Add FAQ
          </button>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-4 bg-surface-container-lowest border border-outline-variant/40 space-y-2 rounded relative"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  FAQ #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                  className="text-destructive font-bold text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
              <input
                value={faq.question}
                onChange={(e) => {
                  const copy = [...faqs];
                  copy[idx].question = e.target.value;
                  setFaqs(copy);
                }}
                placeholder="Question (e.g. Is this device fully unlocked?)"
                className="w-full border border-outline-variant/40 px-3 py-1.5 text-xs font-bold focus:border-primary bg-white"
              />
              <textarea
                rows={2}
                value={faq.answer}
                onChange={(e) => {
                  const copy = [...faqs];
                  copy[idx].answer = e.target.value;
                  setFaqs(copy);
                }}
                placeholder="Answer..."
                className="w-full border border-outline-variant/40 px-3 py-1.5 text-xs focus:border-primary bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          disabled={busy}
          className="bg-primary text-on-primary px-8 py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-50 shadow-sm hover:opacity-90 transition-opacity"
        >
          {busy ? "Saving to Database…" : "Save Product & Publish"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-outline px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditProductForm({
  prod,
  cats,
  onDone,
  onCancel,
}: {
  prod: Row;
  cats: Category[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>(
    prod.metadata?.specs || [],
  );
  const [variants, setVariants] = useState<{ id: string; label: string }[]>(
    prod.metadata?.variants || [],
  );
  const [images, setImages] = useState<string[]>(prod.metadata?.images || []);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>(
    prod.metadata?.faqs || [],
  );
  const [uploadingImg, setUploadingImg] = useState<number | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImg(idx);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          const copy = [...images];
          copy[idx] = publicUrlData.publicUrl;
          setImages(copy);
          toast.success("Image uploaded successfully to Supabase storage!");
          setUploadingImg(null);
          return;
        }
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const copy = [...images];
        copy[idx] = reader.result as string;
        setImages(copy);
        toast.success("Image loaded successfully from device storage!");
        setUploadingImg(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Failed to process image file.");
      setUploadingImg(null);
    }
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        const priceRupees = Number(fd.get("price"));
        const compareRupees = Number(fd.get("compare_at") || 0);
        const costRupees = Number(fd.get("cost_price") || priceRupees * 0.7);
        const gstRate = Number(fd.get("gst_rate") || 18);
        const wholesaleGstRate = Number(fd.get("wholesale_gst_rate") || 18);
        const shippingRupees = Number(fd.get("shipping_cost") || 150);
        const packagingRupees = Number(fd.get("packaging_cost") || 50);

        const metadata = {
          ...prod.metadata,
          badge: String(fd.get("badge") ?? ""),
          cost_price_paise: Math.round(costRupees * 100),
          gst_rate: gstRate,
          wholesale_gst_rate: wholesaleGstRate,
          shipping_cost_paise: Math.round(shippingRupees * 100),
          packaging_cost_paise: Math.round(packagingRupees * 100),
          specs: specs.filter((s) => s.label && s.value),
          variants: variants.filter((v) => v.label),
          images: images.filter((i) => i.trim() !== ""),
          faqs: faqs.filter((f) => f.question && f.answer),
        };

        const payload = {
          slug: String(fd.get("slug")),
          name: String(fd.get("name")),
          tagline: String(fd.get("tagline") ?? ""),
          description: String(fd.get("description") ?? ""),
          price_paise: Math.round(priceRupees * 100),
          compare_at_paise: compareRupees > 0 ? Math.round(compareRupees * 100) : null,
          stock: Number(fd.get("stock") ?? 0),
          category_id: (fd.get("category") as string) || null,
          is_active: prod.is_active,
          metadata: metadata,
        };

        if (prod.id.startsWith("static-")) {
          const { error } = await supabase.from("products").insert(payload);
          if (error) {
            setBusy(false);
            return toast.error(`Database Error: ${error.message}`);
          }
        } else {
          const { error } = await supabase.from("products").update(payload).eq("id", prod.id);
          if (error) {
            setBusy(false);
            return toast.error(`Database Error: ${error.message}`);
          }
        }

        setBusy(false);
        toast.success("Product successfully updated!");
        onDone();
      }}
      className="bg-surface-container-low shopify-border p-8 space-y-8"
    >
      <div>
        <h3 className="text-lg font-bold text-primary">Edit Product: {prod.name}</h3>
        <p className="text-xs text-on-surface-variant">
          Update pricing, wholesale cost, GST rates, specs, FAQs, and image galleries.
        </p>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 shopify-border">
        <div className="md:col-span-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
            1. Basic Information
          </h4>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Product Name *
          </label>
          <input
            name="name"
            defaultValue={prod.name}
            required
            placeholder="e.g. Qin F22 Pro"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Unique Slug *
          </label>
          <input
            name="slug"
            defaultValue={prod.slug}
            required
            pattern="[a-z0-9-]+"
            placeholder="e.g. qin-f22-pro"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Tagline
          </label>
          <input
            name="tagline"
            defaultValue={prod.tagline || ""}
            placeholder="e.g. Tactile QWERTY • Android 12 • LTE"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Full Description
          </label>
          <textarea
            name="description"
            defaultValue={prod.description || ""}
            placeholder="Enter product overview and engineering features..."
            rows={3}
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Category
          </label>
          <select
            name="category"
            defaultValue={prod.category_id || ""}
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          >
            <option value="">— Select Category —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Flagship Badge / Tag
          </label>
          <select
            name="badge"
            defaultValue={prod.metadata?.badge || ""}
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          >
            <option value="Flagship">Flagship</option>
            <option value="Viral">Viral</option>
            <option value="Editor's Choice">Editor's Choice</option>
            <option value="Best Seller">Best Seller</option>
            <option value="New Arrival">New Arrival</option>
            <option value="">None</option>
          </select>
        </div>
      </div>

      {/* Pricing & Stock & Advanced Financials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 shopify-border">
        <div className="md:col-span-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
            2. Pricing, Inventory & Financial Analytics Setup
          </h4>
          <p className="text-[11px] text-on-surface-variant mb-2">
            Configure buying costs, GST rates, wholesale GST paid, shipping, and packaging for
            real-time seller profit tracking.
          </p>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Selling Price (₹) *
          </label>
          <input
            name="price"
            defaultValue={prod.price_paise / 100}
            required
            type="number"
            step="0.01"
            placeholder="e.g. 18999"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Original Compare-At Price (₹)
          </label>
          <input
            name="compare_at"
            defaultValue={prod.compare_at_paise ? prod.compare_at_paise / 100 : ""}
            type="number"
            step="0.01"
            placeholder="e.g. 21999 (Shows discount)"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Initial Stock Quantity
          </label>
          <input
            name="stock"
            defaultValue={prod.stock}
            type="number"
            placeholder="e.g. 14"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Cost Price Bought For (₹)
          </label>
          <input
            name="cost_price"
            defaultValue={
              prod.metadata?.cost_price_paise !== undefined
                ? prod.metadata.cost_price_paise / 100
                : Math.round((prod.price_paise / 100) * 0.7)
            }
            type="number"
            step="0.01"
            placeholder="e.g. 12000 (Wholesale cost)"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Selling GST Rate (%)
          </label>
          <input
            name="gst_rate"
            defaultValue={prod.metadata?.gst_rate !== undefined ? prod.metadata.gst_rate : 18}
            type="number"
            placeholder="e.g. 18"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Wholesale GST Paid (%)
          </label>
          <input
            name="wholesale_gst_rate"
            defaultValue={
              prod.metadata?.wholesale_gst_rate !== undefined
                ? prod.metadata.wholesale_gst_rate
                : 18
            }
            type="number"
            placeholder="e.g. 18"
            className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:col-span-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Shipping (₹)
            </label>
            <input
              name="shipping_cost"
              defaultValue={
                prod.metadata?.shipping_cost_paise !== undefined
                  ? prod.metadata.shipping_cost_paise / 100
                  : 150
              }
              type="number"
              placeholder="150"
              className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Packaging (₹)
            </label>
            <input
              name="packaging_cost"
              defaultValue={
                prod.metadata?.packaging_cost_paise !== undefined
                  ? prod.metadata.packaging_cost_paise / 100
                  : 50
              }
              type="number"
              placeholder="50"
              className="w-full border border-outline-variant/40 px-3 py-2 text-sm focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Images Gallery */}
      <div className="bg-white p-6 shopify-border space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
            3. Product Image Gallery URLs & Device Storage Upload
          </h4>
          <button
            type="button"
            onClick={() => setImages([...images, ""])}
            className="text-xs text-primary font-bold hover:underline"
          >
            + Add Image Slot
          </button>
        </div>
        <div className="space-y-4">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-4 border border-outline-variant/40 space-y-2 rounded"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  Image #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, i) => i !== idx))}
                  className="text-destructive font-bold text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
              <input
                value={img}
                onChange={(e) => {
                  const copy = [...images];
                  copy[idx] = e.target.value;
                  setImages(copy);
                }}
                placeholder="https://... (Image URL)"
                className="w-full border border-outline-variant/40 px-3 py-2 text-xs font-mono focus:border-primary bg-white"
              />
              <div className="pt-1">
                <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">
                  Or Upload from Device Storage
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, idx)}
                  className="w-full text-xs file:mr-4 file:py-1.5 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                {uploadingImg === idx && (
                  <p className="text-xs text-amber-600 mt-1 animate-pulse">Uploading image...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Precision Specifications Builder */}
      <div className="bg-white p-6 shopify-border space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
            4. Precision Specifications
          </h4>
          <button
            type="button"
            onClick={() => setSpecs([...specs, { label: "", value: "" }])}
            className="text-xs text-primary font-bold hover:underline"
          >
            + Add Spec
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specs.map((spec, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-surface-container-lowest p-2 border border-outline-variant/40 rounded"
            >
              <input
                value={spec.label}
                onChange={(e) => {
                  const copy = [...specs];
                  copy[idx].label = e.target.value;
                  setSpecs(copy);
                }}
                placeholder="Label (e.g. Display)"
                className="w-1/3 border border-outline-variant/40 px-2 py-1 text-xs font-bold focus:border-primary"
              />
              <input
                value={spec.value}
                onChange={(e) => {
                  const copy = [...specs];
                  copy[idx].value = e.target.value;
                  setSpecs(copy);
                }}
                placeholder="Value (e.g. 3.54'' IPS)"
                className="w-2/3 border border-outline-variant/40 px-2 py-1 text-xs focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                className="text-destructive font-bold px-1 hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Product Variants Builder */}
      <div className="bg-white p-6 shopify-border space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
            5. Product Variants
          </h4>
          <button
            type="button"
            onClick={() => setVariants([...variants, { id: `var-${Date.now()}`, label: "" }])}
            className="text-xs text-primary font-bold hover:underline"
          >
            + Add Variant
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {variants.map((v, idx) => (
            <div
              key={v.id || idx}
              className="flex items-center gap-2 bg-surface-container-lowest p-2 border border-outline-variant/40 rounded"
            >
              <input
                value={v.label}
                onChange={(e) => {
                  const copy = [...variants];
                  copy[idx].label = e.target.value;
                  setVariants(copy);
                }}
                placeholder="Variant Name (e.g. Obsidian Black)"
                className="border border-outline-variant/40 px-2 py-1 text-xs focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                className="text-destructive font-bold px-1 hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Product FAQs Builder */}
      <div className="bg-white p-6 shopify-border space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
            6. Product Specific FAQs
          </h4>
          <button
            type="button"
            onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
            className="text-xs text-primary font-bold hover:underline"
          >
            + Add FAQ
          </button>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-4 bg-surface-container-lowest border border-outline-variant/40 space-y-2 rounded relative"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  FAQ #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))}
                  className="text-destructive font-bold text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
              <input
                value={faq.question}
                onChange={(e) => {
                  const copy = [...faqs];
                  copy[idx].question = e.target.value;
                  setFaqs(copy);
                }}
                placeholder="Question (e.g. Is this device fully unlocked?)"
                className="w-full border border-outline-variant/40 px-3 py-1.5 text-xs font-bold focus:border-primary bg-white"
              />
              <textarea
                rows={2}
                value={faq.answer}
                onChange={(e) => {
                  const copy = [...faqs];
                  copy[idx].answer = e.target.value;
                  setFaqs(copy);
                }}
                placeholder="Answer..."
                className="w-full border border-outline-variant/40 px-3 py-1.5 text-xs focus:border-primary bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          disabled={busy}
          className="bg-primary text-on-primary px-8 py-3 text-xs font-bold uppercase tracking-widest disabled:opacity-50 shadow-sm hover:opacity-90 transition-opacity"
        >
          {busy ? "Saving to Database…" : "Save Product Updates"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-outline px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
