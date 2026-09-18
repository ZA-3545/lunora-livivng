import {
  ONLINE_PAYMENT_HOLD_MINUTES,
  SHIPPING_FEE,
  createId,
  createOrderNumber,
  normalizeOrderNumber,
  normalizePhone,
} from "@/lib/commerce";
import { OrderError } from "@/lib/db/errors";
import {
  mapBundle,
  mapOrder,
  mapOrderItem,
  mapPayment,
  mapProduct,
  mapShipment,
} from "@/lib/db/mappers";
import { getPool } from "@/lib/db/pool";
import { lockCouponForOrder, recordCouponRedemption } from "@/lib/db/coupons";
import type {
  GuestShipping,
  Order,
  PaymentMethod,
} from "@/lib/types";
import type { PoolClient } from "pg";

export type CreateOrderLineInput = {
  productId?: string | null;
  bundleId?: string | null;
  quantity: number;
};

export type CreateOrderInput = {
  lines: CreateOrderLineInput[];
  shipping: GuestShipping;
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
};

type ResolvedLine = {
  productId: string | null;
  bundleId: string | null;
  quantity: number;
  unitPrice: number;
  name: string;
  slug: string;
  image: string;
};

function requireShipping(shipping: GuestShipping): GuestShipping {
  const name = shipping.name.trim();
  const phone = shipping.phone.trim();
  const addressLine = shipping.addressLine.trim();
  const city = shipping.city.trim();
  if (!name || !phone || !addressLine || !city) {
    throw new OrderError(
      "VALIDATION",
      "Please fill in your name, phone, address, and city.",
    );
  }
  return { name, phone, addressLine, city };
}

async function stockNeedsForOrder(client: PoolClient, orderId: string) {
  const needed = new Map<string, number>();
  const { rows: items } = await client.query(
    `SELECT product_id, bundle_id, quantity FROM order_items WHERE order_id = $1`,
    [orderId],
  );
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (item.product_id) {
      needed.set(
        item.product_id,
        (needed.get(item.product_id) ?? 0) + quantity,
      );
      continue;
    }
    const { rows: parts } = await client.query(
      `SELECT product_id, quantity FROM bundle_items WHERE bundle_id = $1`,
      [item.bundle_id],
    );
    for (const part of parts) {
      needed.set(
        part.product_id,
        (needed.get(part.product_id) ?? 0) + Number(part.quantity) * quantity,
      );
    }
  }
  return needed;
}

async function applyStockDelta(
  client: PoolClient,
  needed: Map<string, number>,
  direction: "decrement" | "increment",
) {
  const productIds = [...needed.keys()].sort();
  if (!productIds.length) return;
  const { rows } = await client.query(
    `SELECT id, name, stock_qty FROM products WHERE id = ANY($1::text[]) FOR UPDATE`,
    [productIds],
  );
  const byId = new Map(rows.map((row) => [row.id as string, row]));
  if (direction === "decrement") {
    for (const id of productIds) {
      const qty = needed.get(id) ?? 0;
      const row = byId.get(id);
      if (!row) {
        throw new OrderError(
          "VALIDATION",
          "A product in this order is no longer available.",
        );
      }
      if (Number(row.stock_qty) < qty) {
        throw new OrderError(
          "INSUFFICIENT_STOCK",
          `Not enough stock for ${row.name}.`,
        );
      }
    }
  }
  for (const id of productIds) {
    const qty = needed.get(id) ?? 0;
    if (direction === "increment") {
      await client.query(
        `UPDATE products SET stock_qty = stock_qty + $2 WHERE id = $1`,
        [id, qty],
      );
      continue;
    }
    const result = await client.query(
      `UPDATE products
       SET stock_qty = stock_qty - $2
       WHERE id = $1 AND stock_qty >= $2`,
      [id, qty],
    );
    if (result.rowCount !== 1) {
      throw new OrderError(
        "INSUFFICIENT_STOCK",
        "Not enough stock to complete this order.",
      );
    }
  }
}

async function releaseHeldOnlineStock(client: PoolClient, orderId: string) {
  const { rows } = await client.query(
    `SELECT status FROM payments WHERE order_id = $1 FOR UPDATE`,
    [orderId],
  );
  if (rows[0]?.status !== "awaiting_payment") return false;
  const needed = await stockNeedsForOrder(client, orderId);
  await applyStockDelta(client, needed, "increment");
  await client.query(`DELETE FROM coupon_redemptions WHERE order_id = $1`, [
    orderId,
  ]);
  await client.query(
    `UPDATE payments SET status = 'payment_failed' WHERE order_id = $1`,
    [orderId],
  );
  await client.query(
    `UPDATE orders SET status = 'payment_failed' WHERE id = $1`,
    [orderId],
  );
  return true;
}

async function reholdOnlineStock(client: PoolClient, orderId: string) {
  const { rows } = await client.query(
    `SELECT status FROM payments WHERE order_id = $1 FOR UPDATE`,
    [orderId],
  );
  const status = rows[0]?.status as string | undefined;
  if (status === "awaiting_payment") return "held";
  if (status === "paid") return "paid";
  const needed = await stockNeedsForOrder(client, orderId);
  try {
    await applyStockDelta(client, needed, "decrement");
  } catch (error) {
    if (error instanceof OrderError && error.code === "INSUFFICIENT_STOCK") {
      return "unavailable";
    }
    throw error;
  }
  await client.query(
    `UPDATE payments SET status = 'awaiting_payment' WHERE order_id = $1`,
    [orderId],
  );
  await client.query(
    `UPDATE orders SET status = 'pending', review_reason = NULL WHERE id = $1`,
    [orderId],
  );
  return "held";
}

export async function expireStaleOnlineReservations(exceptOrderId?: string) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const released = await expireStaleOnlineReservationsOn(client, exceptOrderId);
    await client.query("COMMIT");
    return released;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function expireStaleOnlineReservationsOn(
  client: PoolClient,
  exceptOrderId?: string,
) {
  const { rows } = await client.query(
    `SELECT o.id
     FROM orders o
     JOIN payments p ON p.order_id = o.id
     WHERE o.payment_method = 'online'
       AND p.status = 'awaiting_payment'
       AND o.created_at < now() - ($1::text || ' minutes')::interval
       AND ($2::text IS NULL OR o.id <> $2)
     FOR UPDATE OF o`,
    [String(ONLINE_PAYMENT_HOLD_MINUTES), exceptOrderId ?? null],
  );
  let released = 0;
  for (const row of rows) {
    if (await releaseHeldOnlineStock(client, row.id as string)) released += 1;
  }
  return released;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (input.paymentMethod !== "cod" && input.paymentMethod !== "online") {
    throw new OrderError("VALIDATION", "Choose Cash on Delivery or Online Payment.");
  }

  const shipping = requireShipping(input.shipping);
  if (!input.lines.length) {
    throw new OrderError("VALIDATION", "Your cart is empty.");
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await expireStaleOnlineReservationsOn(client);

    const resolved: ResolvedLine[] = [];
    const needed = new Map<string, number>();

    for (const line of input.lines) {
      const quantity = Math.floor(Number(line.quantity));
      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new OrderError("VALIDATION", "Each item needs a quantity of 1 or more.");
      }

      const productId = line.productId ?? null;
      const bundleId = line.bundleId ?? null;
      if (Boolean(productId) === Boolean(bundleId)) {
        throw new OrderError(
          "VALIDATION",
          "Each line must be either a product or a bundle.",
        );
      }

      if (productId) {
        const { rows } = await client.query(
          `SELECT * FROM products WHERE id = $1 AND status = 'active'`,
          [productId],
        );
        if (!rows[0]) {
          throw new OrderError("VALIDATION", "A product in this order is no longer available.");
        }
        const product = mapProduct(rows[0]);
        resolved.push({
          productId,
          bundleId: null,
          quantity,
          unitPrice: product.price,
          name: product.name,
          slug: product.slug,
          image: product.images[0] ?? "",
        });
        needed.set(productId, (needed.get(productId) ?? 0) + quantity);
        continue;
      }

      const { rows: bundleRows } = await client.query(
        `SELECT * FROM bundles WHERE id = $1`,
        [bundleId],
      );
      if (!bundleRows[0]) {
        throw new OrderError("VALIDATION", "A bundle in this order is no longer available.");
      }
      const bundle = mapBundle(bundleRows[0]);
      const { rows: items } = await client.query(
        `SELECT * FROM bundle_items WHERE bundle_id = $1`,
        [bundleId],
      );
      if (!items.length) {
        throw new OrderError("VALIDATION", `${bundle.name} has no products to fulfill.`);
      }
      resolved.push({
        productId: null,
        bundleId,
        quantity,
        unitPrice: bundle.bundlePrice,
        name: bundle.name,
        slug: bundle.slug,
        image: bundle.image,
      });
      for (const item of items) {
        needed.set(
          item.product_id,
          (needed.get(item.product_id) ?? 0) + Number(item.quantity) * quantity,
        );
      }
    }

    const productIds = [...needed.keys()].sort();
    const { rows: stockRows } = await client.query(
      `SELECT id, name, stock_qty
       FROM products
       WHERE id = ANY($1::text[])
       FOR UPDATE`,
      [productIds],
    );
    const stockById = new Map(
      stockRows.map((row) => [row.id as string, row as { id: string; name: string; stock_qty: number }]),
    );

    for (const id of productIds) {
      const row = stockById.get(id);
      const need = needed.get(id) ?? 0;
      if (!row) {
        throw new OrderError(
          "VALIDATION",
          "A product in this order is no longer available.",
        );
      }
      if (Number(row.stock_qty) < need) {
        throw new OrderError(
          "INSUFFICIENT_STOCK",
          `Not enough stock for ${row.name}.`,
        );
      }
    }

    for (const id of productIds) {
      const need = needed.get(id) ?? 0;
      const result = await client.query(
        `UPDATE products
         SET stock_qty = stock_qty - $2
         WHERE id = $1 AND stock_qty >= $2`,
        [id, need],
      );
      if (result.rowCount !== 1) {
        throw new OrderError(
          "INSUFFICIENT_STOCK",
          "Not enough stock to complete this order.",
        );
      }
    }

    const subtotal = resolved.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    );
    const shippingFee = SHIPPING_FEE;
    let discountAmount = 0;
    let couponCode: string | null = null;
    let couponId: string | null = null;
    if (input.couponCode?.trim()) {
      const redeemed = await lockCouponForOrder(
        client,
        input.couponCode,
        subtotal,
      );
      discountAmount = redeemed.discount;
      couponCode = redeemed.coupon.code;
      couponId = redeemed.coupon.id;
    }
    const total = subtotal - discountAmount + shippingFee;
    const orderId = createId("ord");
    const orderNumber = createOrderNumber();
    const paymentId = createId("pay");
    const shipmentId = createId("shp");

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (
         id, user_id, order_number, status, subtotal, shipping_fee,
         discount_amount, coupon_code, total, payment_method, shipping_name,
         shipping_phone, shipping_address, shipping_city
       ) VALUES ($1, NULL, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        orderId,
        orderNumber,
        subtotal,
        shippingFee,
        discountAmount,
        couponCode,
        total,
        input.paymentMethod,
        shipping.name,
        shipping.phone,
        shipping.addressLine,
        shipping.city,
      ],
    );

    if (couponId) {
      await recordCouponRedemption(client, couponId, orderId);
    }

    const items = [];
    for (const line of resolved) {
      const itemId = createId("oi");
      const { rows } = await client.query(
        `INSERT INTO order_items (
           id, order_id, product_id, bundle_id, quantity, unit_price, name, slug, image
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          itemId,
          orderId,
          line.productId,
          line.bundleId,
          line.quantity,
          line.unitPrice,
          line.name,
          line.slug,
          line.image,
        ],
      );
      items.push(mapOrderItem(rows[0]));
    }

    const paymentGateway = input.paymentMethod === "online" ? "safepay" : "cod";
    const paymentStatus =
      input.paymentMethod === "online" ? "awaiting_payment" : "pending_collection";
    const { rows: paymentRows } = await client.query(
      `INSERT INTO payments (id, order_id, gateway, status, transaction_ref, amount, paid_at)
       VALUES ($1, $2, $3, $4, NULL, $5, NULL)
       RETURNING *`,
      [paymentId, orderId, paymentGateway, paymentStatus, total],
    );

    const { rows: shipmentRows } = await client.query(
      `INSERT INTO shipments (
         id, order_id, courier_name, tracking_number, status, dispatched_at, delivered_at
       ) VALUES ($1, $2, NULL, NULL, 'pending', NULL, NULL)
       RETURNING *`,
      [shipmentId, orderId],
    );

    await client.query("COMMIT");

    return mapOrder(
      orderRows[0],
      items,
      mapPayment(paymentRows[0]),
      mapShipment(shipmentRows[0]),
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function lookupOrder(
  orderNumber: string,
  phone: string,
): Promise<Order | null> {
  const number = normalizeOrderNumber(orderNumber);
  const digits = normalizePhone(phone);
  if (!number || !digits) return null;

  await expireStaleOnlineReservations();
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT *
     FROM orders
     WHERE upper(order_number) = $1
       AND regexp_replace(shipping_phone, '[^0-9]', '', 'g') = $2
     LIMIT 1`,
    [number, digits],
  );
  if (!rows[0]) return null;

  const orderId = rows[0].id as string;
  const [payments, shipments] = await Promise.all([
    pool.query(`SELECT 1 FROM payments WHERE order_id = $1 LIMIT 1`, [orderId]),
    pool.query(`SELECT 1 FROM shipments WHERE order_id = $1 LIMIT 1`, [orderId]),
  ]);

  if (!payments.rows[0] || !shipments.rows[0]) return null;

  const { refreshShipmentFromCourier } = await import("@/lib/db/shipments");
  await refreshShipmentFromCourier(orderId);
  return hydrateOrder(orderId);
}

async function hydrateOrder(orderId: string): Promise<Order | null> {
  const pool = getPool();
  const { rows } = await pool.query(`SELECT * FROM orders WHERE id = $1`, [
    orderId,
  ]);
  if (!rows[0]) return null;
  const [items, payments, shipments] = await Promise.all([
    pool.query(`SELECT * FROM order_items WHERE order_id = $1 ORDER BY id`, [
      orderId,
    ]),
    pool.query(`SELECT * FROM payments WHERE order_id = $1 LIMIT 1`, [orderId]),
    pool.query(`SELECT * FROM shipments WHERE order_id = $1 LIMIT 1`, [orderId]),
  ]);
  if (!payments.rows[0] || !shipments.rows[0]) return null;
  return mapOrder(
    rows[0],
    items.rows.map(mapOrderItem),
    mapPayment(payments.rows[0]),
    mapShipment(shipments.rows[0]),
  );
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const number = normalizeOrderNumber(orderNumber);
  if (!number) return null;
  const { rows } = await getPool().query(
    `SELECT id FROM orders WHERE upper(order_number) = $1 LIMIT 1`,
    [number],
  );
  if (!rows[0]) return null;
  return hydrateOrder(rows[0].id as string);
}

export async function setPaymentTracker(orderId: string, tracker: string) {
  await getPool().query(
    `UPDATE payments SET transaction_ref = $2 WHERE order_id = $1`,
    [orderId, tracker],
  );
}

export async function applySafepayPayment(input: {
  tracker: string;
  orderId?: string;
  orderNumber?: string;
  outcome: "paid" | "failed";
}): Promise<Order | null> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT o.id
       FROM orders o
       JOIN payments p ON p.order_id = o.id
       WHERE p.transaction_ref = $1
          OR o.id = $2
          OR upper(o.order_number) = upper($3)
       LIMIT 1
       FOR UPDATE OF o`,
      [input.tracker || null, input.orderId || null, input.orderNumber || null],
    );
    if (!rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }
    const orderId = rows[0].id as string;
    const current = await client.query(
      `SELECT status FROM payments WHERE order_id = $1 FOR UPDATE`,
      [orderId],
    );
    const paymentStatus = current.rows[0]?.status as string | undefined;
    if (paymentStatus === "paid") {
      await client.query("COMMIT");
      return hydrateOrder(orderId);
    }

    await expireStaleOnlineReservationsOn(client, orderId);

    if (input.outcome === "paid") {
      const again = await client.query(
        `SELECT status FROM payments WHERE order_id = $1`,
        [orderId],
      );
      let nextStatus: Order["status"] = "confirmed";
      let reviewReason: string | null = null;
      if (again.rows[0]?.status === "payment_failed") {
        const hold = await reholdOnlineStock(client, orderId);
        if (hold === "unavailable") {
          nextStatus = "needs_review";
          reviewReason =
            "Paid after the checkout hold expired, but stock is no longer available. Refund or source the item manually.";
        }
      }
      await client.query(
        `UPDATE payments
         SET status = 'paid',
             gateway = 'safepay',
             transaction_ref = COALESCE($2, transaction_ref),
             paid_at = now()
         WHERE order_id = $1`,
        [orderId, input.tracker || null],
      );
      await client.query(
        `UPDATE orders SET status = $2, review_reason = $3 WHERE id = $1`,
        [orderId, nextStatus, reviewReason],
      );
    } else {
      await releaseHeldOnlineStock(client, orderId);
      await client.query(
        `UPDATE payments
         SET transaction_ref = COALESCE($2, transaction_ref),
             gateway = 'safepay'
         WHERE order_id = $1`,
        [orderId, input.tracker || null],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  if (input.tracker) {
    const byRef = await getPool().query(
      `SELECT order_id FROM payments WHERE transaction_ref = $1 LIMIT 1`,
      [input.tracker],
    );
    if (byRef.rows[0]) return hydrateOrder(byRef.rows[0].order_id as string);
  }
  if (input.orderId) return hydrateOrder(input.orderId);
  if (input.orderNumber) return getOrderByNumber(input.orderNumber);
  return null;
}

export async function switchOrderToCod(
  orderNumber: string,
  phone: string,
): Promise<Order> {
  const order = await lookupOrder(orderNumber, phone);
  if (!order) {
    throw new OrderError("NOT_FOUND", "No order matched that number and phone.");
  }
  if (order.payment.status === "paid") {
    throw new OrderError("VALIDATION", "This order is already paid.");
  }
  if (order.paymentMethod === "cod" && order.payment.status === "pending_collection") {
    return order;
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT status FROM payments WHERE order_id = $1 FOR UPDATE`,
      [order.id],
    );
    const status = rows[0]?.status as string | undefined;
    if (status === "paid") {
      throw new OrderError("VALIDATION", "This order is already paid.");
    }
    if (status !== "awaiting_payment") {
      await applyStockDelta(client, await stockNeedsForOrder(client, order.id), "decrement");
    }
    await client.query(
      `UPDATE orders SET status = 'pending', payment_method = 'cod' WHERE id = $1`,
      [order.id],
    );
    await client.query(
      `UPDATE payments
       SET gateway = 'cod', status = 'pending_collection', paid_at = NULL
       WHERE order_id = $1`,
      [order.id],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const next = await hydrateOrder(order.id);
  if (!next) {
    throw new OrderError("NOT_FOUND", "Could not update that order.");
  }
  return next;
}

export async function getOrderById(orderId: string) {
  return hydrateOrder(orderId);
}

/** Restore inventory once when a shipment comes back (RTO). */
export async function markOrderReturnedAndRestoreStock(orderId: string) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const restored = await markOrderReturnedAndRestoreStockOn(client, orderId);
    await client.query("COMMIT");
    return restored;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function markOrderReturnedAndRestoreStockOn(
  client: PoolClient,
  orderId: string,
) {
  const { rows } = await client.query(
    `SELECT status FROM orders WHERE id = $1 FOR UPDATE`,
    [orderId],
  );
  if (!rows[0]) return false;
  const previous = String(rows[0].status);
  if (previous === "returned") return false;
  const stockStillHeld =
    previous !== "payment_failed" && previous !== "needs_review";
  if (stockStillHeld) {
    const needed = await stockNeedsForOrder(client, orderId);
    await applyStockDelta(client, needed, "increment");
  }
  await client.query(`UPDATE orders SET status = 'returned' WHERE id = $1`, [
    orderId,
  ]);
  await client.query(
    `UPDATE shipments
     SET status = 'returned',
         last_event = COALESCE(last_event, 'Returned to origin')
     WHERE order_id = $1`,
    [orderId],
  );
  return stockStillHeld;
}

export async function prepareOnlinePaymentRetry(orderId: string) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await expireStaleOnlineReservationsOn(client, orderId);
    const hold = await reholdOnlineStock(client, orderId);
    if (hold === "paid") {
      throw new OrderError("VALIDATION", "This order is already paid.");
    }
    if (hold === "unavailable") {
      throw new OrderError(
        "INSUFFICIENT_STOCK",
        "That item sold while payment was pending. Contact us to retry or refund.",
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
