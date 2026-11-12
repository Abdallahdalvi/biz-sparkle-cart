import {
  DEFAULT_ADMIN_PRODUCT_FILTERS,
  type AdminProductFilters,
} from "@/lib/admin-product-filters";

export function ProductFilters({
  filters,
  onChange,
  brands,
  categories,
  total,
  matching,
  filtered,
}: {
  filters: AdminProductFilters;
  onChange: (filters: AdminProductFilters) => void;
  brands: string[];
  categories: { id: string; name: string }[];
  total: number;
  matching: number;
  filtered: boolean;
}) {
  const fieldClass =
    "mt-1 w-full border border-outline-variant/50 bg-white px-3 py-2 text-sm font-normal text-primary";
  return (
    <section aria-label="Product filters" className="space-y-4 bg-white p-4 shopify-border md:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="text-xs font-bold sm:col-span-2">
          Search products
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder="Search name, model, colour or specs…"
            className={fieldClass}
          />
        </label>
        <label className="text-xs font-bold">
          Sort by
          <select
            value={filters.sort}
            onChange={(event) =>
              onChange({ ...filters, sort: event.target.value as AdminProductFilters["sort"] })
            }
            className={fieldClass}
          >
            <option value="store_order">Storefront order</option>
            <option value="price_asc">Price: Low to high</option>
            <option value="price_desc">Price: High to low</option>
            <option value="name">Name: A–Z</option>
            <option value="stock_asc">Stock: Low to high</option>
          </select>
        </label>
        <label className="text-xs font-bold">
          Brand
          <select
            value={filters.brand}
            onChange={(event) => onChange({ ...filters, brand: event.target.value })}
            className={fieldClass}
          >
            <option value="all">All brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold">
          Category
          <select
            value={filters.category}
            onChange={(event) => onChange({ ...filters, category: event.target.value })}
            className={fieldClass}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold">
          Visibility
          <select
            value={filters.status}
            onChange={(event) =>
              onChange({ ...filters, status: event.target.value as AdminProductFilters["status"] })
            }
            className={fieldClass}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
            <option value="draft">Draft / price needed</option>
          </select>
        </label>
        <label className="text-xs font-bold">
          Availability
          <select
            value={filters.availability}
            onChange={(event) =>
              onChange({
                ...filters,
                availability: event.target.value as AdminProductFilters["availability"],
              })
            }
            className={fieldClass}
          >
            <option value="all">All stock</option>
            <option value="in_stock">In stock</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/30 pt-3">
        <p role="status" className="text-xs text-on-surface-variant">
          Showing {matching} of {total} products
        </p>
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_ADMIN_PRODUCT_FILTERS })}
          disabled={!filtered}
          className="border border-outline-variant/50 px-3 py-2 text-xs font-bold disabled:opacity-40"
        >
          Clear filters
        </button>
      </div>
      {filtered && (
        <p className="text-xs text-on-surface-variant">
          Clear filters and use Storefront order to move products with the arrows.
        </p>
      )}
    </section>
  );
}
