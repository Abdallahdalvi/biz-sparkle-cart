import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { getAllProducts, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";

export const Route = createFileRoute("/compare")({
  loader: async () => {
    const all = await getAllProducts();
    return { all };
  },
  head: () => ({
    meta: [
      { title: "Device Comparison Engine — TECHLAB" },
      { name: "description", content: "Compare boutique phones, audio engines, and mechanical accessories side-by-side." },
      { property: "og:title", content: "Device Comparison Engine — TECHLAB" },
      { property: "og:description", content: "Compare boutique phones, audio engines, and mechanical accessories side-by-side." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { all } = Route.useLoaderData() as { all: Product[] };
  const add = useCart((s: any) => s.add);
  const navigate = useNavigate();

  // Default select first 3 products if available
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([
    all[0]?.slug || "",
    all[1]?.slug || "",
    all[2]?.slug || "",
  ]);

  function handleSelectChange(index: number, slug: string) {
    const next = [...selectedSlugs];
    next[index] = slug;
    setSelectedSlugs(next);
  }

  const selectedProducts = selectedSlugs.map((slug) => all.find((p) => p.slug === slug));

  function formatINR(paise: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(paise / 100);
  }

  // Gather all unique spec labels across selected products
  const allSpecLabels = Array.from(
    new Set(
      selectedProducts
        .filter(Boolean)
        .flatMap((p) => p!.specs.map((s) => s.label))
    )
  );

  return (
    <SiteShell>
      <section className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-12 md:py-16">
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            <Link to="/" className="hover:text-primary">Home</Link> / Compare
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary max-w-2xl">
            Device Comparison Engine
          </h1>
          <p className="text-on-surface-variant mt-4 max-w-xl">
            Compare precision-engineered mechanics, battery stamina, tactile key mechanisms, and acoustic specifications side-by-side.
          </p>
        </div>

        {/* Device Selection Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[0, 1, 2].map((slotIndex) => {
            const currentProduct = selectedProducts[slotIndex];
            return (
              <div key={slotIndex} className="bg-surface-container-lowest border border-outline-variant/40 p-6 rounded shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
                    Slot {slotIndex + 1} Device
                  </label>
                  <select
                    value={selectedSlugs[slotIndex]}
                    onChange={(e) => handleSelectChange(slotIndex, e.target.value)}
                    className="w-full bg-white border border-outline-variant/40 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-primary focus:outline-none focus:border-primary shadow-sm mb-6"
                  >
                    <option value="">— Select a Device —</option>
                    {all.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name} ({p.formFactor || p.category})
                      </option>
                    ))}
                  </select>

                  {currentProduct ? (
                    <div className="space-y-4 text-center">
                      <div className="aspect-square bg-surface-container-lowest overflow-hidden border border-outline-variant/30 rounded flex items-center justify-center p-4 shadow-inner">
                        <img
                          src={currentProduct.images[0]}
                          alt={currentProduct.name}
                          className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-primary">{currentProduct.name}</h3>
                        <p className="text-xs text-on-surface-variant mt-1">{currentProduct.tagline}</p>
                        <div className="mt-3 flex items-center justify-center gap-2">
                          <span className="text-base font-bold text-primary">{formatINR(currentProduct.pricePaise)}</span>
                          {currentProduct.compareAtPaise && (
                            <span className="text-xs text-on-surface-variant line-through">{formatINR(currentProduct.compareAtPaise)}</span>
                          )}
                        </div>
                        {currentProduct.badge && (
                          <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest bg-primary text-on-primary px-2 py-0.5 rounded">
                            {currentProduct.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-surface-container-lowest border border-dashed border-outline-variant/60 rounded flex flex-col items-center justify-center text-on-surface-variant text-center p-6 space-y-2">
                      <span className="material-symbols-outlined text-3xl">ad_units</span>
                      <p className="text-xs font-medium">Select a gadget from the dropdown above to begin side-by-side comparison.</p>
                    </div>
                  )}
                </div>

                {currentProduct && (
                  <div className="pt-4 border-t border-outline-variant/30">
                    {currentProduct.stock > 0 ? (
                      <button
                        onClick={() => {
                          add({
                            slug: currentProduct.slug,
                            name: currentProduct.name,
                            pricePaise: currentProduct.pricePaise,
                            image: currentProduct.images[0],
                          }, 1);
                          toast.success(`Added ${currentProduct.name} to cart`);
                        }}
                        className="w-full bg-primary text-on-primary py-3.5 font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">shopping_cart</span> Add to Cart
                      </button>
                    ) : (
                      <Link
                        to="/product/$slug"
                        params={{ slug: currentProduct.slug }}
                        className="w-full bg-surface-container text-primary py-3.5 font-bold text-xs uppercase tracking-widest hover:bg-surface-container-high transition-colors shadow-sm flex items-center justify-center gap-2 block text-center"
                      >
                        <span className="material-symbols-outlined text-base">hourglass_top</span> Join Waitlist
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison Specs Table */}
        {selectedProducts.some(Boolean) && (
          <div className="bg-white border border-outline-variant/40 rounded shadow-sm overflow-hidden">
            <div className="bg-surface-container-lowest border-b border-outline-variant/40 p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-base">analytics</span>
                Detailed Technical Specifications
              </h3>
            </div>
            <div className="divide-y divide-outline-variant/30">
              {/* Form Factor Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 hover:bg-surface-container-lowest/50 transition-colors">
                <div className="p-5 font-bold text-xs uppercase tracking-widest text-on-surface-variant bg-surface-container-lowest/30 md:border-r border-outline-variant/30 flex items-center">
                  Form Factor
                </div>
                {[0, 1, 2].map((slotIndex) => {
                  const p = selectedProducts[slotIndex];
                  return (
                    <div key={slotIndex} className="p-5 text-xs font-semibold text-primary md:border-r last:border-0 border-outline-variant/30 flex items-center justify-center text-center">
                      {p ? p.formFactor || p.category : "—"}
                    </div>
                  );
                })}
              </div>

              {/* Stock Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 hover:bg-surface-container-lowest/50 transition-colors">
                <div className="p-5 font-bold text-xs uppercase tracking-widest text-on-surface-variant bg-surface-container-lowest/30 md:border-r border-outline-variant/30 flex items-center">
                  Availability
                </div>
                {[0, 1, 2].map((slotIndex) => {
                  const p = selectedProducts[slotIndex];
                  return (
                    <div key={slotIndex} className="p-5 text-xs font-semibold md:border-r last:border-0 border-outline-variant/30 flex items-center justify-center text-center">
                      {p ? (
                        p.stock > 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">In Stock ({p.stock} units)</span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">Priority Waitlist Open</span>
                        )
                      ) : (
                        "—"
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Specs Rows */}
              {allSpecLabels.map((specLabel) => (
                <div key={specLabel} className="grid grid-cols-1 md:grid-cols-4 hover:bg-surface-container-lowest/50 transition-colors">
                  <div className="p-5 font-bold text-xs uppercase tracking-widest text-on-surface-variant bg-surface-container-lowest/30 md:border-r border-outline-variant/30 flex items-center">
                    {specLabel}
                  </div>
                  {[0, 1, 2].map((slotIndex) => {
                    const p = selectedProducts[slotIndex];
                    const specObj = p?.specs.find((s) => s.label === specLabel);
                    return (
                      <div key={slotIndex} className="p-5 text-xs text-primary md:border-r last:border-0 border-outline-variant/30 flex items-center justify-center text-center leading-relaxed">
                        {specObj ? specObj.value : "—"}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
