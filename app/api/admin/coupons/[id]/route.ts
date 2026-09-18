import { requireAdminApi } from "@/lib/admin/guard";
import {
  deleteAdminCoupon,
  isUniqueViolation,
  updateAdminCoupon,
} from "@/lib/admin/db";
import { parseCouponBody } from "@/lib/admin/parse";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id } = await params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const ok = await updateAdminCoupon(id, parseCouponBody(body));
    if (!ok) return Response.json({ error: "Coupon not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return Response.json({ error: "That code is already in use." }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Could not save coupon.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id } = await params;
  const ok = await deleteAdminCoupon(id);
  if (!ok) return Response.json({ error: "Coupon not found." }, { status: 404 });
  return Response.json({ ok: true });
}
