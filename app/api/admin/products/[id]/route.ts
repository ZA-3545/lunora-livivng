import { requireAdminApi } from "@/lib/admin/guard";
import {
  deleteAdminProduct,
  isUniqueViolation,
  updateAdminProduct,
} from "@/lib/admin/db";
import { parseProductBody } from "@/lib/admin/parse";

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
    const ok = await updateAdminProduct(id, parseProductBody(body));
    if (!ok) return Response.json({ error: "Product not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return Response.json({ error: "That slug is already in use." }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Could not save product.";
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
  try {
    const ok = await deleteAdminProduct(id);
    if (!ok) return Response.json({ error: "Product not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete product.";
    return Response.json({ error: message }, { status: 409 });
  }
}
