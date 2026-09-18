import { shipmentStatusLabel } from "@/lib/couriers/copy";
import {
  bookLeopardsShipment,
  mapLeopardsStatus,
  trackLeopardsShipment,
} from "@/lib/couriers/leopards";
import { OrderError } from "@/lib/db/errors";
import {
  getOrderById,
  markOrderReturnedAndRestoreStockOn,
} from "@/lib/db/orders";
import { getPool } from "@/lib/db/pool";
import type { Order, ShipmentStatus } from "@/lib/types";

export { shipmentStatusLabel };

async function packetDetails(orderId: string) {
  const pool = getPool();
  const items = await pool.query(
    `SELECT oi.quantity, oi.product_id, p.weight
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId],
  );
  let grams = 0;
  let pieces = 0;
  for (const row of items.rows) {
    const qty = Number(row.quantity);
    pieces += qty;
    grams += (Number(row.weight) || 0) * qty;
  }
  return { grams: grams > 0 ? grams : 500, pieces: Math.max(1, pieces) };
}

export async function packAndBookShipment(orderId: string): Promise<Order> {
  const pool = getPool();
  const packet = await packetDetails(orderId);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderRes = await client.query(
      `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId],
    );
    const shipRes = await client.query(
      `SELECT * FROM shipments WHERE order_id = $1 FOR UPDATE`,
      [orderId],
    );
    const payRes = await client.query(
      `SELECT * FROM payments WHERE order_id = $1`,
      [orderId],
    );
    if (!orderRes.rows[0] || !shipRes.rows[0]) {
      throw new OrderError("NOT_FOUND", "Order not found.");
    }
    const orderRow = orderRes.rows[0];
    const shipRow = shipRes.rows[0];
    const payStatus = String(payRes.rows[0]?.status ?? "");

    if (
      orderRow.status === "returned" ||
      orderRow.status === "delivered" ||
      orderRow.status === "payment_failed"
    ) {
      throw new OrderError(
        "VALIDATION",
        "This order cannot be booked with the courier.",
      );
    }
    if (payStatus === "awaiting_payment") {
      throw new OrderError(
        "VALIDATION",
        "Collect or confirm payment before booking a shipment.",
      );
    }

    if (shipRow.tracking_number) {
      if (orderRow.status === "packed" || orderRow.status === "confirmed") {
        await client.query(`UPDATE orders SET status = 'shipped' WHERE id = $1`, [
          orderId,
        ]);
      }
      await client.query("COMMIT");
      const existing = await getOrderById(orderId);
      if (!existing) throw new OrderError("NOT_FOUND", "Order not found.");
      return existing;
    }

    await client.query(`UPDATE orders SET status = 'packed' WHERE id = $1`, [
      orderId,
    ]);

    const collectAmount =
      orderRow.payment_method === "cod" &&
      payRes.rows[0]?.status !== "paid"
        ? Number(orderRow.total)
        : 0;

    let booking;
    try {
      booking = await bookLeopardsShipment({
        orderNumber: orderRow.order_number,
        name: orderRow.shipping_name,
        phone: orderRow.shipping_phone,
        address: orderRow.shipping_address,
        city: orderRow.shipping_city,
        collectAmount,
        weightGrams: packet.grams,
        pieces: packet.pieces,
      });
    } catch (error) {
      await client.query("COMMIT");
      throw error;
    }

    const booked = await client.query(
      `UPDATE shipments
       SET courier_name = $2,
           tracking_number = $3,
           status = 'dispatched',
           last_event = 'Booked with Leopards',
           booked_at = now(),
           dispatched_at = now()
       WHERE order_id = $1 AND tracking_number IS NULL`,
      [orderId, booking.courierName, booking.trackingNumber],
    );
    if ((booked.rowCount ?? 0) !== 1) {
      await client.query("COMMIT");
      const existing = await getOrderById(orderId);
      if (!existing) throw new OrderError("NOT_FOUND", "Order not found.");
      return existing;
    }
    await client.query(`UPDATE orders SET status = 'shipped' WHERE id = $1`, [
      orderId,
    ]);
    await client.query("COMMIT");
  } catch (error) {
    if (error instanceof OrderError && error.code === "COURIER_FAILED") {
      throw error;
    }
    try {
      await client.query("ROLLBACK");
    } catch {
      // already committed packed after a courier failure
    }
    throw error;
  } finally {
    client.release();
  }

  const next = await getOrderById(orderId);
  if (!next) throw new OrderError("NOT_FOUND", "Order not found.");
  return next;
}

export async function applyCourierTrackingEvent(input: {
  trackingNumber: string;
  rawStatus: string;
}): Promise<Order | null> {
  const status: ShipmentStatus = mapLeopardsStatus(input.rawStatus);
  const client = await getPool().connect();
  let orderId = "";
  try {
    await client.query("BEGIN");
    const found = await client.query(
      `SELECT order_id FROM shipments WHERE tracking_number = $1`,
      [input.trackingNumber],
    );
    if (!found.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }
    orderId = found.rows[0].order_id as string;
    await client.query(`SELECT id FROM orders WHERE id = $1 FOR UPDATE`, [
      orderId,
    ]);
    const { rows } = await client.query(
      `SELECT status FROM shipments WHERE order_id = $1 FOR UPDATE`,
      [orderId],
    );
    const previous = rows[0]?.status as ShipmentStatus | undefined;
    if (previous === "returned" && status !== "returned") {
      await client.query("COMMIT");
      return getOrderById(orderId);
    }
    await client.query(
      `UPDATE shipments
       SET status = $2,
           last_event = $3,
           dispatched_at = COALESCE(dispatched_at, now()),
           delivered_at = CASE WHEN $2 = 'delivered' THEN now() ELSE delivered_at END
       WHERE order_id = $1`,
      [orderId, status, input.rawStatus],
    );
    if (status === "delivered") {
      await client.query(
        `UPDATE orders SET status = 'delivered' WHERE id = $1 AND status <> 'returned'`,
        [orderId],
      );
      await client.query(
        `UPDATE payments
         SET status = 'collected_on_delivery'
         WHERE order_id = $1 AND gateway = 'cod' AND status = 'pending_collection'`,
        [orderId],
      );
    }
    if (status === "returned") {
      await markOrderReturnedAndRestoreStockOn(client, orderId);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return getOrderById(orderId);
}

export async function refreshShipmentFromCourier(orderId: string) {
  const { rows } = await getPool().query(
    `SELECT tracking_number, status FROM shipments WHERE order_id = $1`,
    [orderId],
  );
  const tracking = rows[0]?.tracking_number as string | null | undefined;
  const status = rows[0]?.status as ShipmentStatus | undefined;
  if (!tracking || status === "delivered" || status === "returned") return;
  const raw = await trackLeopardsShipment(tracking);
  if (!raw) return;
  await applyCourierTrackingEvent({ trackingNumber: tracking, rawStatus: raw });
}
