import { BundleCard } from "@/components/catalog/BundleCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  getBundleSeparateTotal,
  getBundleTeaser,
  getFeaturedBundles,
} from "@/lib/catalog";

export async function Bundles() {
  const bundles = await getFeaturedBundles();
  const cards = await Promise.all(
    bundles.map(async (bundle) => ({
      bundle,
      separateTotal: await getBundleSeparateTotal(bundle.id),
      teaser: await getBundleTeaser(bundle.id),
    })),
  );

  return (
    <section id="bundles" className="section">
      <div className="wrap">
        <SectionHeader
          title="Bundles"
          href="/shop?bundles=1"
          linkLabel="All bundles"
        />
        <div className="bundle-grid">
          {cards.map(({ bundle, separateTotal, teaser }) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              separateTotal={separateTotal}
              teaser={teaser}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
