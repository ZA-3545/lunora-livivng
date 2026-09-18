import { BundleCard } from "@/components/catalog/BundleCard";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { PageShell } from "@/components/layout/PageShell";
import { LifestylePhoto } from "@/components/ui/LifestylePhoto";
import { getGiftingPage } from "@/lib/catalog";
import { getLifestylePhoto } from "@/lib/media/lifestyle";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gifting — Lunora Living",
  description:
    "A considered gift for birthdays, housewarmings, and first apartments — the Gifting Bundle plus candles, frames, and small organizers.",
};

export default async function GiftingPage() {
  const [page, banner] = await Promise.all([
    getGiftingPage(),
    getLifestylePhoto("gifting"),
  ]);

  return (
    <PageShell>
      <section className="catalog-page">
        <div className="wrap">
          <LifestylePhoto photo={banner} className="edit-banner" />
          <div className="page-intro">
            <p className="pdp-kicker">For someone else</p>
            <h1>Gifting</h1>
            {page ? (
              <>
                <p>{page.lede}</p>
                <p>{page.body}</p>
              </>
            ) : (
              <p>Gifts that feel like Lunora — calm, small, and actually usable.</p>
            )}
          </div>

          {page ? (
            <>
              <div className="edit-feature">
                <h2 className="edit-heading">The Gifting Bundle</h2>
                <BundleCard
                  bundle={page.bundle}
                  separateTotal={page.separateTotal}
                  teaser={page.teaser}
                />
              </div>
              <h2 className="edit-heading">Candles, frames, small organizers</h2>
              <CatalogGrid
                items={page.products.map((product) => ({
                  kind: "product" as const,
                  product,
                }))}
              />
            </>
          ) : (
            <p className="catalog-empty">Nothing in this edit yet.</p>
          )}
        </div>
      </section>
    </PageShell>
  );
}
