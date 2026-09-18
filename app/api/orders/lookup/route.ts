import { lookupOrder } from "@/lib/db/orders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("orderNumber") ?? "";
  const phone = url.searchParams.get("phone") ?? "";
  const order = await lookupOrder(orderNumber, phone);
  if (!order) {
    return Response.json(
      { error: "No order matched that number and phone." },
      { status: 404 },
    );
  }
  return Response.json({ order });
}
