-- Checkout coupon persistence + redemption log.
-- coupon_redemptions is the usage source of truth (not a denormalized counter).

ALTER TABLE orders
  ADD COLUMN coupon_code text,
  ADD COLUMN discount_amount integer NOT NULL DEFAULT 0
    CHECK (discount_amount >= 0);

CREATE TABLE coupon_redemptions (
  id text PRIMARY KEY,
  coupon_id text NOT NULL REFERENCES coupons (id) ON DELETE CASCADE,
  order_id text NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX coupon_redemptions_coupon_id_idx ON coupon_redemptions (coupon_id);

COMMENT ON COLUMN orders.coupon_code IS 'Snapshot of the code used at checkout.';
COMMENT ON COLUMN orders.discount_amount IS 'Discount in PKR applied at checkout.';
COMMENT ON TABLE coupon_redemptions IS 'One row per redeemed coupon. usage_limit is checked with COUNT.';
