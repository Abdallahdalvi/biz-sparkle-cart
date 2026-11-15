import {
  matchesQuickShopCategory,
  PHONE_TYPE_OPTIONS,
  type PhoneType,
  type QuickShopProduct,
} from "@/lib/quick-shop-categories";

export function PhoneTypeFilters({
  products,
  value,
  onChange,
}: {
  products: QuickShopProduct[];
  value: PhoneType | "all";
  onChange: (value: PhoneType | "all") => void;
}) {
  const phones = products.filter((product) => product.category === "phones");
  const options = [
    { key: "all" as const, label: "All Phones", icon: "apps", count: phones.length },
    ...PHONE_TYPE_OPTIONS.map((option) => ({
      ...option,
      count: phones.filter((product) => matchesQuickShopCategory(product, option.key)).length,
    })),
  ];
  return (
    <div
      role="group"
      aria-label="Filter by phone type"
      className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
    >
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={value === option.key}
          onClick={() => onChange(option.key)}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:justify-start sm:px-4 sm:text-sm ${option.key === "all" ? "col-span-2" : ""} ${value === option.key ? "border-primary bg-primary text-on-primary shadow-sm" : "border-outline-variant bg-white text-primary hover:border-primary"}`}
        >
          <span className="material-symbols-outlined shrink-0 text-lg" aria-hidden="true">
            {option.icon}
          </span>
          <span>{option.label}</span>
          <span className="text-xs opacity-70" aria-hidden="true">
            {option.count}
          </span>
        </button>
      ))}
    </div>
  );
}
