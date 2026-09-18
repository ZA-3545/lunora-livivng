import { formatPkr } from "@/lib/format";
import { SHIPPING_FEE } from "@/lib/commerce";

export function OrderSummary({
  subtotal,
  shippingFee = SHIPPING_FEE,
  discount = 0,
  couponCode = null,
}: {
  subtotal: number;
  shippingFee?: number;
  discount?: number;
  couponCode?: string | null;
}) {
  const safeDiscount = Math.max(0, discount);
  const total = subtotal - safeDiscount + shippingFee;

  return (
    <dl className="summary-list">
      <div>
        <dt>Subtotal</dt>
        <dd>{formatPkr(subtotal)}</dd>
      </div>
      {safeDiscount > 0 ? (
        <div className="summary-discount">
          <dt>Discount{couponCode ? ` (${couponCode})` : ""}</dt>
          <dd>−{formatPkr(safeDiscount)}</dd>
        </div>
      ) : null}
      <div>
        <dt>Shipping</dt>
        <dd>{formatPkr(shippingFee)}</dd>
      </div>
      <div className="summary-total">
        <dt>Total</dt>
        <dd>{formatPkr(total)}</dd>
      </div>
    </dl>
  );
}
