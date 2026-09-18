-- Lunora Living §11 schema + Phase 4 refinements.
-- Cart is client-side only (localStorage) — no cart table.

CREATE TABLE users (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  email text UNIQUE,
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- user_id is nullable so saved addresses can exist without an account later.
-- Guest checkout does not write this table; orders store a shipping snapshot.
CREATE TABLE addresses (
  id text PRIMARY KEY,
  user_id text REFERENCES users (id) ON DELETE SET NULL,
  label text,
  address_line text NOT NULL,
  city text NOT NULL,
  phone text NOT NULL,
  is_default boolean NOT NULL DEFAULT false
);

CREATE TABLE categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT ''
);

CREATE TABLE products (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  short_description text NOT NULL DEFAULT '',
  category_id text NOT NULL REFERENCES categories (id),
  price integer NOT NULL CHECK (price >= 0),
  cost_price integer NOT NULL CHECK (cost_price >= 0),
  stock_qty integer NOT NULL CHECK (stock_qty >= 0),
  weight integer NOT NULL DEFAULT 0,
  images text[] NOT NULL DEFAULT '{}',
  status text NOT NULL CHECK (status IN ('active', 'draft'))
);

CREATE TABLE bundles (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  bundle_price integer NOT NULL CHECK (bundle_price >= 0),
  image text NOT NULL DEFAULT ''
);

CREATE TABLE bundle_items (
  id text PRIMARY KEY,
  bundle_id text NOT NULL REFERENCES bundles (id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES products (id),
  quantity integer NOT NULL CHECK (quantity > 0),
  UNIQUE (bundle_id, product_id)
);

CREATE TABLE coupons (
  id text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value integer NOT NULL CHECK (discount_value >= 0),
  min_order_value integer NOT NULL DEFAULT 0,
  expiry_date date,
  usage_limit integer
);

CREATE TABLE orders (
  id text PRIMARY KEY,
  user_id text REFERENCES users (id) ON DELETE SET NULL,
  order_number text NOT NULL UNIQUE,
  status text NOT NULL CHECK (
    status IN ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'returned')
  ),
  subtotal integer NOT NULL CHECK (subtotal >= 0),
  shipping_fee integer NOT NULL CHECK (shipping_fee >= 0),
  total integer NOT NULL CHECK (total >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cod', 'online')),
  shipping_name text NOT NULL,
  shipping_phone text NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id text REFERENCES products (id) ON DELETE SET NULL,
  bundle_id text REFERENCES bundles (id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price integer NOT NULL CHECK (unit_price >= 0),
  name text NOT NULL,
  slug text NOT NULL,
  image text NOT NULL DEFAULT '',
  CONSTRAINT order_items_product_xor_bundle CHECK (
    (product_id IS NOT NULL AND bundle_id IS NULL)
    OR (product_id IS NULL AND bundle_id IS NOT NULL)
  )
);

CREATE TABLE payments (
  id text PRIMARY KEY,
  order_id text NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
  gateway text NOT NULL,
  status text NOT NULL CHECK (
    status IN ('pending_collection', 'collected_on_delivery', 'paid', 'failed')
  ),
  transaction_ref text,
  amount integer NOT NULL CHECK (amount >= 0),
  paid_at timestamptz
);

CREATE TABLE reviews (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  user_id text REFERENCES users (id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  image text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shipments (
  id text PRIMARY KEY,
  order_id text NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
  courier_name text,
  tracking_number text,
  status text NOT NULL CHECK (
    status IN ('pending', 'dispatched', 'in_transit', 'delivered')
  ),
  dispatched_at timestamptz,
  delivered_at timestamptz
);

CREATE INDEX products_category_id_idx ON products (category_id);
CREATE INDEX products_status_idx ON products (status);
CREATE INDEX bundle_items_bundle_id_idx ON bundle_items (bundle_id);
CREATE INDEX bundle_items_product_id_idx ON bundle_items (product_id);
CREATE INDEX orders_order_number_idx ON orders (order_number);
CREATE INDEX orders_shipping_phone_digits_idx ON orders (regexp_replace(shipping_phone, '[^0-9]', '', 'g'));
CREATE INDEX order_items_order_id_idx ON order_items (order_id);
CREATE INDEX reviews_product_id_idx ON reviews (product_id);

COMMENT ON COLUMN addresses.user_id IS 'Nullable for future saved-address support. Guest orders do not use this table.';
COMMENT ON COLUMN orders.shipping_name IS 'Checkout snapshot. Orders never depend on a live addresses row.';
COMMENT ON COLUMN orders.shipping_phone IS 'Checkout snapshot used with order_number for guest tracking.';
COMMENT ON COLUMN orders.shipping_address IS 'Checkout snapshot of the address line.';
COMMENT ON COLUMN orders.shipping_city IS 'Checkout snapshot of the city.';
COMMENT ON COLUMN order_items.name IS 'Name snapshot at purchase so history survives catalog edits.';
COMMENT ON COLUMN order_items.slug IS 'Slug snapshot at purchase.';
COMMENT ON COLUMN order_items.image IS 'Image snapshot at purchase.';
COMMENT ON COLUMN order_items.product_id IS 'Set NULL on product delete; display uses snapshot columns.';
COMMENT ON COLUMN order_items.bundle_id IS 'Set NULL on bundle delete; display uses snapshot columns.';
COMMENT ON COLUMN products.stock_qty IS 'Decremented inside the create-order transaction. CHECK (>= 0) blocks oversell.';
