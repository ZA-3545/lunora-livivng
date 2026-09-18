import { handleOrderError } from "@/app/api/_utils";
import { requireAdminApi } from "@/lib/admin/guard";
import { isOrderStatus, updateAdminOrderStatus } from "@/lib/admin/db";
import { markOrderReturnedAndRestoreStock } from "@/lib/db/orders";
import { packAndBookShipment } from "@/lib/db/shipments";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  const status = String(body?.status ?? "") as OrderStatus;
  if (!isOrderStatus(status)) {
    return Response.json({ error: "Invalid order status." }, { status: 400 });
  }

  try {
    if (status === "packed") {
      const order = await packAndBookShipment(id);
      return Response.json({
        ok: true,
        status: order.status,
        trackingNumber: order.shipment.trackingNumber,
        courierName: order.shipment.courierName,
      });
    }
    if (status === "returned") {
      await markOrderReturnedAndRestoreStock(id);
      return Response.json({ ok: true, status: "returned" });
    }
    const ok = await updateAdminOrderStatus(id, status);
    if (!ok) return Response.json({ error: "Order not found." }, { status: 404 });
    return Response.json({ ok: true, status });
  } catch (error) {
    return handleOrderError(error);
  }
}
