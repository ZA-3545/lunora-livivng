import { createHmac } from "node:crypto";

const BASE = "http://127.0.0.1:3000";
const ADMIN_PASSWORD = "lunora-admin-dev";
const WEBHOOK_SECRET = "lunora-leopards-webhook";

async function json(path, init = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body, headers: response.headers };
}

function sign(raw, timestamp) {
  return `sha256=${createHmac("sha256", WEBHOOK_SECRET)
    .update(`${timestamp}.${raw}`)
    .digest("hex")}`;
}

async function main() {
  const created = await json("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      lines: [{ productId: "p1", quantity: 1 }],
      shipping: {
        name: "Phase 8 Browser",
        phone: "03017654321",
        addressLine: "44 Mall Road",
        city: "Lahore",
      },
      paymentMethod: "cod",
    }),
  });
  if (created.status !== 201) {
    throw new Error(`create failed ${created.status} ${JSON.stringify(created.body)}`);
  }
  const order = created.body.order;
  const login = await json("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  if (login.status !== 200) {
    throw new Error(`login failed ${login.status}`);
  }
  const cookie = login.headers.get("set-cookie") ?? "";

  const packed = await json(`/api/admin/orders/${order.id}`, {
    method: "PATCH",
    headers: { Cookie: cookie },
    body: JSON.stringify({ status: "packed" }),
  });
  const packedAgain = await json(`/api/admin/orders/${order.id}`, {
    method: "PATCH",
    headers: { Cookie: cookie },
    body: JSON.stringify({ status: "packed" }),
  });

  const lookup = await json(
    `/api/orders/lookup?orderNumber=${encodeURIComponent(order.orderNumber)}&phone=03017654321`,
  );

  const adminPage = await fetch(`${BASE}/admin/orders`, {
    headers: { Cookie: cookie },
  });
  const adminHtml = await adminPage.text();

  const trackPage = await fetch(`${BASE}/track-order`);
  const trackHtml = await trackPage.text();

  const timestamp = String(Math.floor(Date.now() / 1000));
  const raw = JSON.stringify({
    tracking_number: packed.body.trackingNumber,
    status: "In Transit",
  });
  const webhook = await json("/api/couriers/leopards/webhook", {
    method: "POST",
    headers: {
      "x-leopards-signature": sign(raw, timestamp),
      "x-leopards-timestamp": timestamp,
    },
    body: raw,
  });

  const lookup2 = await json(
    `/api/orders/lookup?orderNumber=${encodeURIComponent(order.orderNumber)}&phone=03017654321`,
  );

  const report = {
    orderNumber: order.orderNumber,
    packedStatus: packed.status,
    packedBody: packed.body,
    packedAgainBody: packedAgain.body,
    sameTracking:
      packed.body.trackingNumber &&
      packed.body.trackingNumber === packedAgain.body.trackingNumber,
    lookupStatus: lookup.status,
    lookupTracking: lookup.body.order?.shipment?.trackingNumber,
    lookupOrderStatus: lookup.body.order?.status,
    adminHasTracking: adminHtml.includes(packed.body.trackingNumber ?? "___"),
    trackPageOk: trackPage.status === 200 && trackHtml.includes("Track order"),
    webhook: webhook.body,
    afterWebhookShipment: lookup2.body.order?.shipment,
  };
  console.log(JSON.stringify(report, null, 2));

  if (
    packed.body.status !== "shipped" ||
    !packed.body.trackingNumber ||
    !report.sameTracking ||
    lookup.body.order?.shipment?.trackingNumber !== packed.body.trackingNumber ||
    !report.adminHasTracking ||
    lookup2.body.order?.shipment?.status !== "in_transit"
  ) {
    throw new Error("HTTP courier e2e failed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
