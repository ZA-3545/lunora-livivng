import Link from "next/link";
import { ProductList } from "@/components/admin/ProductList";
import { requireAdminPage } from "@/lib/admin/guard";
import { listAdminProducts } from "@/lib/admin/db";
import { getCategories } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdminPage();
  const [products, categories] = await Promise.all([
    listAdminProducts(),
    getCategories(),
  ]);

  return (
    <>
      <div className="admin-toolbar">
        <h1>Products</h1>
        <Link className="admin-btn" href="/admin/products/new">
          Add product
        </Link>
      </div>
      <ProductList
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          category_id: product.category_id,
          category_name: product.category_name,
          price: Number(product.price),
          stock_qty: Number(product.stock_qty),
          status: product.status,
        }))}
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
      />
    </>
  );
}
