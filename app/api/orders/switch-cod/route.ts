import { handleOrderError } from "@/app/api/_utils";
import { switchOrderToCod } from "@/lib/db/orders";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderNumber?: string;
      phone?: string;
    };
    const order = await switchOrderToCod(
      body.orderNumber ?? "",
      body.phone ?? "",
    );
    return Response.json({ order });
  } catch (error) {
    return handleOrderError(error);
  }
}
