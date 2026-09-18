import { loadLocalEnv } from "./env";
import { OrderError } from "../lib/db/errors";
import { createId } from "../lib/commerce";
import { createOrder } from "../lib/db/orders";
import { closePool, getPool } from "../lib/db/pool";

const PRODUCT_ID = "p1";

async function attemptOrder(label: string) {
  try {
    const order = await createOrder({
      lines: [{ productId: PRODUCT_ID, quantity: 1 }],
      shipping: {
        name: `Oversell Test ${label}`,
        phone: "03001234567",
        addressLine: "1 Test Street",
        city: "Lahore",
      },
      paymentMethod: "cod",
    });
    return { ok: true as const, orderNumber: order.orderNumber };
  } catch (error) {
    if (error instanceof OrderError && error.code === "INSUFFICIENT_STOCK") {
      return { ok: false as const, message: error.message };
    }
    throw error;
  }
}

async function main() {
  loadLocalEnv();
  const pool = getPool();

  const before = await pool.query(
    "SELECT stock_qty FROM products WHERE id = $1",
    [PRODUCT_ID],
  );
  if (!before.rows[0]) {
    throw new Error(`Product ${PRODUCT_ID} is missing. Run db:seed first.`);
  }
  const originalStock = Number(before.rows[0].stock_qty);

  await pool.query("UPDATE products SET stock_qty = 1 WHERE id = $1", [
    PRODUCT_ID,
  ]);

  const results = await Promise.all([attemptOrder("A"), attemptOrder("B")]);

  await pool.query("UPDATE products SET stock_qty = 1 WHERE id = $1", [
    PRODUCT_ID,
  ]);
  const onlineRace = await Promise.all([
    (async () => {
      try {
        const order = await createOrder({
          lines: [{ productId: PRODUCT_ID, quantity: 1 }],
          shipping: {
            name: "Online Race A",
            phone: "03001234567",
            addressLine: "1 Test Street",
            city: "Lahore",
          },
          paymentMethod: "online",
        });
        return { ok: true as const, orderNumber: order.orderNumber };
      } catch (error) {
        if (error instanceof OrderError && error.code === "INSUFFICIENT_STOCK") {
          return { ok: false as const, message: error.message };
        }
        throw error;
      }
    })(),
    (async () => {
      try {
        const order = await createOrder({
          lines: [{ productId: PRODUCT_ID, quantity: 1 }],
          shipping: {
            name: "Online Race B",
            phone: "03001234568",
            addressLine: "2 Test Street",
            city: "Lahore",
          },
          paymentMethod: "online",
        });
        return { ok: true as const, orderNumber: order.orderNumber };
      } catch (error) {
        if (error instanceof OrderError && error.code === "INSUFFICIENT_STOCK") {
          return { ok: false as const, message: error.message };
        }
        throw error;
      }
    })(),
  ]);
  const onlineSucceeded = onlineRace.filter((result) => result.ok).length;
  const onlineRejected = onlineRace.filter((result) => !result.ok).length;
  const afterOnline = await pool.query(
    "SELECT stock_qty FROM products WHERE id = $1",
    [PRODUCT_ID],
  );
  const remainingOnline = Number(afterOnline.rows[0].stock_qty);

  const couponId = createId("cpn");
  const couponCode = `QA10${couponId.slice(-4).toUpperCase()}`;
  await pool.query(
    `INSERT INTO coupons (id, code, discount_type, discount_value, min_order_value, expiry_date, usage_limit)
     VALUES ($1, $2, 'percent', 10, 0, NULL, NULL)`,
    [couponId, couponCode],
  );
  await pool.query("UPDATE products SET stock_qty = 1 WHERE id = $1", [
    PRODUCT_ID,
  ]);
  const couponRace = await Promise.all([
    (async () => {
      try {
        const order = await createOrder({
          lines: [{ productId: PRODUCT_ID, quantity: 1 }],
          shipping: {
            name: "Coupon Race A",
            phone: "03001234569",
            addressLine: "3 Test Street",
            city: "Lahore",
          },
          paymentMethod: "cod",
          couponCode,
        });
        return { ok: true as const, orderNumber: order.orderNumber };
      } catch (error) {
        if (error instanceof OrderError && error.code === "INSUFFICIENT_STOCK") {
          return { ok: false as const, message: error.message };
        }
        throw error;
      }
    })(),
    (async () => {
      try {
        const order = await createOrder({
          lines: [{ productId: PRODUCT_ID, quantity: 1 }],
          shipping: {
            name: "Coupon Race B",
            phone: "03001234570",
            addressLine: "4 Test Street",
            city: "Lahore",
          },
          paymentMethod: "cod",
          couponCode,
        });
        return { ok: true as const, orderNumber: order.orderNumber };
      } catch (error) {
        if (error instanceof OrderError && error.code === "INSUFFICIENT_STOCK") {
          return { ok: false as const, message: error.message };
        }
        throw error;
      }
    })(),
  ]);
  const couponSucceeded = couponRace.filter((result) => result.ok).length;
  const couponRejected = couponRace.filter((result) => !result.ok).length;
  const afterCoupon = await pool.query(
    "SELECT stock_qty FROM products WHERE id = $1",
    [PRODUCT_ID],
  );
  const remainingCoupon = Number(afterCoupon.rows[0].stock_qty);
  await pool.query(`DELETE FROM coupon_redemptions WHERE coupon_id = $1`, [
    couponId,
  ]);
  await pool.query(`DELETE FROM coupons WHERE id = $1`, [couponId]);
  const succeeded = results.filter((result) => result.ok);
  const rejected = results.filter((result) => !result.ok);

  const after = await pool.query(
    "SELECT stock_qty FROM products WHERE id = $1",
    [PRODUCT_ID],
  );
  const remaining = Number(after.rows[0].stock_qty);

  await pool.query("UPDATE products SET stock_qty = $2 WHERE id = $1", [
    PRODUCT_ID,
    originalStock,
  ]);

  console.log(
    JSON.stringify(
      {
        succeeded: succeeded.map((result) =>
          result.ok ? result.orderNumber : null,
        ),
        rejected: rejected.map((result) =>
          result.ok ? null : result.message,
        ),
        remainingAfterRace: remaining,
        onlineSucceeded,
        onlineRejected,
        remainingAfterOnlineRace: remainingOnline,
        couponSucceeded,
        couponRejected,
        remainingAfterCouponRace: remainingCoupon,
        restoredStock: originalStock,
      },
      null,
      2,
    ),
  );

  if (succeeded.length !== 1 || rejected.length !== 1 || remaining !== 0) {
    throw new Error(
      "Oversell test failed: expected exactly one success, one stock rejection, and remaining stock 0.",
    );
  }
  if (onlineSucceeded !== 1 || onlineRejected !== 1 || remainingOnline !== 0) {
    throw new Error(
      "Online concurrent oversell test failed: expected one paid-hold and one stock rejection.",
    );
  }
  if (couponSucceeded !== 1 || couponRejected !== 1 || remainingCoupon !== 0) {
    throw new Error(
      "Coupon concurrent oversell test failed: expected one success and one stock rejection.",
    );
  }

  console.log(
    "PASS: concurrent double-order on the same item did not oversell.",
  );
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
