ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_status_check;
ALTER TABLE shipments ADD CONSTRAINT shipments_status_check CHECK (
  status IN (
    'pending',
    'dispatched',
    'in_transit',
    'delivered',
    'returned'
  )
);

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS last_event text,
  ADD COLUMN IF NOT EXISTS booked_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS shipments_tracking_number_unique
  ON shipments (tracking_number)
  WHERE tracking_number IS NOT NULL;

COMMENT ON COLUMN shipments.last_event IS 'Last courier event label (for admin / track).';
