import { BundleCard } from "@/components/catalog/BundleCard";
import { ProductCard } from "@/components/catalog/ProductCard";
import type { CatalogItem } from "@/lib/types";

export function CatalogGrid({ items }: { items: CatalogItem[] }) {
  if (items.length === 0) {
    return <p className="catalog-empty">Nothing in this edit yet.</p>;
  }

  return (
    <div className="catalog-grid">
      {items.map((item) =>
        item.kind === "bundle" ? (
          <BundleCard
            key={`bundle-${item.bundle.id}`}
            bundle={item.bundle}
            separateTotal={item.separateTotal}
            teaser={item.teaser}
          />
        ) : (
          <ProductCard key={`product-${item.product.id}`} product={item.product} />
        ),
      )}
    </div>
  );
}
