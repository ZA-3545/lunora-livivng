import { applyCourierTrackingEvent } from "@/lib/db/shipments";
import { verifyLeopardsWebhook } from "@/lib/couriers/leopards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json({ ok: true, courier: "leopards" });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-leopards-signature") ??
    request.headers.get("X-Leopards-Signature");
  const timestamp =
    request.headers.get("x-leopards-timestamp") ??
    request.headers.get("X-Leopards-Timestamp");

  if (!verifyLeopardsWebhook(rawBody, signature, timestamp)) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const body = payload as {
    tracking_number?: string;
    track_number?: string;
    status?: string;
    packet_status?: string;
  };
  const tracking = String(body.tracking_number ?? body.track_number ?? "");
  const rawStatus = String(body.status ?? body.packet_status ?? "");
  if (!tracking || !rawStatus) {
    return Response.json({ error: "Missing tracking number or status." }, { status: 400 });
  }

  const order = await applyCourierTrackingEvent({
    trackingNumber: tracking,
    rawStatus,
  });
  if (!order) {
    return Response.json({ error: "Shipment not found." }, { status: 404 });
  }

  return Response.json({
    ok: true,
    orderNumber: order.orderNumber,
    orderStatus: order.status,
    shipmentStatus: order.shipment.status,
  });
}
