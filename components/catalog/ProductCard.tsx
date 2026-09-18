import Link from "next/link";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { CatalogMedia } from "@/components/ui/ComingSoonMedia";
import { formatPkr } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="p-card">
      <div className="card-save">
        <WishlistButton kind="product" slug={product.slug} name={product.name} />
      </div>
      <Link href={`/product/${product.slug}`} className="card-link">
        <CatalogMedia
          className="p-img"
          src={product.images[0]}
          name={product.name}
        />
        <h4>{product.name}</h4>
        <div className="now">{formatPkr(product.price)}</div>
      </Link>
    </article>
  );
}
