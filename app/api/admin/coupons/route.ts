import { requireAdminApi } from "@/lib/admin/guard";
import { createAdminCoupon, isUniqueViolation, listAdminCoupons } from "@/lib/admin/db";
import { parseCouponBody } from "@/lib/admin/parse";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const coupons = await listAdminCoupons();
  return Response.json({ coupons });
}

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = await createAdminCoupon(parseCouponBody(body));
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return Response.json({ error: "That code is already in use." }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Could not save coupon.";
    return Response.json({ error: message }, { status: 400 });
  }
}
