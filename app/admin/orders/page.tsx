import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/guard";
import { listAdminOrders } from "@/lib/admin/db";
import { formatPkr } from "@/lib/format";
import { shipmentStatusLabel } from "@/lib/couriers/copy";
import { paymentStatusLabel } from "@/lib/payments/copy";
import type { PaymentStatus, ShipmentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdminPage();
  const orders = await listAdminOrders();

  return (
    <>
      <h1>Orders</h1>
      <p className="admin-lead">
        Same `orders` table the customer track-order page reads. Paid orders
        flagged Needs review require a manual refund or restock decision.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Shipment</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7}>No orders yet.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className={
                    order.status === "needs_review" ? "admin-row-flag" : undefined
                  }
                >
                  <td>
                    <Link href={`/admin/orders/${order.id}`}>
                      {order.order_number}
                    </Link>
                    {order.status === "needs_review" ? (
                      <span className="admin-pill">Needs review</span>
                    ) : null}
                  </td>
                  <td>{order.status}</td>
                  <td>
                    {paymentStatusLabel(
                      (order.payment_status ?? "pending_collection") as PaymentStatus,
                    )}
                  </td>
                  <td>
                    {order.tracking_number ? (
                      <>
                        {order.tracking_number}
                        <div>
                          {shipmentStatusLabel(
                            (order.shipment_status ?? "pending") as ShipmentStatus,
                          )}
                          {order.courier_name ? ` · ${order.courier_name}` : ""}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {order.shipping_name}
                    <div>{order.shipping_phone}</div>
                  </td>
                  <td>{formatPkr(Number(order.total))}</td>
                  <td>{new Date(order.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
