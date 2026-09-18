import { handleOrderError } from "@/app/api/_utils";
import { createOrder, setPaymentTracker } from "@/lib/db/orders";
import type { CreateOrderInput } from "@/lib/db/orders";
import { createSafepayCheckout } from "@/lib/payments/safepay";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderInput;
    const order = await createOrder(body);
    if (order.paymentMethod !== "online") {
      return Response.json({ order }, { status: 201 });
    }
    const session = await createSafepayCheckout({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountPkr: order.total,
    });
    await setPaymentTracker(order.id, session.tracker);
    order.payment.transactionRef = session.tracker;
    return Response.json(
      { order, checkoutUrl: session.checkoutUrl },
      { status: 201 },
    );
  } catch (error) {
    return handleOrderError(error);
  }
}
