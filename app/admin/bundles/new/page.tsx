import { BundleForm } from "@/components/admin/BundleForm";
import { requireAdminPage } from "@/lib/admin/guard";
import { listAllProducts } from "@/lib/admin/db";
import { mapProduct } from "@/lib/db/mappers";

export const dynamic = "force-dynamic";

export default async function NewBundlePage() {
  await requireAdminPage();
  const products = (await listAllProducts()).map(mapProduct);
  return (
    <>
      <h1>Add bundle</h1>
      <BundleForm products={products} />
    </>
  );
}
