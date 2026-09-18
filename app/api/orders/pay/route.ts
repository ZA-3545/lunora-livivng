import { handleOrderError } from "@/app/api/_utils";
import {
  lookupOrder,
  prepareOnlinePaymentRetry,
  setPaymentTracker,
} from "@/lib/db/orders";
import { OrderError } from "@/lib/db/errors";
import { createSafepayCheckout } from "@/lib/payments/safepay";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderNumber?: string;
      phone?: string;
    };
    const order = await lookupOrder(body.orderNumber ?? "", body.phone ?? "");
    if (!order) {
      throw new OrderError("NOT_FOUND", "No order matched that number and phone.");
    }
    if (order.payment.status === "paid") {
      throw new OrderError("VALIDATION", "This order is already paid.");
    }
    await prepareOnlinePaymentRetry(order.id);
    const session = await createSafepayCheckout({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountPkr: order.total,
    });
    await setPaymentTracker(order.id, session.tracker);
    return Response.json({ checkoutUrl: session.checkoutUrl, order });
  } catch (error) {
    return handleOrderError(error);
  }
}
