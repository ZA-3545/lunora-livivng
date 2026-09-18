import { applySafepayPayment } from "@/lib/db/orders";
import {
  extractSafepayEvent,
  SAFEPAY_FAILURE_EVENTS,
  SAFEPAY_SUCCESS_EVENTS,
  verifySafepayWebhook,
} from "@/lib/payments/safepay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({ ok: true, gateway: "safepay" });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-sfpy-signature") ??
    request.headers.get("X-SFPY-SIGNATURE");
  const timestamp =
    request.headers.get("x-sfpy-timestamp") ??
    request.headers.get("X-SFPY-TIMESTAMP");

  if (!verifySafepayWebhook(rawBody, signature, timestamp)) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const event = extractSafepayEvent(payload);
  const isSuccess =
    SAFEPAY_SUCCESS_EVENTS.has(event.type) ||
    (event.success && !SAFEPAY_FAILURE_EVENTS.has(event.type));
  const isFailure = SAFEPAY_FAILURE_EVENTS.has(event.type);

  if (!isSuccess && !isFailure) {
    return Response.json({ ok: true, ignored: event.type });
  }

  const order = await applySafepayPayment({
    tracker: event.tracker,
    orderId: event.orderId,
    orderNumber: event.orderNumber,
    outcome: isSuccess ? "paid" : "failed",
  });

  if (!order) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  return Response.json({
    ok: true,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.payment.status,
  });
}
