import { loadLocalEnv } from "./env";
import { createOrder } from "../lib/db/orders";
import {
  applyCourierTrackingEvent,
  packAndBookShipment,
} from "../lib/db/shipments";
import { closePool, getPool } from "../lib/db/pool";
import { OrderError } from "../lib/db/errors";

const PRODUCT_ID = "p1";

async function stockOf(id: string) {
  const { rows } = await getPool().query(
    "SELECT stock_qty FROM products WHERE id = $1",
    [id],
  );
  return Number(rows[0].stock_qty);
}

async function main() {
  loadLocalEnv();
  const pool = getPool();

  const beforeCreate = await stockOf(PRODUCT_ID);
  const order = await createOrder({
    lines: [{ productId: PRODUCT_ID, quantity: 1 }],
    shipping: {
      name: "Courier Phase 8",
      phone: "03019876543",
      addressLine: "12 Canal Road",
      city: "Lahore",
    },
    paymentMethod: "cod",
  });
  const afterCreate = await stockOf(PRODUCT_ID);

  const raceOrder = await createOrder({
    lines: [{ productId: PRODUCT_ID, quantity: 1 }],
    shipping: {
      name: "Courier Double Click",
      phone: "03015556666",
      addressLine: "8 Race Avenue",
      city: "Lahore",
    },
    paymentMethod: "cod",
  });
  const raced = await Promise.all([
    packAndBookShipment(raceOrder.id),
    packAndBookShipment(raceOrder.id),
  ]);
  const { rows: raceRows } = await pool.query(
    `SELECT tracking_number FROM shipments WHERE order_id = $1`,
    [raceOrder.id],
  );

  const first = await packAndBookShipment(order.id);
  const second = await packAndBookShipment(order.id);
  const { rows: bookings } = await pool.query(
    `SELECT tracking_number FROM shipments WHERE order_id = $1`,
    [order.id],
  );

  const beforeRto = await stockOf(PRODUCT_ID);
  const returned = await applyCourierTrackingEvent({
    trackingNumber: first.shipment.trackingNumber ?? "",
    rawStatus: "RTO — delivery failed",
  });
  const afterRto = await stockOf(PRODUCT_ID);
  const again = await applyCourierTrackingEvent({
    trackingNumber: first.shipment.trackingNumber ?? "",
    rawStatus: "Returned to origin",
  });
  const afterSecondRto = await stockOf(PRODUCT_ID);

  process.env.LEOPARDS_FORCE_FAIL = "true";
  const failOrder = await createOrder({
    lines: [{ productId: PRODUCT_ID, quantity: 1 }],
    shipping: {
      name: "Courier Fail",
      phone: "03011112222",
      addressLine: "1 Fail Street",
      city: "Lahore",
    },
    paymentMethod: "cod",
  });
  let failError = "";
  try {
    await packAndBookShipment(failOrder.id);
  } catch (error) {
    if (error instanceof OrderError) failError = `${error.code}: ${error.message}`;
    else throw error;
  }
  const { rows: failRows } = await pool.query(
    `SELECT o.status AS order_status, s.tracking_number, s.status AS ship_status
     FROM orders o JOIN shipments s ON s.order_id = o.id
     WHERE o.id = $1`,
    [failOrder.id],
  );

  const report = {
    courier: "Leopards",
    orderNumber: order.orderNumber,
    stockBeforeCreate: beforeCreate,
    stockAfterCreate: afterCreate,
    firstStatus: first.status,
    firstTracking: first.shipment.trackingNumber,
    secondStatus: second.status,
    secondTracking: second.shipment.trackingNumber,
    sameTracking: first.shipment.trackingNumber === second.shipment.trackingNumber,
    shipmentRows: bookings.length,
    raceTrackings: raced.map((row) => row.shipment.trackingNumber),
    raceSameTracking:
      raced[0].shipment.trackingNumber === raced[1].shipment.trackingNumber,
    raceShipmentRows: raceRows.length,
    stockBeforeRto: beforeRto,
    rtoOrderStatus: returned?.status,
    rtoShipmentStatus: returned?.shipment.status,
    stockAfterRto: afterRto,
    secondRtoStatus: again?.status,
    stockAfterSecondRto: afterSecondRto,
    failError,
    failOrderStatus: failRows[0]?.order_status,
    failTracking: failRows[0]?.tracking_number,
  };
  console.log(JSON.stringify(report, null, 2));

  const ok =
    afterCreate === beforeCreate - 1 &&
    first.status === "shipped" &&
    Boolean(first.shipment.trackingNumber) &&
    first.shipment.trackingNumber === second.shipment.trackingNumber &&
    bookings.length === 1 &&
    raced[0].shipment.trackingNumber === raced[1].shipment.trackingNumber &&
    raceRows.length === 1 &&
    returned?.status === "returned" &&
    afterRto === afterCreate &&
    afterRto === beforeRto + 1 &&
    afterSecondRto === afterRto &&
    failError.startsWith("COURIER_FAILED") &&
    failRows[0]?.order_status === "packed" &&
    !failRows[0]?.tracking_number;

  if (!ok) {
    throw new Error("Courier Phase 8 checks failed. See report above.");
  }
}

main()
  .then(async () => {
    await closePool();
  })
  .catch(async (error) => {
    console.error(error);
    await closePool();
    process.exit(1);
  });
