import { notFound } from "next/navigation";
import { BundleForm } from "@/components/admin/BundleForm";
import { requireAdminPage } from "@/lib/admin/guard";
import { getAdminBundle, listAllProducts } from "@/lib/admin/db";
import { mapBundle, mapProduct } from "@/lib/db/mappers";

export const dynamic = "force-dynamic";

export default async function EditBundlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const [row, productRows] = await Promise.all([
    getAdminBundle(id),
    listAllProducts(),
  ]);
  const products = productRows.map(mapProduct);
  if (!row) notFound();

  return (
    <>
      <h1>Edit bundle</h1>
      <BundleForm
        bundle={mapBundle(row)}
        items={row.items.map((item: { id: string; product_id: string; quantity: number }) => ({
          id: item.id,
          bundleId: id,
          productId: item.product_id,
          quantity: Number(item.quantity),
        }))}
        products={products}
      />
    </>
  );
}
