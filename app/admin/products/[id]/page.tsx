import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdminPage } from "@/lib/admin/guard";
import { getAdminProduct } from "@/lib/admin/db";
import { getCategories } from "@/lib/catalog";
import { mapProduct } from "@/lib/db/mappers";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const [row, categories] = await Promise.all([
    getAdminProduct(id),
    getCategories(),
  ]);
  if (!row) notFound();

  return (
    <>
      <h1>Edit product</h1>
      <ProductForm product={mapProduct(row)} categories={categories} />
    </>
  );
}
