# Mobile Layout & UI/UX Spacing Rule for Antigravity AI

## 🚨 CRITICAL RULE FOR ALL FUTURE TURNS AND CONVERSATIONS

The user has explicitly mandated that across the homepage (`src/routes/index.tsx`) and any similar feature/landing pages, two fundamental layout and UI/UX rules must be strictly adhered to:

1. **CTA Button Position**: All Call-To-Action (CTA) buttons must appear **BELOW** the image sections in mobile view.
2. **Perfect Symmetrical Spacing**: The vertical gap between the top text description and the image section MUST be the exact same height as the vertical gap between the image section and the mobile CTA button below it.

---

### 📱 Why this rule exists & The Flaw of `space-y-*`
- **Margin Collapse & Hidden Elements**: In Tailwind CSS, `space-y-6` adds `margin-top: 1.5rem` (`24px`) to all child elements after the first. When a desktop CTA button has `hidden lg:block` inside a `space-y-6` container, `margin-top: 1.5rem` is still applied to the hidden element in mobile view. Combined with parent grid gaps (`gap-4` or `gap-6`), this creates a massive 40px+ empty void above the image section, ruining the visual balance.
- **Pure Flexbox Symmetry**: By replacing `space-y-*` with `flex flex-col gap-6`, Flexbox completely ignores `display: none` (`hidden`) children on mobile. Using `gap-6` on the parent grid, `gap-6` on the text column, and `gap-6` on the image column ensures every single vertical gap across the layout is exactly 24px (1.5rem).

---

### ✅ Mandatory Implementation Pattern
To ensure perfectly symmetrical 24px spacing on mobile while preserving spacious desktop layouts, you **MUST** use the following dual-button responsive pattern with pure Flexbox `gap-6`:

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

  {/* Column 2: Images & Mobile Button (flex flex-col gap-6 instead of space-y-4) */}
  <div className="flex flex-col gap-6">
    <div className="grid grid-cols-2 gap-4">
      <img src="..." alt="..." />
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
- **DO NOT** use `space-y-*` wrapper classes on containers that hold hidden responsive elements (like desktop buttons). Always use `flex flex-col gap-*`.
- **DO NOT** add extra margins like `pt-2` above mobile CTA buttons when using `flex flex-col gap-6`. Let the Flexbox gap manage the spacing so it remains perfectly equal to the top gap.
- **DO NOT** place buttons above images in mobile views on any landing or feature section.
- **DO NOT** alter this layout structure in future turns or sessions unless explicitly requested by the user.
