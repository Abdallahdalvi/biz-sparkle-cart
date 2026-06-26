# Mobile Layout, UI/UX Spacing & Shape Retention Rule for Antigravity AI

## 🚨 CRITICAL RULE FOR ALL FUTURE TURNS AND CONVERSATIONS

The user has explicitly mandated that across the homepage (`src/routes/index.tsx`) and any similar feature/landing pages, three fundamental layout, UI/UX, and aspect-ratio rules must be strictly adhered to:

1. **CTA Button Position**: All Call-To-Action (CTA) buttons must appear **BELOW** the image sections in mobile view.
2. **Perfect Symmetrical Spacing**: The vertical gap between the top text description and the image section MUST be the exact same height as the vertical gap between the image section and the mobile CTA button below it.
3. **Flawless Shape Retention (Perfect Squares)**: Grid items (such as the right hero image and the WhatsApp box) MUST retain their exact original desktop shape (perfect squares) across ALL mobile phone screens, without distorting or stretching.

---

### 📱 Why this rule exists & Common CSS Pitfalls
- **Margin Collapse & Hidden Elements**: In Tailwind CSS, `space-y-6` adds `margin-top: 1.5rem` (`24px`) to all child elements after the first. When a desktop CTA button has `hidden lg:block` inside a `space-y-6` container, `margin-top: 1.5rem` is still applied to the hidden element in mobile view. Combined with parent grid gaps (`gap-4` or `gap-6`), this creates a massive 40px+ empty void above the image section, ruining the visual balance.
- **Fixed Height Grid Distortion**: Using a fixed height like `h-[380px] sm:h-[500px]` on a 2-column CSS grid causes the aspect ratio of the child items to distort on different phone widths. When screen width shrinks, the width of grid items shrinks while the height remains fixed, turning intended squares into tall rectangles. Furthermore, text wrapping inside boxes (like the WhatsApp button) forces rows to expand and shrink neighboring images.

---

### ✅ Mandatory Implementation Pattern
To ensure perfectly symmetrical 24px spacing and uncompromised shape retention on every screen, you **MUST** use the following responsive pattern with pure Flexbox `gap-6` and `aspect-square`:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 items-center">
  {/* Column 1: Text Content & Desktop Button (flex flex-col gap-6 instead of space-y-6) */}
  <div className="flex flex-col gap-6">
    <div>
      <span className="...">LIMITED RELEASE ENGINE</span>
    </div>
    <h1>Title</h1>
    <p>Description</p>
    {/* Desktop Button: hidden on mobile, visible on desktop */}
    <div className="pt-2 hidden lg:block">
      <Link to="/catalog" className="inline-flex ...">VIEW CATALOG</Link>
    </div>
  </div>

  {/* Column 2: Images & Mobile Button (flex flex-col gap-6) */}
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
- **DO NOT** use fixed heights like `h-[380px]` or `h-[500px]` on multi-row grid showcases. Always use `aspect-square` on stacked items and `absolute inset-0 w-full h-full` on spanning items.
- **DO NOT** use `space-y-*` wrapper classes on containers that hold hidden responsive elements (like desktop buttons). Always use `flex flex-col gap-*`.
- **DO NOT** add extra margins like `pt-2` above mobile CTA buttons when using `flex flex-col gap-6`. Let the Flexbox gap manage the spacing so it remains perfectly equal to the top gap.
- **DO NOT** place buttons above images in mobile views on any landing or feature section.
- **DO NOT** alter this layout structure in future turns or sessions unless explicitly requested by the user.
