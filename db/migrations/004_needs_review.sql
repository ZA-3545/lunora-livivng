-- Late paid webhook after an expired hold: paid but unfulfillable.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending',
    'confirmed',
    'packed',
    'shipped',
    'delivered',
    'returned',
    'payment_failed',
    'needs_review'
  )
);

ALTER TABLE orders
  ADD COLUMN review_reason text;

COMMENT ON COLUMN orders.review_reason IS 'Set when a paid online order cannot be fulfilled automatically (e.g. late webhook after stock was released).';
