import { requireAdminApi } from "@/lib/admin/guard";
import { createAdminProduct, isUniqueViolation, listAdminProducts } from "@/lib/admin/db";
import { parseProductBody } from "@/lib/admin/parse";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const products = await listAdminProducts();
  return Response.json({ products });
}

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = await createAdminProduct(parseProductBody(body));
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return Response.json({ error: "That slug is already in use." }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Could not save product.";
    return Response.json({ error: message }, { status: 400 });
  }
}
