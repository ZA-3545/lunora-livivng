import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { requireAdminPage } from "@/lib/admin/guard";
import { getAdminOrder } from "@/lib/admin/db";
import { formatPkr } from "@/lib/format";
import { shipmentStatusLabel } from "@/lib/couriers/copy";
import { paymentStatusLabel } from "@/lib/payments/copy";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  return (
    <>
      <h1>{order.order_number}</h1>
      {order.status === "needs_review" ? (
        <p className="admin-flag">
          <strong>Needs review.</strong>{" "}
          {order.review_reason ??
            "Customer paid, but this order could not be fulfilled automatically."}{" "}
          Resolve by sourcing the item (then set status to confirmed) or issuing
          a refund (then set status to returned).
        </p>
      ) : null}
      <p className="admin-lead">
        {order.shipping_name} · {order.shipping_phone} · {order.shipping_city}
        <br />
        {order.shipping_address}
        <br />
        Payment:{" "}
        {order.payment
          ? paymentStatusLabel(order.payment.status as PaymentStatus)
          : "—"}
        {order.payment?.gateway ? ` · ${order.payment.gateway}` : ""}
        {order.payment?.transaction_ref
          ? ` · ${order.payment.transaction_ref}`
          : ""}
        {order.shipment?.tracking_number ? (
          <>
            <br />
            Shipment: {order.shipment.tracking_number} ·{" "}
            {shipmentStatusLabel(order.shipment.status)} ·{" "}
            {order.shipment.courier_name ?? "Leopards"}
            {order.shipment.last_event ? ` · ${order.shipment.last_event}` : ""}
          </>
        ) : null}
      </p>
      <OrderStatusForm orderId={order.id} status={order.status as OrderStatus} />
      <div className="admin-table-wrap" style={{ marginTop: 20 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(
              (item: {
                id: string;
                name: string;
                quantity: number;
                unit_price: number;
              }) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPkr(Number(item.unit_price))}</td>
                </tr>
              ),
            )}
            <tr>
              <td colSpan={2}>Subtotal</td>
              <td>{formatPkr(Number(order.subtotal))}</td>
            </tr>
            {Number(order.discount_amount) > 0 ? (
              <tr>
                <td colSpan={2}>
                  Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
                </td>
                <td>−{formatPkr(Number(order.discount_amount))}</td>
              </tr>
            ) : null}
            <tr>
              <td colSpan={2}>Shipping</td>
              <td>{formatPkr(Number(order.shipping_fee))}</td>
            </tr>
            <tr>
              <td colSpan={2}>Total</td>
              <td>{formatPkr(Number(order.total))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
