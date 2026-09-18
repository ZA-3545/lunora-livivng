import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/ProductCard";
import { PageShell } from "@/components/layout/PageShell";
import { ProductGallery } from "@/components/pdp/ProductGallery";
import { PurchaseRow } from "@/components/pdp/PurchaseRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  getBundleBySlug,
  getBundleComponents,
  getBundleSeparateTotal,
  getRelatedProducts,
} from "@/lib/catalog";
import { formatPkr } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bundle = await getBundleBySlug(slug);
  return {
    title: bundle ? `${bundle.name} — Lunora Living` : "Bundle — Lunora Living",
    description: bundle?.description,
  };
}

export default async function BundlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bundle = await getBundleBySlug(slug);
  if (!bundle) notFound();

  const [components, separateTotal] = await Promise.all([
    getBundleComponents(bundle.id),
    getBundleSeparateTotal(bundle.id),
  ]);
  const related = components[0]
    ? await getRelatedProducts(components[0].product, 4)
    : [];
  const gallery = [
    bundle.image,
    ...components.map(({ product }) => product.images[0]),
  ].slice(0, 4);

  return (
    <PageShell>
      <article className="pdp">
        <div className="wrap">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/shop">Shop</Link>
            <span>/</span>
            <Link href="/shop?bundles=1">Bundles</Link>
            <span>/</span>
            <span>{bundle.name}</span>
          </nav>

          <div className="pdp-layout">
            <ProductGallery name={bundle.name} images={gallery} />
            <div>
              <p className="pdp-kicker">Bundle</p>
              <h1>{bundle.name}</h1>
              <div className="pdp-price">
                <span className="now">{formatPkr(bundle.bundlePrice)}</span>
              </div>
              <p className="pdp-compare">
                Buy separately: {formatPkr(separateTotal)} · Bundle price:{" "}
                <strong>{formatPkr(bundle.bundlePrice)}</strong>
              </p>
              <p className="pdp-short">{bundle.description}</p>
              <PurchaseRow
                bundleId={bundle.id}
                name={bundle.name}
                slug={bundle.slug}
                image={bundle.image}
                unitPrice={bundle.bundlePrice}
                label="Add Bundle to Cart"
              />

              <div className="bundle-components">
                <h2>In this bundle</h2>
                {components.map(({ product, quantity }) => (
                  <div key={product.id} className="bundle-component">
                    <Link href={`/product/${product.slug}`}>
                      {quantity > 1 ? `${quantity} × ` : ""}
                      {product.name}
                    </Link>
                    <span className="now">{formatPkr(product.price * quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {related.length > 0 ? (
            <section className="related">
              <SectionHeader title="You might also like" />
              <div className="product-grid">
                {related.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </article>
    </PageShell>
  );
}
