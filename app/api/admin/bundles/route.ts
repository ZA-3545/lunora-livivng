import { requireAdminApi } from "@/lib/admin/guard";
import { createAdminBundle, isUniqueViolation, listAdminBundles } from "@/lib/admin/db";
import { parseBundleBody } from "@/lib/admin/parse";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const bundles = await listAdminBundles();
  return Response.json({ bundles });
}

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = await createAdminBundle(parseBundleBody(body));
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return Response.json({ error: "That slug is already in use." }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Could not save bundle.";
    return Response.json({ error: message }, { status: 400 });
  }
}
