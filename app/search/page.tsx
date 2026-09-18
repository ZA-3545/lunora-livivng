import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { PageShell } from "@/components/layout/PageShell";
import { searchCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search — Lunora Living",
  description: "Search Lunora Living products and room bundles.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const trimmed = query.trim();
  const items = trimmed ? await searchCatalog(trimmed) : [];

  return (
    <PageShell>
      <section className="catalog-page">
        <div className="wrap">
          <div className="page-intro">
            <h1>Search</h1>
            <p>Look through singles and bundles by name.</p>
          </div>

          <form className="search-form" action="/search" method="get">
            <label className="sr-only" htmlFor="search-q">
              Search products and bundles
            </label>
            <input
              id="search-q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Fairy lights, cozy bundle…"
              autoFocus
            />
            <button type="submit" className="btn">
              Search
            </button>
          </form>

          {!trimmed ? (
            <p className="catalog-empty">
              Type a product or bundle name to search the catalog.
            </p>
          ) : items.length === 0 ? (
            <p className="catalog-empty">
              Nothing matched “{trimmed}”. Try another word — lights, candle,
              desk, or bundle.
            </p>
          ) : (
            <CatalogGrid items={items} />
          )}
        </div>
      </section>
    </PageShell>
  );
}
