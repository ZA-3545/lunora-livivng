import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { PageShell } from "@/components/layout/PageShell";
import { ShopToolbar } from "@/components/shop/ShopToolbar";
import { getCatalogItems, getCategories, getCategoryBySlug } from "@/lib/catalog";
import type { ShopSort } from "@/lib/types";

export const dynamic = "force-dynamic";

function asSort(value: string | string[] | undefined): ShopSort {
  return value === "price-asc" || value === "price-desc" ? value : "featured";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  return {
    title: category ? `${category.name} — Lunora Living` : "Shop — Lunora Living",
    description: category?.description,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const query = await searchParams;
  const [items, categories] = await Promise.all([
    getCatalogItems({
      category: slug,
      sort: asSort(query.sort),
      bundlesOnly: query.bundles === "1",
    }),
    getCategories(),
  ]);

  return (
    <PageShell>
      <section className="catalog-page">
        <div className="wrap">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/shop">Shop</Link>
            <span>/</span>
            <span>{category.name}</span>
          </nav>
          <div className="page-intro">
            <h1>{category.name}</h1>
            <p>{category.description}</p>
          </div>
          <Suspense>
            <ShopToolbar
              categories={categories}
              currentCategory={category.slug}
            />
          </Suspense>
          <CatalogGrid items={items} />
        </div>
      </section>
    </PageShell>
  );
}
