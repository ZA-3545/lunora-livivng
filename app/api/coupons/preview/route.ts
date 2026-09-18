import { handleOrderError } from "@/app/api/_utils";
import { previewCoupon } from "@/lib/db/coupons";
import { getPool } from "@/lib/db/pool";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      code?: unknown;
      subtotal?: unknown;
    };
    const code = String(body.code ?? "");
    const subtotal = Math.max(0, Math.floor(Number(body.subtotal) || 0));
    const client = await getPool().connect();
    try {
      const { coupon, discount } = await previewCoupon(client, code, subtotal);
      return Response.json({
        code: coupon.code,
        discount,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    return handleOrderError(error);
  }
}
