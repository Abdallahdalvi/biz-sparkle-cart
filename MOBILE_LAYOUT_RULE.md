# Master Layout, Apple/Samsung Typography Hierarchy & Shape Retention Rule for Antigravity AI

## 🚨 CRITICAL RULE FOR ALL FUTURE TURNS AND CONVERSATIONS

The user has explicitly mandated that across the homepage (`src/routes/index.tsx`) and any similar feature/landing pages, four fundamental layout, UI/UX, typography spacing, and aspect-ratio rules must be strictly adhered to:

1. **Apple/Samsung Premium Desktop Typography Hierarchy**: On desktop screens, the spacing between badges, titles, descriptions, and CTA buttons must follow tight, cohesive editorial groupings. **DO NOT** use blanket `gap-6` or `gap-8` on flex text columns, as this creates massive, disjointed 32px+ gaps above buttons.
2. **CTA Button Position**: All Call-To-Action (CTA) buttons must appear **BELOW** the image sections in mobile view.
3. **Perfect Symmetrical Mobile Spacing**: The vertical gap between the top text description and the image section MUST be the exact same height as the vertical gap between the image section and the mobile CTA button below it (exactly 24px / `1.5rem`).
4. **Flawless Shape Retention (Perfect Squares)**: Grid items (such as the right hero image and the WhatsApp box) MUST retain their exact original desktop shape (perfect squares) across ALL mobile phone screens, without distorting or stretching.

---

### 📱 Why this rule exists & Common CSS Pitfalls
- **The Flaw of Flex `gap-6` in Text Columns**: Putting `flex flex-col gap-6` on a column containing text and buttons forces a massive 24px gap between every single element. When combined with button wrapper padding (`pt-2`), the CTA button hangs 32px below the paragraph, creating a cheap, disjointed layout that directly violates Apple/Samsung premium design standards.
- **Fixed Height Grid Distortion**: Using a fixed height like `h-[380px] sm:h-[500px]` on a 2-column CSS grid causes the aspect ratio of the child items to distort on different phone widths. When screen width shrinks, the width of grid items shrinks while the height remains fixed, turning intended squares into tall rectangles.

---

### ✅ Mandatory Implementation Pattern
To achieve premium Apple/Samsung desktop typography spacing while preserving perfectly symmetrical 24px mobile gaps and uncompromised shape retention, you **MUST** use the following responsive pattern:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-16 items-center">
  {/* Column 1: Text Content & Desktop Button (flex flex-col with explicit mb-* margins) */}
  <div className="flex flex-col">
    <div className="mb-3">
      <span className="...">LIMITED RELEASE ENGINE</span>
    </div>
    <h1 className="... mb-4">Title</h1>
    <p className="... mb-6">Description</p>
    {/* Desktop Button: hidden on mobile, visible on desktop (NO pt-2 margin, perfectly connected to text) */}
    <div className="hidden lg:block">
      <Link to="/catalog" className="inline-flex ...">VIEW CATALOG</Link>
    </div>
  </div>

  {/* Column 2: Images & Mobile Button (flex flex-col gap-6) */}
  {/* On mobile, parent gap-0 + p's mb-6 produces exactly 24px gap above images. */}
  {/* Inside Column 2, flex gap-6 produces exactly 24px gap between images and mobile button. */}
  <div className="flex flex-col gap-6">
    {/* Image Showcase Grid: Scales purely by aspect ratio, NO fixed heights */}
    <div className="grid grid-cols-2 gap-4 w-full">
      {/* Left Column: Image stretches to match right column height perfectly */}
      <a href="..." className="relative overflow-hidden shopify-border group shadow-sm block w-full h-full min-h-[340px] sm:min-h-[460px]">
        <img src="..." alt="..." className="object-cover w-full h-full absolute inset-0" />
      </a>
      {/* Right Column: Two stacked perfect squares */}
      <div className="flex flex-col gap-4 w-full">
        <a href="..." className="relative overflow-hidden shopify-border group shadow-sm block w-full aspect-square">
          <img src="..." alt="..." className="object-cover w-full h-full absolute inset-0" />
        </a>
        <a href="..." className="relative border-2 border-emerald-500 bg-white flex flex-col justify-center items-center text-center p-3 sm:p-4 shadow-sm w-full aspect-square overflow-hidden block">
          {/* Content with flex-shrink-0 and line-clamp to prevent box expansion */}
          <svg className="... flex-shrink-0" />
          <p className="... line-clamp-2">UPDATES ON WHATSAPP</p>
        </a>
      </div>
    </div>
    {/* Mobile Button: visible on mobile, hidden on desktop (NO pt-2 margin, driven purely by gap-6) */}
    <div className="block lg:hidden w-full">
      <Link to="/catalog" className="flex justify-center w-full text-center ...">VIEW CATALOG</Link>
    </div>
  </div>
</div>
```

---

### 🚫 Prohibited Actions
- **DO NOT** use `flex flex-col gap-*` or `space-y-*` wrapper classes on text columns. Always use explicit `mb-3`, `mb-4`, `mb-6` margins to maintain Apple/Samsung typography hierarchy.
- **DO NOT** use fixed heights like `h-[380px]` or `h-[500px]` on multi-row grid showcases. Always use `aspect-square` on stacked items and `absolute inset-0 w-full h-full` on spanning items.
- **DO NOT** add extra margins like `pt-2` above desktop or mobile CTA buttons. Let `mb-6` and `gap-6` manage the exact 24px spacing.
- **DO NOT** place buttons above images in mobile views on any landing or feature section.
- **DO NOT** alter this layout structure in future turns or sessions unless explicitly requested by the user.
