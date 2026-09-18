import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/ProductCard";
import { PageShell } from "@/components/layout/PageShell";
import { ProductGallery } from "@/components/pdp/ProductGallery";
import { PurchaseRow } from "@/components/pdp/PurchaseRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  getCategoryById,
  getProductBySlug,
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
  const product = await getProductBySlug(slug);
  return {
    title: product ? `${product.name} — Lunora Living` : "Product — Lunora Living",
    description: product?.shortDescription,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, related] = await Promise.all([
    getCategoryById(product.categoryId),
    getRelatedProducts(product, 4),
  ]);

  return (
    <PageShell>
      <article className="pdp">
        <div className="wrap">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/shop">Shop</Link>
            <span>/</span>
            {category ? (
              <>
                <Link href={`/shop/${category.slug}`}>{category.name}</Link>
                <span>/</span>
              </>
            ) : null}
            <span>{product.name}</span>
          </nav>

          <div className="pdp-layout">
            <ProductGallery name={product.name} images={product.images} />
            <div>
              {category ? (
                <p className="pdp-kicker">
                  <Link href={`/shop/${category.slug}`}>{category.name}</Link>
                </p>
              ) : null}
              <h1>{product.name}</h1>
              <div className="pdp-price">
                <span className="now">{formatPkr(product.price)}</span>
              </div>
              <p className="pdp-short">{product.shortDescription}</p>
              <PurchaseRow
                productId={product.id}
                name={product.name}
                slug={product.slug}
                image={product.images[0] ?? ""}
                unitPrice={product.price}
              />
              <p className="pdp-long">{product.description}</p>
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
