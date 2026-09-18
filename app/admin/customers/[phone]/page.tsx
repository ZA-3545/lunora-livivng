import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/guard";
import { getAdminCustomer } from "@/lib/admin/db";
import { formatPkr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  await requireAdminPage();
  const { phone } = await params;
  const digits = phone.replace(/\D/g, "");
  const orders = await getAdminCustomer(digits);
  if (orders.length === 0) notFound();

  return (
    <>
      <h1>{orders[0].shipping_name}</h1>
      <p className="admin-lead">{orders[0].shipping_phone}</p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Total</th>
              <th>Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/admin/orders/${order.id}`}>{order.order_number}</Link>
                </td>
                <td>{order.status}</td>
                <td>{formatPkr(Number(order.total))}</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
