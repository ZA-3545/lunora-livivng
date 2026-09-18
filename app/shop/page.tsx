import { Suspense } from "react";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { PageShell } from "@/components/layout/PageShell";
import { ShopToolbar } from "@/components/shop/ShopToolbar";
import { getCatalogItems, getCategories } from "@/lib/catalog";
import type { ShopSort } from "@/lib/types";

export const dynamic = "force-dynamic";

function asSort(value: string | string[] | undefined): ShopSort {
  return value === "price-asc" || value === "price-desc" ? value : "featured";
}

export const metadata = {
  title: "Shop — Lunora Living",
  description:
    "Browse curated home décor and room bundles. Cash on Delivery available nationwide.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sort = asSort(params.sort);
  const bundlesOnly = params.bundles === "1";
  const category = typeof params.category === "string" ? params.category : undefined;
  const [items, categories] = await Promise.all([
    getCatalogItems({ category, sort, bundlesOnly }),
    getCategories(),
  ]);

  return (
    <PageShell>
      <section className="catalog-page">
        <div className="wrap">
          <div className="page-intro">
            <h1>Shop the edit</h1>
            <p>
              Singles and bundles for the corner, desk, or bedroom you’re ready
              to fix up. Cash on Delivery available.
            </p>
          </div>
          <Suspense>
            <ShopToolbar categories={categories} />
          </Suspense>
          <CatalogGrid items={items} />
        </div>
      </section>
    </PageShell>
  );
}
