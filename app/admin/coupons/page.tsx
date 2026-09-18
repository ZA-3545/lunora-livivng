import Link from "next/link";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { requireAdminPage } from "@/lib/admin/guard";
import { listAdminCoupons } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  await requireAdminPage();
  const coupons = await listAdminCoupons();

  return (
    <>
      <div className="admin-toolbar">
        <h1>Coupons</h1>
        <Link className="admin-btn" href="/admin/coupons/new">
          Add coupon
        </Link>
      </div>
      <p className="admin-note">
        Storefront cart and checkout validate these codes against expiry,
        minimum order, and usage. Each successful order writes a
        coupon_redemptions row.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Min order</th>
              <th>Expiry</th>
              <th>Limit</th>
              <th>Used</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={8}>No coupons yet.</td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>
                    <Link href={`/admin/coupons/${coupon.id}`}>{coupon.code}</Link>
                  </td>
                  <td>{coupon.discount_type}</td>
                  <td>{coupon.discount_value}</td>
                  <td>{coupon.min_order_value}</td>
                  <td>
                    {coupon.expiry_date
                      ? String(coupon.expiry_date).slice(0, 10)
                      : "—"}
                  </td>
                  <td>{coupon.usage_limit ?? "—"}</td>
                  <td>{coupon.redemptions ?? 0}</td>
                  <td>
                    <DeleteButton action={`/api/admin/coupons/${coupon.id}`} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
