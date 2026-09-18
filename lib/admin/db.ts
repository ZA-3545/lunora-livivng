import { createId } from "@/lib/commerce";
import { getPool } from "@/lib/db/pool";
import type { OrderStatus, ProductStatus } from "@/lib/types";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "returned",
  "payment_failed",
  "needs_review",
];

export function isOrderStatus(value: string): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export type AdminProductInput = {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stockQty: number;
  weight: number;
  images: string[];
  status: ProductStatus;
};

export type AdminBundleInput = {
  name: string;
  slug: string;
  description: string;
  bundlePrice: number;
  image: string;
  items: Array<{ productId: string; quantity: number }>;
};

export type AdminCouponInput = {
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderValue: number;
  expiryDate: string | null;
  usageLimit: number | null;
};

export async function listAllProducts() {
  const { rows } = await getPool().query(`SELECT * FROM products ORDER BY name`);
  return rows;
}

export async function listAdminProducts() {
  const { rows } = await getPool().query(
    `SELECT p.*, c.name AS category_name
     FROM products p
     JOIN categories c ON c.id = p.category_id
     ORDER BY p.name`,
  );
  return rows;
}

export async function getAdminProduct(id: string) {
  const { rows } = await getPool().query(
    `SELECT * FROM products WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createAdminProduct(input: AdminProductInput) {
  const id = createId("p");
  await getPool().query(
    `INSERT INTO products (
       id, name, slug, description, short_description, category_id,
       price, cost_price, stock_qty, weight, images, status
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      id,
      input.name,
      input.slug,
      input.description,
      input.shortDescription,
      input.categoryId,
      input.price,
      input.costPrice,
      input.stockQty,
      input.weight,
      input.images,
      input.status,
    ],
  );
  return id;
}

export async function updateAdminProduct(id: string, input: AdminProductInput) {
  const result = await getPool().query(
    `UPDATE products SET
       name = $2, slug = $3, description = $4, short_description = $5,
       category_id = $6, price = $7, cost_price = $8, stock_qty = $9,
       weight = $10, images = $11, status = $12
     WHERE id = $1`,
    [
      id,
      input.name,
      input.slug,
      input.description,
      input.shortDescription,
      input.categoryId,
      input.price,
      input.costPrice,
      input.stockQty,
      input.weight,
      input.images,
      input.status,
    ],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteAdminProduct(id: string) {
  const used = await getPool().query(
    `SELECT 1 FROM bundle_items WHERE product_id = $1 LIMIT 1`,
    [id],
  );
  if (used.rowCount) {
    throw new Error("This product is in a bundle. Remove it from bundles first.");
  }
  const result = await getPool().query(`DELETE FROM products WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function listAdminBundles() {
  const { rows } = await getPool().query(
    `SELECT b.*,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', bi.id,
                  'productId', bi.product_id,
                  'quantity', bi.quantity,
                  'name', p.name
                )
                ORDER BY bi.id
              ) FILTER (WHERE bi.id IS NOT NULL),
              '[]'
            ) AS items
     FROM bundles b
     LEFT JOIN bundle_items bi ON bi.bundle_id = b.id
     LEFT JOIN products p ON p.id = bi.product_id
     GROUP BY b.id
     ORDER BY b.name`,
  );
  return rows;
}

export async function getAdminBundle(id: string) {
  const pool = getPool();
  const bundle = await pool.query(`SELECT * FROM bundles WHERE id = $1`, [id]);
  if (!bundle.rows[0]) return null;
  const items = await pool.query(
    `SELECT bi.*, p.name AS product_name
     FROM bundle_items bi
     JOIN products p ON p.id = bi.product_id
     WHERE bi.bundle_id = $1
     ORDER BY bi.id`,
    [id],
  );
  return { ...bundle.rows[0], items: items.rows };
}

export async function createAdminBundle(input: AdminBundleInput) {
  const pool = getPool();
  const client = await pool.connect();
  const id = createId("b");
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO bundles (id, name, slug, description, bundle_price, image)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, input.name, input.slug, input.description, input.bundlePrice, input.image],
    );
    for (const item of input.items) {
      await client.query(
        `INSERT INTO bundle_items (id, bundle_id, product_id, quantity)
         VALUES ($1,$2,$3,$4)`,
        [createId("bi"), id, item.productId, item.quantity],
      );
    }
    await client.query("COMMIT");
    return id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateAdminBundle(id: string, input: AdminBundleInput) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query(
      `UPDATE bundles
       SET name = $2, slug = $3, description = $4, bundle_price = $5, image = $6
       WHERE id = $1`,
      [id, input.name, input.slug, input.description, input.bundlePrice, input.image],
    );
    if (!updated.rowCount) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query(`DELETE FROM bundle_items WHERE bundle_id = $1`, [id]);
    for (const item of input.items) {
      await client.query(
        `INSERT INTO bundle_items (id, bundle_id, product_id, quantity)
         VALUES ($1,$2,$3,$4)`,
        [createId("bi"), id, item.productId, item.quantity],
      );
    }
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteAdminBundle(id: string) {
  const result = await getPool().query(`DELETE FROM bundles WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function listAdminOrders() {
  const { rows } = await getPool().query(
    `SELECT o.id, o.order_number, o.status, o.shipping_name, o.shipping_phone,
            o.shipping_city, o.total, o.created_at, o.payment_method,
            p.status AS payment_status, p.gateway,
            s.tracking_number, s.courier_name, s.status AS shipment_status,
            s.last_event
     FROM orders o
     LEFT JOIN payments p ON p.order_id = o.id
     LEFT JOIN shipments s ON s.order_id = o.id
     ORDER BY (o.status = 'needs_review') DESC, o.created_at DESC`,
  );
  return rows;
}

export async function getAdminOrder(id: string) {
  const pool = getPool();
  const order = await pool.query(`SELECT * FROM orders WHERE id = $1`, [id]);
  if (!order.rows[0]) return null;
  const items = await pool.query(
    `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id`,
    [id],
  );
  const payment = await pool.query(
    `SELECT * FROM payments WHERE order_id = $1 LIMIT 1`,
    [id],
  );
  const shipment = await pool.query(
    `SELECT * FROM shipments WHERE order_id = $1 LIMIT 1`,
    [id],
  );
  return {
    ...order.rows[0],
    items: items.rows,
    payment: payment.rows[0] ?? null,
    shipment: shipment.rows[0] ?? null,
  };
}

export async function updateAdminOrderStatus(id: string, status: OrderStatus) {
  const result = await getPool().query(
    `UPDATE orders SET status = $2 WHERE id = $1`,
    [id, status],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listAdminCustomers() {
  const { rows } = await getPool().query(
    `SELECT
       regexp_replace(shipping_phone, '[^0-9]', '', 'g') AS phone_digits,
       (ARRAY_AGG(shipping_name ORDER BY created_at DESC))[1] AS name,
       (ARRAY_AGG(shipping_phone ORDER BY created_at DESC))[1] AS phone,
       COUNT(*)::int AS order_count,
       COALESCE(SUM(total) FILTER (WHERE status <> 'returned'), 0)::int AS spend,
       MAX(created_at) AS last_order_at
     FROM orders
     WHERE regexp_replace(shipping_phone, '[^0-9]', '', 'g') <> ''
     GROUP BY 1
     ORDER BY last_order_at DESC`,
  );
  return rows;
}

export async function getAdminCustomer(phoneDigits: string) {
  const { rows } = await getPool().query(
    `SELECT id, order_number, status, shipping_name, shipping_phone,
            shipping_city, total, created_at
     FROM orders
     WHERE regexp_replace(shipping_phone, '[^0-9]', '', 'g') = $1
     ORDER BY created_at DESC`,
    [phoneDigits],
  );
  return rows;
}

export async function listAdminCoupons() {
  const { rows } = await getPool().query<{
    id: string;
    code: string;
    discount_type: string;
    discount_value: number;
    min_order_value: number;
    expiry_date: Date | string | null;
    usage_limit: number | null;
    redemptions: number;
  }>(
    `SELECT c.*, COALESCE(r.used, 0)::int AS redemptions
     FROM coupons c
     LEFT JOIN (
       SELECT coupon_id, COUNT(*)::int AS used
       FROM coupon_redemptions
       GROUP BY coupon_id
     ) r ON r.coupon_id = c.id
     ORDER BY c.code`,
  );
  return rows;
}

export async function getAdminCoupon(id: string) {
  const { rows } = await getPool().query(`SELECT * FROM coupons WHERE id = $1`, [
    id,
  ]);
  return rows[0] ?? null;
}

export async function createAdminCoupon(input: AdminCouponInput) {
  const id = createId("cpn");
  await getPool().query(
    `INSERT INTO coupons (
       id, code, discount_type, discount_value, min_order_value, expiry_date, usage_limit
     ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      id,
      input.code,
      input.discountType,
      input.discountValue,
      input.minOrderValue,
      input.expiryDate,
      input.usageLimit,
    ],
  );
  return id;
}

export async function updateAdminCoupon(id: string, input: AdminCouponInput) {
  const result = await getPool().query(
    `UPDATE coupons SET
       code = $2, discount_type = $3, discount_value = $4,
       min_order_value = $5, expiry_date = $6, usage_limit = $7
     WHERE id = $1`,
    [
      id,
      input.code,
      input.discountType,
      input.discountValue,
      input.minOrderValue,
      input.expiryDate,
      input.usageLimit,
    ],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteAdminCoupon(id: string) {
  const result = await getPool().query(`DELETE FROM coupons WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getAdminStats() {
  const pool = getPool();
  const [counts, top] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) FILTER (
           WHERE created_at >= (date_trunc('day', now() AT TIME ZONE 'Asia/Karachi')
             AT TIME ZONE 'Asia/Karachi')
         )::int AS orders_today,
         COUNT(*) FILTER (
           WHERE created_at >= (date_trunc('week', now() AT TIME ZONE 'Asia/Karachi')
             AT TIME ZONE 'Asia/Karachi')
         )::int AS orders_week,
         COUNT(*)::int AS orders_all,
         COALESCE(SUM(total) FILTER (
           WHERE status NOT IN ('returned', 'payment_failed')
             AND (
               status <> 'pending'
               OR payment_method = 'cod'
             )
         ), 0)::int AS revenue
       FROM orders`,
    ),
    pool.query(
      `WITH direct AS (
         SELECT COALESCE(product_id, slug) AS sku, name, SUM(quantity)::int AS qty
         FROM order_items
         WHERE bundle_id IS NULL
         GROUP BY 1, 2
       ),
       from_bundles AS (
         SELECT bi.product_id AS sku, p.name, SUM(oi.quantity * bi.quantity)::int AS qty
         FROM order_items oi
         JOIN bundle_items bi ON bi.bundle_id = oi.bundle_id
         JOIN products p ON p.id = bi.product_id
         WHERE oi.bundle_id IS NOT NULL
         GROUP BY 1, 2
       )
       SELECT sku, name, SUM(qty)::int AS qty
       FROM (
         SELECT * FROM direct
         UNION ALL
         SELECT * FROM from_bundles
       ) combined
       GROUP BY sku, name
       ORDER BY qty DESC
       LIMIT 5`,
    ),
  ]);
  return {
    ...counts.rows[0],
    topProducts: top.rows,
  };
}

export function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "23505",
  );
}
