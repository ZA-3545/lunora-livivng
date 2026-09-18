import { applySafepayPayment, getOrderByNumber } from "@/lib/db/orders";
import {
  safepayConfig,
  signSafepayWebhook,
  verifySafepayWebhook,
} from "@/lib/payments/safepay";

export const dynamic = "force-dynamic";

/** Local sandbox only: signs a Safepay-shaped payload and applies it through the real verifier. */
export async function POST(request: Request) {
  if (!safepayConfig().simulate) {
    return Response.json({ error: "Sandbox simulator is off." }, { status: 404 });
  }

  const body = (await request.json()) as {
    orderNumber?: string;
    tracker?: string;
    outcome?: "paid" | "failed";
  };
  const orderNumber = String(body.orderNumber ?? "");
  const tracker = String(body.tracker ?? "");
  const outcome = body.outcome === "failed" ? "failed" : "paid";
  const order = await getOrderByNumber(orderNumber);
  if (!order || !tracker) {
    return Response.json({ error: "Unknown sandbox order." }, { status: 404 });
  }

  const payload = {
    type: outcome === "paid" ? "payment.completed" : "payment.failed",
    success: outcome === "paid",
    data: {
      tracker,
      metadata: { order_id: order.id, order_number: order.orderNumber },
    },
  };
  const rawBody = JSON.stringify(payload);
  const timestamp = new Date().toISOString();
  const signature = signSafepayWebhook(rawBody, timestamp);
  if (!verifySafepayWebhook(rawBody, signature, timestamp)) {
    return Response.json(
      { error: "Sandbox signature verification failed." },
      { status: 401 },
    );
  }

  const updated = await applySafepayPayment({
    tracker,
    orderId: order.id,
    orderNumber: order.orderNumber,
    outcome,
  });
  return Response.json({ order: updated });
}
