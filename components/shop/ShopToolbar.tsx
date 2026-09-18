"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Category, ShopSort } from "@/lib/types";

export function ShopToolbar({
  categories,
  currentCategory,
  hideCategorySelect = false,
}: {
  categories: Category[];
  currentCategory?: string;
  hideCategorySelect?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = (searchParams.get("sort") ?? "featured") as ShopSort;
  const bundlesOnly = searchParams.get("bundles") === "1";
  const category = currentCategory ?? searchParams.get("category") ?? "";

  function update(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function onCategoryChange(slug: string) {
    if (hideCategorySelect) return;
    if (!slug) {
      router.push(buildShopHref(sort, bundlesOnly));
      return;
    }
    router.push(`/shop/${slug}${shopQuery(sort, bundlesOnly)}`);
  }

  return (
    <form className="shop-toolbar" onSubmit={(event) => event.preventDefault()}>
      {hideCategorySelect ? null : (
        <label className="shop-control">
          <span>Category</span>
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="">All</option>
            {categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="shop-control">
        <span>Price</span>
        <select
          value={sort}
          onChange={(event) =>
            update({ sort: event.target.value === "featured" ? null : event.target.value })
          }
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Low to high</option>
          <option value="price-desc">High to low</option>
        </select>
      </label>

      <label className="shop-toggle">
        <input
          type="checkbox"
          checked={bundlesOnly}
          onChange={(event) =>
            update({ bundles: event.target.checked ? "1" : null })
          }
        />
        Bundles only
      </label>
    </form>
  );
}

function shopQuery(sort: ShopSort, bundlesOnly: boolean) {
  const params = new URLSearchParams();
  if (sort !== "featured") params.set("sort", sort);
  if (bundlesOnly) params.set("bundles", "1");
  const query = params.toString();
  return query ? `?${query}` : "";
}

function buildShopHref(sort: ShopSort, bundlesOnly: boolean) {
  return `/shop${shopQuery(sort, bundlesOnly)}`;
}
