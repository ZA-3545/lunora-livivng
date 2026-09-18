import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdminPage } from "@/lib/admin/guard";
import { getCategories } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdminPage();
  const categories = await getCategories();
  return (
    <>
      <h1>Add product</h1>
      <ProductForm categories={categories} />
    </>
  );
}
