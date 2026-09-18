import { ProductCard } from "@/components/catalog/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getBestSellers } from "@/lib/catalog";

export async function BestSellers() {
  const products = await getBestSellers();

  return (
    <section id="best-sellers" className="section">
      <div className="wrap">
        <SectionHeader title="Best sellers" href="/shop" linkLabel="Shop all" />
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
