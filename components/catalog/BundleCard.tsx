import Link from "next/link";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { CatalogMedia } from "@/components/ui/ComingSoonMedia";
import { formatPkr } from "@/lib/format";
import type { Bundle } from "@/lib/types";

export function BundleCard({
  bundle,
  separateTotal,
  teaser,
}: {
  bundle: Bundle;
  separateTotal: number;
  teaser: string;
}) {
  return (
    <article className="bundle-card">
      <div className="card-save">
        <WishlistButton kind="bundle" slug={bundle.slug} name={bundle.name} />
      </div>
      <Link href={`/bundle/${bundle.slug}`} className="card-link">
        <div className="bundle-img-wrap">
          <CatalogMedia
            className="bundle-img"
            src={bundle.image}
            name={bundle.name}
          />
          <span className="bundle-flag">Bundle</span>
        </div>
        <div className="bundle-body">
          <h3>{bundle.name}</h3>
          <p>{teaser}</p>
          <div className="price-row">
            <span className="was">{formatPkr(separateTotal)}</span>
            <span className="now">{formatPkr(bundle.bundlePrice)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
