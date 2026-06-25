import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStorefrontCms, DEFAULT_STOREFRONT_CMS, type StorefrontCms } from "@/lib/products";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { updateStoreSettings } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/cms")({
  component: AdminCmsPage,
});

function AdminCmsPage() {
  const [cms, setCms] = useState<StorefrontCms>(DEFAULT_STOREFRONT_CMS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("checkout");
  const updateCmsFn = useServerFn(updateStoreSettings);

  useEffect(() => {
    async function fetchCms() {
      setLoading(true);
      const data = await getStorefrontCms();
      setCms(data);
      setLoading(false);
    }
    fetchCms();
  }, []);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof StorefrontCms,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
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
          setCms((prev) => ({ ...prev, [field]: publicUrlData.publicUrl }) as any);
          toast.success("Image uploaded successfully to Supabase storage!");
          setUploadingField(null);
          return;
        }
      }

      // Fallback to Data URL (base64) if storage bucket isn't accessible
      const reader = new FileReader();
      reader.onloadend = () => {
        setCms((prev) => ({ ...prev, [field]: reader.result as string }) as any);
        toast.success("Image loaded successfully from device storage!");
        setUploadingField(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Failed to process image file.");
      setUploadingField(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("storefront_cms_custom", JSON.stringify(cms));
      }

      const payload = {
        id: "hero_banners",
        hero_1_image: cms.hero_1_image,
        hero_1_link: cms.hero_1_link,
        hero_1_label: cms.hero_1_label,
        hero_2_image: cms.hero_2_image,
        hero_2_link: cms.hero_2_link,
        hero_2_label: cms.hero_2_label,
        metadata: {
          hero_title: cms.hero_title,
          hero_subtitle: cms.hero_subtitle,
          trending_title: cms.trending_title,
          trending_subtitle: cms.trending_subtitle,
          keypad_title: cms.keypad_title,
          keypad_desc: cms.keypad_desc,
          keypad_banner_1_image: cms.keypad_banner_1_image,
          keypad_banner_1_link: cms.keypad_banner_1_link,
          keypad_banner_2_image: cms.keypad_banner_2_image,
          keypad_banner_2_link: cms.keypad_banner_2_link,
          drivers_title: cms.drivers_title,
          drivers_subtitle: cms.drivers_subtitle,
          faqs: cms.faqs,
          catalog_title: cms.catalog_title,
          catalog_subtitle: cms.catalog_subtitle,
          about_title: cms.about_title,
          about_subtitle: cms.about_subtitle,
          about_story: cms.about_story,
          about_mission: cms.about_mission,
          about_values: cms.about_values,
          about_image: cms.about_image,
          videos: cms.videos,
          pointers: cms.pointers,
          reviews_heading: cms.reviews_heading,
          reviews: cms.reviews,
          cod_charge_amount: cms.cod_charge_amount,
          cod_charge_type: cms.cod_charge_type,
          prepaid_discount_amount: cms.prepaid_discount_amount,
          prepaid_discount_type: cms.prepaid_discount_type,
        },
        updated_at: new Date().toISOString(),
      };

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("Not logged in");

        await updateCmsFn({ data: { token, ...payload } });
      } catch (dbErr: any) {
        if (dbErr.message && !dbErr.message.includes("schema cache")) {
          throw dbErr;
        }
      }

      toast.success("Storefront CMS settings published successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save CMS settings.");
    } finally {
      setSaving(false);
    }
  };

  const updateFaq = (index: number, key: "question" | "answer", value: string) => {
    const copy = [...cms.faqs];
    copy[index] = { ...copy[index], [key]: value };
    setCms((prev) => ({ ...prev, faqs: copy }));
  };

  const addFaq = () => {
    setCms((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "New Question?", answer: "Answer goes here." }],
    }));
  };

  const removeFaq = (index: number) => {
    setCms((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-on-surface-variant">Loading Storefront CMS...</div>
    );
  }

  const tabs = [
    { id: "checkout", label: "Checkout & Charges", icon: "account_balance_wallet" },
    { id: "hero", label: "Hero Banners", icon: "view_carousel" },
    { id: "trending", label: "Trending Gadgets", icon: "trending_up" },
    { id: "keypad", label: "Keypad Collection", icon: "phone_iphone" },
    { id: "drivers", label: "Daily Drivers", icon: "auto_awesome" },
    { id: "catalog", label: "Catalog Header", icon: "grid_view" },
    { id: "about", label: "About Us Page", icon: "info" },
    { id: "faqs", label: "Homepage FAQs", icon: "quiz" },
    { id: "videos", label: "YouTube & Insta", icon: "video_library" },
    { id: "pointers", label: "Trust Pointers", icon: "check_circle" },
    { id: "reviews", label: "Google Reviews", icon: "star" },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-white shopify-border p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-l-4 border-l-emerald-500">
        <div>
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600">tune</span>
            Storefront CMS (Premium Dashboard)
          </h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Real-time visual customization for checkout charges, payment discounts, homepage
            layouts, and brand assets.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-on-primary px-8 py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-base">publish</span>
          {saving ? "Publishing..." : "Publish Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 bg-white shopify-border p-4 shadow-sm space-y-1 sticky top-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant px-3 py-2">
            CMS Sections
          </p>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-xs font-bold rounded transition-all ${activeTab === tab.id ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-low"}`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Configuration Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {/* 0. Checkout Charges & Discounts */}
          {activeTab === "checkout" && (
            <div className="bg-white shopify-border p-6 md:p-8 shadow-sm space-y-8 animate-fadeIn">
              <div className="border-b border-outline-variant/30 pb-4">
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    account_balance_wallet
                  </span>
                  Checkout Charges & Discount Configuration
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Configure Cash on Delivery (COD) advance booking fees, additional handling
                  charges, or flat/percentage prepaid discounts instantly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* COD Settings Card */}
                <div className="p-6 bg-surface-container-lowest border border-outline-variant/40 space-y-6 rounded">
                  <h4 className="font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                    <span className="material-symbols-outlined text-amber-600">local_shipping</span>
                    Cash on Delivery (COD) Rules
                  </h4>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                      COD Charge Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "advance", label: "Advance Fee" },
                        { id: "additional", label: "Extra Charge" },
                        { id: "none", label: "Free COD" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setCms({ ...cms, cod_charge_type: t.id as any })}
                          className={`py-2 px-3 text-xs font-bold border rounded transition-all ${cms.cod_charge_type === t.id ? "bg-primary text-on-primary border-primary shadow-sm" : "bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      {cms.cod_charge_type === "advance" &&
                        "Advance Booking Fee (e.g. ₹99) collected via Razorpay now, deducted from total at delivery."}
                      {cms.cod_charge_type === "additional" &&
                        "Extra handling fee added on top of order total, collected immediately via Razorpay."}
                      {cms.cod_charge_type === "none" &&
                        "No advance fee. Customer pays full amount at delivery."}
                    </p>
                  </div>

                  {cms.cod_charge_type !== "none" && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                        Charge Amount (₹ INR)
                      </label>
                      <input
                        type="number"
                        value={cms.cod_charge_amount}
                        onChange={(e) =>
                          setCms({
                            ...cms,
                            cod_charge_amount: Math.max(0, parseInt(e.target.value, 10) || 0),
                          })
                        }
                        className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="p-4 bg-amber-50/50 border border-amber-200 rounded space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">Live Checkout Preview:</span>
                      {cms.cod_charge_type === "advance" && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          ₹{cms.cod_charge_amount} Advance
                        </span>
                      )}
                      {cms.cod_charge_type === "additional" && (
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          +₹{cms.cod_charge_amount} Fee
                        </span>
                      )}
                      {cms.cod_charge_type === "none" && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          FREE COD
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      {cms.cod_charge_type === "advance"
                        ? `Requires ₹${cms.cod_charge_amount} advance payment via Razorpay to prevent order cancellations`
                        : cms.cod_charge_type === "additional"
                          ? `Includes ₹${cms.cod_charge_amount} additional COD handling fee (collected now via Razorpay)`
                          : "Pay via cash or UPI when your package arrives at your doorstep"}
                    </p>
                  </div>
                </div>

                {/* Prepaid Settings Card */}
                <div className="p-6 bg-surface-container-lowest border border-outline-variant/40 space-y-6 rounded">
                  <h4 className="font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                    <span className="material-symbols-outlined text-emerald-600">redeem</span>
                    Prepaid Instant Discount Rules
                  </h4>
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                      Discount Type
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "flat", label: "Flat ₹ OFF" },
                        { id: "percent", label: "Percent % OFF" },
                        { id: "none", label: "No Discount" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setCms({ ...cms, prepaid_discount_type: t.id as any })}
                          className={`py-2 px-3 text-xs font-bold border rounded transition-all ${cms.prepaid_discount_type === t.id ? "bg-primary text-on-primary border-primary shadow-sm" : "bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      {cms.prepaid_discount_type === "flat" &&
                        "Deducts a fixed amount (e.g. ₹200) instantly on choosing Razorpay."}
                      {cms.prepaid_discount_type === "percent" &&
                        "Deducts a percentage of cart total (e.g. 5%) instantly on choosing Razorpay."}
                      {cms.prepaid_discount_type === "none" && "No prepaid discount applied."}
                    </p>
                  </div>

                  {cms.prepaid_discount_type !== "none" && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                        Discount Value (
                        {cms.prepaid_discount_type === "flat" ? "₹ INR" : "% Percent"})
                      </label>
                      <input
                        type="number"
                        value={cms.prepaid_discount_amount}
                        onChange={(e) =>
                          setCms({
                            ...cms,
                            prepaid_discount_amount: Math.max(0, parseInt(e.target.value, 10) || 0),
                          })
                        }
                        className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">Live Checkout Preview:</span>
                      {cms.prepaid_discount_type !== "none" && cms.prepaid_discount_amount > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {cms.prepaid_discount_type === "flat"
                            ? `₹${cms.prepaid_discount_amount} OFF`
                            : `${cms.prepaid_discount_amount}% OFF`}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      {cms.prepaid_discount_type === "none" || cms.prepaid_discount_amount === 0
                        ? "Instant secure payment via Razorpay"
                        : `Instant ${cms.prepaid_discount_type === "flat" ? `₹${cms.prepaid_discount_amount}` : `${cms.prepaid_discount_amount}%`} Discount on Prepaid Orders`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1. Hero Section Settings */}
          {activeTab === "hero" && (
            <div className="bg-white shopify-border p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
              <h3 className="text-xl font-bold text-primary pb-4 border-b border-outline-variant/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">view_carousel</span>
                Hero Section & Main Banners
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Hero Title
                  </label>
                  <input
                    type="text"
                    value={cms.hero_title}
                    onChange={(e) => setCms({ ...cms, hero_title: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Hero Subtitle
                  </label>
                  <textarea
                    rows={3}
                    value={cms.hero_subtitle}
                    onChange={(e) => setCms({ ...cms, hero_subtitle: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Hero Banner 1 */}
              <div className="p-6 bg-surface-container-lowest border border-outline-variant/40 space-y-6">
                <h4 className="font-bold text-sm text-primary uppercase tracking-wider">
                  Hero Banner 1 (Left Big Banner)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={cms.hero_1_image}
                      onChange={(e) => setCms({ ...cms, hero_1_image: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                    />
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-emerald-700 uppercase tracking-widest mb-1">
                        Or Upload from Device Storage
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "hero_1_image")}
                        className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                      {uploadingField === "hero_1_image" && (
                        <p className="text-xs text-amber-600 mt-1 animate-pulse">
                          Uploading image...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                        Banner Link
                      </label>
                      <input
                        type="text"
                        value={cms.hero_1_link}
                        onChange={(e) => setCms({ ...cms, hero_1_link: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                        Banner Label
                      </label>
                      <input
                        type="text"
                        value={cms.hero_1_label}
                        onChange={(e) => setCms({ ...cms, hero_1_label: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                {cms.hero_1_image && (
                  <div className="aspect-[16/9] max-w-xs overflow-hidden shopify-border bg-white">
                    <img src={cms.hero_1_image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Hero Banner 2 */}
              <div className="p-6 bg-surface-container-lowest border border-outline-variant/40 space-y-6">
                <h4 className="font-bold text-sm text-primary uppercase tracking-wider">
                  Hero Banner 2 (Right Top Square)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={cms.hero_2_image}
                      onChange={(e) => setCms({ ...cms, hero_2_image: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                    />
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-emerald-700 uppercase tracking-widest mb-1">
                        Or Upload from Device Storage
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "hero_2_image")}
                        className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                      {uploadingField === "hero_2_image" && (
                        <p className="text-xs text-amber-600 mt-1 animate-pulse">
                          Uploading image...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                        Banner Link
                      </label>
                      <input
                        type="text"
                        value={cms.hero_2_link}
                        onChange={(e) => setCms({ ...cms, hero_2_link: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                        Banner Label
                      </label>
                      <input
                        type="text"
                        value={cms.hero_2_label}
                        onChange={(e) => setCms({ ...cms, hero_2_label: e.target.value })}
                        className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                {cms.hero_2_image && (
                  <div className="aspect-square max-w-xs overflow-hidden shopify-border bg-white">
                    <img src={cms.hero_2_image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Trending Gadgets Section Settings */}
          {activeTab === "trending" && (
            <div className="bg-white shopify-border p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
              <h3 className="text-xl font-bold text-primary pb-4 border-b border-outline-variant/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">trending_up</span>
                Trending Gadgets Section
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={cms.trending_title}
                    onChange={(e) => setCms({ ...cms, trending_title: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Section Subtitle
                  </label>
                  <input
                    type="text"
                    value={cms.trending_subtitle}
                    onChange={(e) => setCms({ ...cms, trending_subtitle: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Keypad Android Collection Settings */}
          {activeTab === "keypad" && (
            <div className="bg-white shopify-border p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
              <h3 className="text-xl font-bold text-primary pb-4 border-b border-outline-variant/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">phone_iphone</span>
                Keypad Android Collection & Custom Banners
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={cms.keypad_title}
                    onChange={(e) => setCms({ ...cms, keypad_title: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Section Description
                  </label>
                  <textarea
                    rows={3}
                    value={cms.keypad_desc}
                    onChange={(e) => setCms({ ...cms, keypad_desc: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Keypad Banner 1 */}
              <div className="p-6 bg-surface-container-lowest border border-outline-variant/40 space-y-6">
                <h4 className="font-bold text-sm text-primary uppercase tracking-wider">
                  Keypad Banner 1 (Left Card)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={cms.keypad_banner_1_image}
                      onChange={(e) => setCms({ ...cms, keypad_banner_1_image: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                    />
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-emerald-700 uppercase tracking-widest mb-1">
                        Or Upload from Device Storage
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "keypad_banner_1_image")}
                        className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                      {uploadingField === "keypad_banner_1_image" && (
                        <p className="text-xs text-amber-600 mt-1 animate-pulse">
                          Uploading image...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                      Destination Link
                    </label>
                    <input
                      type="text"
                      value={cms.keypad_banner_1_link}
                      onChange={(e) => setCms({ ...cms, keypad_banner_1_link: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                {cms.keypad_banner_1_image && (
                  <div className="aspect-[4/5] max-w-xs overflow-hidden shopify-border bg-white">
                    <img
                      src={cms.keypad_banner_1_image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Keypad Banner 2 */}
              <div className="p-6 bg-surface-container-lowest border border-outline-variant/40 space-y-6">
                <h4 className="font-bold text-sm text-primary uppercase tracking-wider">
                  Keypad Banner 2 (Right Card)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={cms.keypad_banner_2_image}
                      onChange={(e) => setCms({ ...cms, keypad_banner_2_image: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                    />
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-emerald-700 uppercase tracking-widest mb-1">
                        Or Upload from Device Storage
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "keypad_banner_2_image")}
                        className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                      {uploadingField === "keypad_banner_2_image" && (
                        <p className="text-xs text-amber-600 mt-1 animate-pulse">
                          Uploading image...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                      Destination Link
                    </label>
                    <input
                      type="text"
                      value={cms.keypad_banner_2_link}
                      onChange={(e) => setCms({ ...cms, keypad_banner_2_link: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                {cms.keypad_banner_2_image && (
                  <div className="aspect-[4/5] max-w-xs overflow-hidden shopify-border bg-white">
                    <img
                      src={cms.keypad_banner_2_image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Minimalist Daily Drivers Settings */}
          {activeTab === "drivers" && (
            <div className="bg-white shopify-border p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
              <h3 className="text-xl font-bold text-primary pb-4 border-b border-outline-variant/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                Minimalist Daily Drivers Section
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={cms.drivers_title}
                    onChange={(e) => setCms({ ...cms, drivers_title: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Section Subtitle
                  </label>
                  <input
                    type="text"
                    value={cms.drivers_subtitle}
                    onChange={(e) => setCms({ ...cms, drivers_subtitle: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Catalog Page Settings */}
          {activeTab === "catalog" && (
            <div className="bg-white shopify-border p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
              <h3 className="text-xl font-bold text-primary pb-4 border-b border-outline-variant/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">grid_view</span>
                Catalog Page Content
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Catalog Title
                  </label>
                  <input
                    type="text"
                    value={cms.catalog_title || ""}
                    onChange={(e) => setCms({ ...cms, catalog_title: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Catalog Subtitle / Intro
                  </label>
                  <textarea
                    rows={2}
                    value={cms.catalog_subtitle || ""}
                    onChange={(e) => setCms({ ...cms, catalog_subtitle: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* About Us Page Settings */}
          {activeTab === "about" && (
            <div className="bg-white shopify-border p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
              <h3 className="text-xl font-bold text-primary pb-4 border-b border-outline-variant/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">info</span>
                About Us Page Content
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    About Title
                  </label>
                  <input
                    type="text"
                    value={cms.about_title || ""}
                    onChange={(e) => setCms({ ...cms, about_title: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    About Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={cms.about_subtitle || ""}
                    onChange={(e) => setCms({ ...cms, about_subtitle: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Our Story & Background
                  </label>
                  <textarea
                    rows={4}
                    value={cms.about_story || ""}
                    onChange={(e) => setCms({ ...cms, about_story: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Our Mission
                  </label>
                  <textarea
                    rows={3}
                    value={cms.about_mission || ""}
                    onChange={(e) => setCms({ ...cms, about_mission: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Core Values
                  </label>
                  <input
                    type="text"
                    value={cms.about_values || ""}
                    onChange={(e) => setCms({ ...cms, about_values: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                    Featured Image URL
                  </label>
                  <input
                    type="text"
                    value={cms.about_image || ""}
                    onChange={(e) => setCms({ ...cms, about_image: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                  <div className="pt-2">
                    <label className="block text-[11px] font-bold text-emerald-700 uppercase tracking-widest mb-1">
                      Or Upload from Device Storage
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "about_image")}
                      className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    {uploadingField === "about_image" && (
                      <p className="text-xs text-amber-600 mt-1 animate-pulse">
                        Uploading image...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Homepage FAQs Management */}
          {activeTab === "faqs" && (
            <div className="bg-white shopify-border p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">quiz</span>
                  Homepage FAQs Management
                </h3>
                <button
                  type="button"
                  onClick={addFaq}
                  className="border border-outline text-primary px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-surface-container transition-all shadow-sm bg-white flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Add FAQ
                </button>
              </div>
              <div className="space-y-6">
                {cms.faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="p-6 bg-surface-container-lowest border border-outline-variant/40 space-y-4 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">
                        Question #{i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFaq(i)}
                        className="text-xs text-red-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span> Remove
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                        Question
                      </label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => updateFaq(i, "question", e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                        Answer
                      </label>
                      <textarea
                        rows={3}
                        value={faq.answer}
                        onChange={(e) => updateFaq(i, "answer", e.target.value)}
                        className="w-full bg-surface-container-low border border-outline-variant/40 p-3 text-sm font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. YouTube & Instagram Video Integration */}
          {activeTab === "videos" && (
            <div className="bg-white shopify-border p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">video_library</span>
                  YouTube & Instagram Video Integration
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setCms({
                      ...cms,
                      videos: [
                        ...cms.videos,
                        {
                          platform: "YouTube",
                          title: "NEW VIDEO",
                          url: "https://youtube.com",
                          image: "",
                          views: "10K views",
                          likes: "500 likes",
                        },
                      ],
                    })
                  }
                  className="border border-outline text-primary px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-surface-container transition-all shadow-sm bg-white flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Add Video
                </button>
              </div>
              <div className="space-y-6">
                {cms.videos.map((vid, i) => (
                  <div
                    key={i}
                    className="p-6 bg-surface-container-lowest border border-outline-variant/40 space-y-4 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">
                        Video #{i + 1} ({vid.platform})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCms({ ...cms, videos: cms.videos.filter((_, idx) => idx !== i) })
                        }
                        className="text-xs text-red-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span> Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                          Platform
                        </label>
                        <select
                          value={vid.platform}
                          onChange={(e) => {
                            const copy = [...cms.videos];
                            copy[i] = { ...copy[i], platform: e.target.value };
                            setCms({ ...cms, videos: copy });
                          }}
                          className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                        >
                          <option value="Instagram">Instagram</option>
                          <option value="YouTube">YouTube</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                          Video Title / Label
                        </label>
                        <input
                          type="text"
                          value={vid.title}
                          onChange={(e) => {
                            const copy = [...cms.videos];
                            copy[i] = { ...copy[i], title: e.target.value };
                            setCms({ ...cms, videos: copy });
                          }}
                          className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                          Target Link URL
                        </label>
                        <input
                          type="text"
                          value={vid.url}
                          onChange={(e) => {
                            const copy = [...cms.videos];
                            copy[i] = { ...copy[i], url: e.target.value };
                            setCms({ ...cms, videos: copy });
                          }}
                          className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                          Thumbnail Image URL
                        </label>
                        <input
                          type="text"
                          value={vid.image}
                          onChange={(e) => {
                            const copy = [...cms.videos];
                            copy[i] = { ...copy[i], image: e.target.value };
                            setCms({ ...cms, videos: copy });
                          }}
                          className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                          Views Count Text
                        </label>
                        <input
                          type="text"
                          value={vid.views}
                          onChange={(e) => {
                            const copy = [...cms.videos];
                            copy[i] = { ...copy[i], views: e.target.value };
                            setCms({ ...cms, videos: copy });
                          }}
                          className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                          Likes Count Text
                        </label>
                        <input
                          type="text"
                          value={vid.likes}
                          onChange={(e) => {
                            const copy = [...cms.videos];
                            copy[i] = { ...copy[i], likes: e.target.value };
                            setCms({ ...cms, videos: copy });
                          }}
                          className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Feature Pointers (4 to 8 Pointers Section) */}
          {activeTab === "pointers" && (
            <div className="bg-white shopify-border p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  Feature Pointers (Trust & Value Props)
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setCms({
                      ...cms,
                      pointers: [
                        ...cms.pointers,
                        {
                          icon: "star",
                          title: "NEW POINTER",
                          description: "Enter description here.",
                        },
                      ],
                    })
                  }
                  className="border border-outline text-primary px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-surface-container transition-all shadow-sm bg-white flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Add Pointer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cms.pointers.map((ptr, i) => (
                  <div
                    key={i}
                    className="p-6 bg-surface-container-lowest border border-outline-variant/40 space-y-4 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">
                        Pointer #{i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCms({ ...cms, pointers: cms.pointers.filter((_, idx) => idx !== i) })
                        }
                        className="text-xs text-red-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span> Remove
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                        Material Icon Name
                      </label>
                      <input
                        type="text"
                        value={ptr.icon}
                        onChange={(e) => {
                          const copy = [...cms.pointers];
                          copy[i] = { ...copy[i], icon: e.target.value };
                          setCms({ ...cms, pointers: copy });
                        }}
                        className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                        Title
                      </label>
                      <input
                        type="text"
                        value={ptr.title}
                        onChange={(e) => {
                          const copy = [...cms.pointers];
                          copy[i] = { ...copy[i], title: e.target.value };
                          setCms({ ...cms, pointers: copy });
                        }}
                        className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                        Description
                      </label>
                      <input
                        type="text"
                        value={ptr.description}
                        onChange={(e) => {
                          const copy = [...cms.pointers];
                          copy[i] = { ...copy[i], description: e.target.value };
                          setCms({ ...cms, pointers: copy });
                        }}
                        className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Google Reviews Section */}
          {activeTab === "reviews" && (
            <div className="bg-white shopify-border p-6 md:p-8 shadow-sm space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">star</span>
                  Google Reviews Management
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setCms({
                      ...cms,
                      reviews: [
                        ...cms.reviews,
                        {
                          author: "New Customer",
                          time: "Just now",
                          stars: 5,
                          snippet: "Excellent experience!",
                          avatar: "N",
                        },
                      ],
                    })
                  }
                  className="border border-outline text-primary px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-surface-container transition-all shadow-sm bg-white flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Add Review
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-surface-container-lowest border border-outline-variant/40">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={cms.reviews_heading.store_name}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        reviews_heading: { ...cms.reviews_heading, store_name: e.target.value },
                      })
                    }
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                    Rating Value (e.g. 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cms.reviews_heading.rating}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        reviews_heading: {
                          ...cms.reviews_heading,
                          rating: parseFloat(e.target.value) || 5.0,
                        },
                      })
                    }
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                    Total Reviews Count
                  </label>
                  <input
                    type="number"
                    value={cms.reviews_heading.total_reviews}
                    onChange={(e) =>
                      setCms({
                        ...cms,
                        reviews_heading: {
                          ...cms.reviews_heading,
                          total_reviews: parseInt(e.target.value, 10) || 84,
                        },
                      })
                    }
                    className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-6">
                {cms.reviews.map((rev, i) => (
                  <div
                    key={i}
                    className="p-6 bg-surface-container-lowest border border-outline-variant/40 space-y-4 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">
                        Review #{i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCms({ ...cms, reviews: cms.reviews.filter((_, idx) => idx !== i) })
                        }
                        className="text-xs text-red-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span> Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          value={rev.author}
                          onChange={(e) => {
                            const copy = [...cms.reviews];
                            copy[i] = {
                              ...copy[i],
                              author: e.target.value,
                              avatar: e.target.value ? e.target.value[0].toUpperCase() : "U",
                            };
                            setCms({ ...cms, reviews: copy });
                          }}
                          className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                          Time (e.g. 2 months ago)
                        </label>
                        <input
                          type="text"
                          value={rev.time}
                          onChange={(e) => {
                            const copy = [...cms.reviews];
                            copy[i] = { ...copy[i], time: e.target.value };
                            setCms({ ...cms, reviews: copy });
                          }}
                          className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                          Stars Count
                        </label>
                        <select
                          value={rev.stars}
                          onChange={(e) => {
                            const copy = [...cms.reviews];
                            copy[i] = { ...copy[i], stars: parseInt(e.target.value, 10) || 5 };
                            setCms({ ...cms, reviews: copy });
                          }}
                          className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                        >
                          <option value="5">5 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="3">3 Stars</option>
                          <option value="2">2 Stars</option>
                          <option value="1">1 Star</option>
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                          Review Snippet
                        </label>
                        <textarea
                          rows={2}
                          value={rev.snippet}
                          onChange={(e) => {
                            const copy = [...cms.reviews];
                            copy[i] = { ...copy[i], snippet: e.target.value };
                            setCms({ ...cms, reviews: copy });
                          }}
                          className="w-full bg-surface-container-low border border-outline-variant/40 p-2.5 text-sm font-medium focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Floating/Fixed Action Bar */}
          <div className="text-right pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-on-primary px-12 py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">publish</span>
              {saving ? "Publishing..." : "Publish All Changes"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
