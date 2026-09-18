import { createId } from "@/lib/commerce";
import { OrderError } from "@/lib/db/errors";
import type { PoolClient } from "pg";

export type CouponRow = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_value: number;
  expiry_date: Date | string | null;
  usage_limit: number | null;
  expired?: boolean;
};

export function computeDiscount(coupon: CouponRow, subtotal: number) {
  const safeSubtotal = Math.max(0, Math.floor(subtotal));
  if (coupon.discount_type === "percent") {
    return Math.min(
      safeSubtotal,
      Math.floor((safeSubtotal * Number(coupon.discount_value)) / 100),
    );
  }
  return Math.min(safeSubtotal, Number(coupon.discount_value));
}

async function assertCouponUsable(
  client: PoolClient,
  coupon: CouponRow,
  subtotal: number,
) {
  if (coupon.expired) {
    throw new OrderError("EXPIRED", "That coupon has expired.");
  }
  if (Number(coupon.min_order_value) > 0 && subtotal < Number(coupon.min_order_value)) {
    throw new OrderError(
      "MIN_ORDER",
      `This coupon needs a subtotal of at least PKR ${Number(coupon.min_order_value).toLocaleString("en-US")}.`,
    );
  }

  const used = await client.query(
    `SELECT COUNT(*)::int AS count FROM coupon_redemptions WHERE coupon_id = $1`,
    [coupon.id],
  );
  const redemptions = Number(used.rows[0]?.count ?? 0);
  if (
    coupon.usage_limit !== null &&
    Number(coupon.usage_limit) >= 0 &&
    redemptions >= Number(coupon.usage_limit)
  ) {
    throw new OrderError(
      "LIMIT_REACHED",
      "This coupon has reached its usage limit.",
    );
  }
}

async function loadCoupon(client: PoolClient, rawCode: string, forUpdate: boolean) {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    throw new OrderError("INVALID_CODE", "Enter a coupon code.");
  }
  const lock = forUpdate ? " FOR UPDATE" : "";
  const { rows } = await client.query(
    `SELECT *,
            (expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE) AS expired
     FROM coupons
     WHERE upper(code) = $1
     LIMIT 1${lock}`,
    [code],
  );
  const coupon = rows[0] as CouponRow | undefined;
  if (!coupon) {
    throw new OrderError("INVALID_CODE", "That coupon code does not exist.");
  }
  return coupon;
}

export async function previewCoupon(
  client: PoolClient,
  rawCode: string,
  subtotal: number,
) {
  const coupon = await loadCoupon(client, rawCode, false);
  await assertCouponUsable(client, coupon, subtotal);
  return { coupon, discount: computeDiscount(coupon, subtotal) };
}

export async function lockCouponForOrder(
  client: PoolClient,
  rawCode: string,
  subtotal: number,
) {
  const coupon = await loadCoupon(client, rawCode, true);
  await assertCouponUsable(client, coupon, subtotal);
  return { coupon, discount: computeDiscount(coupon, subtotal) };
}

export async function recordCouponRedemption(
  client: PoolClient,
  couponId: string,
  orderId: string,
) {
  await client.query(
    `INSERT INTO coupon_redemptions (id, coupon_id, order_id)
     VALUES ($1, $2, $3)`,
    [createId("cr"), couponId, orderId],
  );
}
