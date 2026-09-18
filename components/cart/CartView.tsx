"use client";

import Link from "next/link";
import { CouponField } from "@/components/cart/CouponField";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { useCart } from "@/components/cart/CartProvider";
import { useCoupon } from "@/components/cart/CouponProvider";
import { QuantitySelector } from "@/components/pdp/QuantitySelector";
import { CatalogMedia } from "@/components/ui/ComingSoonMedia";
import { resolveCartLine } from "@/lib/commerce";
import { formatPkr } from "@/lib/format";

export function CartView() {
  const { lines, subtotal, updateQuantity, removeItem } = useCart();
  const { discount, code } = useCoupon();
  const resolved = lines
    .map((line) => resolveCartLine(line))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (resolved.length === 0) {
    return (
      <section className="commerce-page">
        <div className="wrap">
          <h1>Cart</h1>
          <p className="commerce-empty">
            Your cart is empty.{" "}
            <Link href="/shop">Shop the edit</Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="commerce-page">
      <div className="wrap commerce-layout">
        <div>
          <h1>Cart</h1>
          <ul className="cart-lines">
            {resolved.map((item) => (
              <li key={item.line.id} className="cart-line">
                <CatalogMedia
                  className="cart-thumb"
                  src={item.image}
                  name={item.name}
                />
                <div className="cart-line-body">
                  <Link href={item.href}>{item.name}</Link>
                  {item.kind === "bundle" ? (
                    <span className="bundle-flag cart-flag">Bundle</span>
                  ) : null}
                  <p className="cart-unit">{formatPkr(item.unitPrice)}</p>
                  <QuantitySelector
                    value={item.line.quantity}
                    onChange={(value) => updateQuantity(item.line.id, value)}
                  />
                  <button
                    type="button"
                    className="cart-remove"
                    onClick={() => removeItem(item.line.id)}
                  >
                    Remove
                  </button>
                </div>
                <p className="cart-line-total">
                  {formatPkr(item.unitPrice * item.line.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <aside className="summary-card">
          <h2>Order summary</h2>
          <CouponField />
          <OrderSummary
            subtotal={subtotal}
            discount={discount}
            couponCode={code}
          />
          <Link href="/checkout" className="btn summary-cta">
            Checkout
          </Link>
          <p className="summary-note">Guest checkout is available. No account needed.</p>
        </aside>
      </div>
    </section>
  );
}
