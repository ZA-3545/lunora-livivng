-- Online payments: awaiting/failed payment statuses + order payment_failed.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending',
    'confirmed',
    'packed',
    'shipped',
    'delivered',
    'returned',
    'payment_failed'
  )
);

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (
  status IN (
    'pending_collection',
    'collected_on_delivery',
    'awaiting_payment',
    'paid',
    'failed',
    'payment_failed'
  )
);

COMMENT ON COLUMN payments.status IS 'COD: pending_collection. Online: awaiting_payment → paid | payment_failed.';
