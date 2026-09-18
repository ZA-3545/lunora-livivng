"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useCoupon } from "@/components/cart/CouponProvider";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { PaymentRecoveryActions } from "@/components/orders/PaymentRecoveryActions";
import { apiFetch } from "@/lib/api/client";
import { COD_CONFIRM_THRESHOLD, normalizeOrderNumber } from "@/lib/commerce";
import { formatPkr } from "@/lib/format";
import { isOnlineUnpaid, paymentStatusLabel } from "@/lib/payments/copy";
import { readLastOrder, writeLastOrder } from "@/lib/storage";
import type { Order } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";

function ConfirmationCopy({ order }: { order: Order }) {
  const unpaid = isOnlineUnpaid(order);
  const paidOnline =
    order.paymentMethod === "online" && order.payment.status === "paid";

  if (unpaid) {
    return (
      <>
        <p className="pdp-kicker">
          {order.payment.status === "awaiting_payment"
            ? "Awaiting payment"
            : "Payment failed"}
        </p>
        <h1>
          {order.payment.status === "awaiting_payment"
            ? "Your order is waiting for payment."
            : "Payment didn’t go through."}
        </h1>
        <p className="confirm-number">
          Order number <strong>{order.orderNumber}</strong>
        </p>
        <p className="pdp-short">
          {order.payment.status === "awaiting_payment"
            ? `This order is reserved for ${formatPkr(order.total)}, but it is not placed until Safepay confirms payment. You can retry or switch to Cash on Delivery.`
            : "The gateway reported a failed payment. Retry online, or switch this same order to Cash on Delivery."}
        </p>
        <PaymentRecoveryActions order={order} />
      </>
    );
  }

  if (paidOnline && order.status === "needs_review") {
    return (
      <>
        <p className="pdp-kicker">Payment received — in review</p>
        <h1>We’ve got your payment, {order.shipping.name.split(" ")[0]}.</h1>
        <p className="confirm-number">
          Order number <strong>{order.orderNumber}</strong>
        </p>
        <p className="pdp-short">
          {formatPkr(order.total)} was paid, and our team is checking
          fulfillment. We’ll WhatsApp {order.shipping.phone} if we need to
          source an item or arrange a refund.
        </p>
      </>
    );
  }

  if (paidOnline) {
    return (
      <>
        <p className="pdp-kicker">Paid online</p>
        <h1>Thank you, {order.shipping.name.split(" ")[0]}.</h1>
        <p className="confirm-number">
          Order number <strong>{order.orderNumber}</strong>
        </p>
        <p className="pdp-short">
          Payment received — {formatPkr(order.total)}. This order is confirmed
          and does not need a COD WhatsApp check.
        </p>
        <div className="confirm-next">
          <h2>What happens next</h2>
          <ol>
            <li>We pack your paid order and hand it to the courier.</li>
            <li>
              Track anytime with your order number and phone — no account
              needed.
            </li>
          </ol>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="pdp-kicker">Order placed</p>
      <h1>Thank you, {order.shipping.name.split(" ")[0]}.</h1>
      <p className="confirm-number">
        Order number <strong>{order.orderNumber}</strong>
      </p>
      <p className="pdp-short">
        Cash on Delivery — pay {formatPkr(order.total)} when it arrives in{" "}
        {order.shipping.city}.
      </p>
      <div className="confirm-next">
        <h2>What happens next</h2>
        <ol>
          <li>
            We’ll review your order. You may get a WhatsApp or a short call
            to confirm — especially on COD orders
            {order.total >= COD_CONFIRM_THRESHOLD
              ? ` over ${formatPkr(COD_CONFIRM_THRESHOLD)}`
              : ""}
            .
          </li>
          <li>Once confirmed, we pack and hand it to the courier.</li>
          <li>
            Track anytime with your order number and phone — no account needed.
          </li>
        </ol>
      </div>
    </>
  );
}

export function ConfirmationView() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "";
  const hydrated = useHydrated();
  const stored = hydrated ? readLastOrder() : null;
  const [order, setOrder] = useState<Order | null>(
    stored &&
      normalizeOrderNumber(stored.orderNumber) ===
        normalizeOrderNumber(orderNumber)
      ? stored
      : null,
  );
  const { clearCart } = useCart();
  const { clearCode } = useCoupon();

  useEffect(() => {
    if (!hydrated || !orderNumber) return;
    const snapshot = readLastOrder();
    if (
      !snapshot ||
      normalizeOrderNumber(snapshot.orderNumber) !==
        normalizeOrderNumber(orderNumber)
    ) {
      return;
    }
    const phone = snapshot.shipping.phone;
    let cancelled = false;
    async function refresh() {
      try {
        const query = new URLSearchParams({
          orderNumber,
          phone,
        });
        const { order: live } = await apiFetch<{ order: Order }>(
          `/api/orders/lookup?${query}`,
        );
        if (cancelled) return;
        setOrder(live);
        writeLastOrder(live);
        if (live.payment.status === "paid") {
          clearCart();
          clearCode();
        }
      } catch {
        if (!cancelled) setOrder(snapshot);
      }
    }
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [clearCart, clearCode, hydrated, orderNumber]);

  if (!hydrated) {
    return (
      <section className="commerce-page">
        <div className="wrap">
          <h1>Order confirmation</h1>
          <p className="commerce-empty">Looking up your order…</p>
        </div>
      </section>
    );
  }

  if (!orderNumber) {
    return (
      <section className="commerce-page">
        <div className="wrap">
          <h1>Order confirmation</h1>
          <p className="commerce-empty">
            Missing order number. <Link href="/track-order">Track an order</Link>
          </p>
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="commerce-page">
        <div className="wrap">
          <h1>Order confirmation</h1>
          <p className="commerce-empty">
            We couldn’t find that order.{" "}
            <Link href={`/track-order?order=${orderNumber}`}>Track an order</Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="commerce-page">
      <div className="wrap confirm-layout">
        <div>
          <ConfirmationCopy order={order} />
          <Link
            href={`/track-order?order=${order.orderNumber}`}
            className="btn"
            style={{ marginTop: 18 }}
          >
            Track this order
          </Link>
        </div>

        <aside className="summary-card">
          <h2>Order summary</h2>
          <p className="summary-note">
            Payment: {paymentStatusLabel(order.payment.status)}
          </p>
          <ul className="summary-items">
            {order.items.map((item) => (
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
            subtotal={order.subtotal}
            shippingFee={order.shippingFee}
            discount={order.discountAmount ?? 0}
            couponCode={order.couponCode ?? null}
          />
          <p className="summary-note">
            {order.shipping.addressLine}, {order.shipping.city}
            <br />
            {order.shipping.phone}
          </p>
        </aside>
      </div>
    </section>
  );
}
