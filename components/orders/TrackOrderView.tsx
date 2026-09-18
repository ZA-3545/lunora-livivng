"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { PaymentRecoveryActions } from "@/components/orders/PaymentRecoveryActions";
import { apiFetch, ApiError } from "@/lib/api/client";
import { formatPkr } from "@/lib/format";
import { shipmentStatusLabel } from "@/lib/couriers/copy";
import { isOnlineUnpaid, paymentStatusLabel } from "@/lib/payments/copy";
import type { Order } from "@/lib/types";

const STATUS_COPY: Record<Order["status"], string> = {
  pending: "Pending — waiting for WhatsApp / call confirmation.",
  confirmed: "Confirmed — we’re packing your order.",
  packed: "Packed — handing over to the courier shortly.",
  shipped: "Shipped — your courier is on the way.",
  delivered: "Delivered.",
  returned: "Returned to origin.",
  payment_failed:
    "Payment failed or expired — stock was released. Retry online or switch to Cash on Delivery.",
  needs_review:
    "Paid — needs review. Stock was not available after a late payment confirmation.",
};

function statusCopy(order: Order) {
  if (
    order.paymentMethod === "online" &&
    order.payment.status === "awaiting_payment"
  ) {
    return "Awaiting payment — this order is reserved until Safepay confirms.";
  }
  if (order.status === "needs_review") {
    return STATUS_COPY.needs_review;
  }
  if (order.paymentMethod === "online" && order.payment.status === "paid") {
    return "Confirmed — paid online, we’re packing your order.";
  }
  return STATUS_COPY[order.status];
}

export function TrackOrderView() {
  const searchParams = useSearchParams();
  const preset = searchParams.get("order") ?? "";
  const [result, setResult] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const orderNumber = String(data.get("orderNumber") ?? "");
    const phone = String(data.get("phone") ?? "");
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const query = new URLSearchParams({ orderNumber, phone });
      const { order } = await apiFetch<{ order: Order }>(
        `/api/orders/lookup?${query}`,
      );
      setResult(order);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "No order matched that number and phone. Check both and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="commerce-page">
      <div className="wrap track-layout">
        <div>
          <h1>Track order</h1>
          <p className="pdp-short">
            Enter your order number and the phone used at checkout. No account
            needed.
          </p>
          <form className="checkout-form" onSubmit={onSubmit}>
            <label>
              Order number
              <input
                name="orderNumber"
                type="text"
                required
                defaultValue={preset}
                placeholder="LL-XXXXXXXX"
              />
            </label>
            <label>
              Phone
              <input name="phone" type="tel" required inputMode="tel" />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Looking up…" : "Look up order"}
            </button>
          </form>
        </div>

        {result ? (
          <aside className="summary-card">
            <p className="pdp-kicker">{result.orderNumber}</p>
            <h2>{statusCopy(result)}</h2>
            <p className="summary-note">
              {result.shipping.name} · {result.shipping.city}
              <br />
              Payment: {paymentStatusLabel(result.payment.status)} ·{" "}
              {result.paymentMethod === "online" ? "Online (Safepay)" : "Cash on Delivery"} ·{" "}
              {formatPkr(result.total)}
              <br />
              Shipment: {shipmentStatusLabel(result.shipment.status)}
              {result.shipment.courierName
                ? ` · ${result.shipment.courierName}`
                : ""}
              {result.shipment.trackingNumber
                ? ` · ${result.shipment.trackingNumber}`
                : " · tracking assigned after dispatch"}
              {result.shipment.lastEvent ? ` · ${result.shipment.lastEvent}` : ""}
            </p>
            <ul className="summary-items">
              {result.items.map((item) => (
                <li key={item.id}>
                  <div>
                    <p>
                      {item.quantity} × {item.name}
                    </p>
                    <p className="now">{formatPkr(item.unitPrice * item.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <OrderSummary
              subtotal={result.subtotal}
              shippingFee={result.shippingFee}
              discount={result.discountAmount ?? 0}
              couponCode={result.couponCode ?? null}
            />
            {isOnlineUnpaid(result) ? (
              <PaymentRecoveryActions order={result} />
            ) : null}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
