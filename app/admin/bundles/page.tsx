import Link from "next/link";
import { BundleList } from "@/components/admin/BundleList";
import { requireAdminPage } from "@/lib/admin/guard";
import { listAdminBundles } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

export default async function AdminBundlesPage() {
  await requireAdminPage();
  const bundles = await listAdminBundles();

  return (
    <>
      <div className="admin-toolbar">
        <h1>Bundles</h1>
        <Link className="admin-btn" href="/admin/bundles/new">
          Add bundle
        </Link>
      </div>
      <BundleList
        bundles={bundles.map((bundle) => ({
          id: bundle.id,
          name: bundle.name,
          slug: bundle.slug,
          bundle_price: Number(bundle.bundle_price),
          items: (bundle.items as Array<{ name: string; quantity: number }>).map(
            (item) => ({
              name: item.name,
              quantity: Number(item.quantity),
            }),
          ),
        }))}
      />
    </>
  );
}
