import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { ProductCard } from "@/components/ProductCard";
import { CookieBanner } from "@/components/CookieBanner";
import { PRODUCTS, productsByCategory } from "@/lib/products";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TECHLAB — The Niche Tech Revolution" },
      { name: "description", content: "Boutique keypad Androids, transparent audio, and minimalist daily drivers. Shipped across India." },
      { property: "og:title", content: "TECHLAB — The Niche Tech Revolution" },
      { property: "og:description", content: "Boutique keypad Androids, transparent audio, and minimalist daily drivers." },
      { property: "og:image", content: PRODUCTS[0].images[0] },
      { name: "twitter:image", content: PRODUCTS[0].images[0] },
    ],
  }),
  component: Index,
});

function Index() {
  const trending = PRODUCTS.slice(0, 3);
  const keypads = productsByCategory("phones").slice(0, 2);
  const drivers = PRODUCTS.slice(3, 7);
  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative bg-surface-container-low overflow-hidden border-b border-outline-variant/20">
        <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto py-xl md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-lg items-center">
          <div className="space-y-lg">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary border border-primary px-2 py-1 rounded-sm inline-block">
              LIMITED RELEASE ENGINE
            </span>
            <h1 className="text-4xl md:text-6xl text-primary leading-tight font-bold">
              The Niche Tech Revolution
            </h1>
            <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed">
              Engineering the return of tactile precision. Experience the Qin F22 Pro and Blackberry Android hybrids — where modern power meets the unboxing thrill of classic hardware.
            </p>
            <div className="flex flex-wrap gap-md pt-sm">
              <Link to="/catalog" className="bg-primary text-on-primary px-10 py-4 rounded-none font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2">
                EXPLORE THE LAB <span className="material-symbols-outlined text-base">trending_flat</span>
              </Link>
              <Link to="/catalog" className="border border-outline text-primary px-10 py-4 rounded-none font-bold text-sm uppercase tracking-widest hover:bg-surface-container transition-all">
                VIEW CATALOG
              </Link>
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-md h-[500px]">
            <Link to="/product/$slug" params={{ slug: "qin-f22-pro" }} className="relative overflow-hidden shopify-border group h-full">
              <img className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105" src={PRODUCTS[0].images[0]} alt="Qin F22 Pro" />
              <div className="absolute bottom-4 left-4 glass-panel px-3 py-1">
                <p className="text-[10px] font-bold tracking-widest text-primary uppercase">QIN F22 PRO</p>
              </div>
            </Link>
            <div className="grid grid-rows-2 gap-md h-full">
              <Link to="/product/$slug" params={{ slug: "qin-f22-pro" }} className="relative overflow-hidden shopify-border group">
                <img className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105" src={PRODUCTS[0].images[1] ?? PRODUCTS[0].images[0]} alt="Keyboard hybrid" />
                <div className="absolute bottom-4 left-4 glass-panel px-3 py-1">
                  <p className="text-[10px] font-bold tracking-widest text-primary uppercase">KEYBOARD HYBRID</p>
                </div>
              </Link>
              <div className="relative shopify-border bg-white flex flex-col justify-center items-center text-center p-md">
                <div className="material-symbols-outlined text-primary text-3xl mb-2">box_add</div>
                <p className="font-bold text-lg uppercase tracking-tight">WEEKLY DROPS</p>
                <p className="text-[11px] font-bold text-on-surface-variant tracking-widest uppercase">JOIN THE WAITLIST</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="py-20 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl text-primary mb-2 font-bold">Trending Gadgets</h2>
            <p className="text-on-surface-variant uppercase tracking-widest text-[11px] font-bold">Viral tech, precision tested.</p>
          </div>
          <Link to="/catalog" className="text-[11px] font-bold text-primary tracking-widest flex items-center gap-1 hover:underline underline-offset-4">
            SEE ALL <span className="material-symbols-outlined text-sm">arrow_outward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trending.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      {/* Keypad Android Collection */}
      <section className="bg-white py-24 border-y border-outline-variant/30">
        <div className="px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto flex flex-col md:flex-row items-center gap-20">
          <div className="w-full md:w-1/2 space-y-lg">
            <h2 className="text-4xl text-primary font-bold">Keypad Android Collection</h2>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Ditch the glass slab. Our curated collection of keypad-driven Android devices offers full app support with physical feedback that touchscreens can't match.
            </p>
            <ul className="space-y-sm text-[13px] font-bold uppercase tracking-wider text-primary">
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-base">check_circle</span> Full Google Play Support</li>
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-base">check_circle</span> Tactile QWERTY & T9 Options</li>
              <li className="flex items-center gap-3"><span className="material-symbols-outlined text-base">check_circle</span> Privacy-Hardened Firmware</li>
            </ul>
            <Link to="/catalog" className="inline-block bg-primary text-on-primary px-10 py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all">
              SHOP THE KEYPADS
            </Link>
          </div>
          <div className="w-full md:w-1/2 grid grid-cols-2 gap-md">
            {keypads.map((p, i) => (
              <Link key={p.slug} to="/product/$slug" params={{ slug: p.slug }} className={"aspect-[4/5] bg-surface-container-low shopify-border overflow-hidden " + (i === 1 ? "mt-xl" : "")}>
                <img className="object-cover w-full h-full" src={p.images[0]} alt={p.name} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Minimalist Daily Drivers */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl text-primary mb-2 uppercase tracking-tight font-bold">Minimalist Daily Drivers</h2>
          <p className="text-on-surface-variant uppercase tracking-widest text-[11px] font-bold">Focus by design. Tools, not toys.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {drivers.map((p) => (
            <Link key={p.slug} to="/product/$slug" params={{ slug: p.slug }} className="bg-white shopify-border p-5 group hover:shopify-shadow transition-all">
              <div className="aspect-square mb-6 overflow-hidden shopify-border bg-surface-container-low">
                <img className="object-cover w-full h-full group-hover:scale-105 transition-transform" src={p.images[0]} alt={p.name} />
              </div>
              <h4 className="font-bold text-center text-sm uppercase tracking-tight mb-1">{p.name}</h4>
              <p className="text-[10px] font-bold text-on-surface-variant text-center uppercase tracking-widest mb-3">{p.tagline}</p>
              <p className="text-primary text-center font-bold text-base">{formatINR(p.pricePaise)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
        <div className="bg-white shopify-border p-margin-desktop flex flex-col md:flex-row justify-between items-center gap-lg relative overflow-hidden">
          <div className="relative z-10 max-w-md text-center md:text-left">
            <h2 className="text-3xl text-primary mb-4 font-bold">Join the TechLab Alpha</h2>
            <p className="text-on-surface-variant uppercase tracking-widest text-[11px] font-bold opacity-80">
              Be the first to know about new boutique drops and hardware prototypes. No spam, just specs.
            </p>
          </div>
          <form
            className="relative z-10 w-full md:w-auto flex gap-0"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thanks — you're on the waitlist.");
              (e.currentTarget as HTMLFormElement).reset();
            }}
          >
            <input
              required
              type="email"
              placeholder="ENTER YOUR EMAIL"
              className="bg-surface-container-low border border-outline-variant/30 px-6 py-4 placeholder:text-on-surface-variant/50 font-medium text-sm w-full md:w-80 focus:outline-none focus:border-primary transition-colors"
            />
            <button className="bg-primary text-on-primary px-8 py-4 font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all">SUBMIT</button>
          </form>
        </div>
      </section>

      <CookieBanner />
    </SiteShell>
  );
}
