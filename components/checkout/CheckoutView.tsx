"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { CouponField } from "@/components/cart/CouponField";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { useCart } from "@/components/cart/CartProvider";
import { useCoupon } from "@/components/cart/CouponProvider";
import { CatalogMedia } from "@/components/ui/ComingSoonMedia";
import { apiFetch, ApiError } from "@/lib/api/client";
import {
  COD_CONFIRM_THRESHOLD,
  SHIPPING_FEE,
  resolveCartLine,
} from "@/lib/commerce";
import { formatPkr } from "@/lib/format";
import { writeLastOrder } from "@/lib/storage";
import type { Order, PaymentMethod } from "@/lib/types";

export function CheckoutView() {
  const router = useRouter();
  const { lines, subtotal, clearCart } = useCart();
  const { code, discount, status, clearCode } = useCoupon();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resolved = useMemo(
    () =>
      lines
        .map((line) => resolveCartLine(line))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [lines],
  );

  if (resolved.length === 0) {
    return (
      <section className="commerce-page">
        <div className="wrap">
          <h1>Checkout</h1>
          <p className="commerce-empty">
            Your cart is empty. <Link href="/shop">Shop the edit</Link>
          </p>
        </div>
      </section>
    );
  }

  const appliedCode = status === "valid" && discount > 0 ? code : null;
  const total = subtotal - discount + SHIPPING_FEE;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const data = new FormData(event.currentTarget);
    const shipping = {
      name: String(data.get("name") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      addressLine: String(data.get("address") ?? "").trim(),
      city: String(data.get("city") ?? "").trim(),
    };

    if (
      !shipping.name ||
      !shipping.phone ||
      !shipping.addressLine ||
      !shipping.city
    ) {
      setError("Please fill in your name, phone, address, and city.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiFetch<{ order: Order; checkoutUrl?: string }>(
        "/api/orders",
        {
          method: "POST",
          body: JSON.stringify({
            lines: lines.map((line) => ({
              productId: line.productId,
              bundleId: line.bundleId,
              quantity: line.quantity,
            })),
            shipping,
            paymentMethod,
            couponCode: appliedCode,
          }),
        },
      );
      writeLastOrder(result.order);
      clearCart();
      clearCode();
      if (paymentMethod === "online" && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      router.push(`/order-confirmation?order=${result.order.orderNumber}`);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not place the order. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <section className="commerce-page">
      <div className="wrap commerce-layout">
        <div>
          <h1>Checkout</h1>
          <p className="checkout-guest">
            Guest checkout — no account required.
          </p>

          <form className="checkout-form" onSubmit={onSubmit}>
            <fieldset>
              <legend>Shipping</legend>
              <label>
                Full name
                <input name="name" type="text" autoComplete="name" required />
              </label>
              <label>
                Phone
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  placeholder="03XX XXXXXXX"
                />
              </label>
              <label>
                Address
                <input
                  name="address"
                  type="text"
                  autoComplete="street-address"
                  required
                />
              </label>
              <label>
                City
                <input
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  required
                  placeholder="Lahore, Karachi, Islamabad…"
                />
              </label>
            </fieldset>

            <fieldset>
              <legend>Payment</legend>
              <label className="pay-option">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <span>
                  <strong>Cash on Delivery</strong>
                  <small>Pay when your order arrives. Default for Pakistan.</small>
                </span>
              </label>
              <label className="pay-option pay-option-secondary">
                <input
                  type="radio"
                  name="payment"
                  value="online"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                />
                <span>
                  <strong>Online Payment</strong>
                  <small>Cards, JazzCash, Easypaisa via Safepay. Paid orders skip the COD confirmation call.</small>
                </span>
              </label>
            </fieldset>

            {error ? <p className="form-error">{error}</p> : null}

            <button
              type="submit"
              className="btn"
              disabled={submitting || status === "checking"}
            >
              {submitting
                ? paymentMethod === "online"
                  ? "Starting payment…"
                  : "Placing order…"
                : paymentMethod === "online"
                  ? "Pay online"
                  : "Place COD order"}
            </button>
          </form>
        </div>

        <aside className="summary-card">
          <h2>Order summary</h2>
          <ul className="summary-items">
            {resolved.map((item) => (
              <li key={item.line.id}>
                <CatalogMedia
                  className="summary-thumb"
                  src={item.image}
                  name={item.name}
                />
                <div>
                  <p>
                    {item.line.quantity} × {item.name}
                  </p>
                  <p className="now">
                    {formatPkr(item.unitPrice * item.line.quantity)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <CouponField />
          <OrderSummary
            subtotal={subtotal}
            discount={discount}
            couponCode={appliedCode}
          />
          {paymentMethod === "online" ? (
            <p className="summary-note">
              You’ll be redirected to Safepay to pay {formatPkr(total)}. The
              order is created first and stays awaiting payment until the
              gateway confirms.
            </p>
          ) : total >= COD_CONFIRM_THRESHOLD ? (
            <p className="summary-note">
              Orders over {formatPkr(COD_CONFIRM_THRESHOLD)} may get a WhatsApp
              or call confirmation before dispatch.
            </p>
          ) : (
            <p className="summary-note">
              You may receive a WhatsApp or call to confirm this COD order.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
