import {
  getBundleBySlug,
  getBundleComponents,
  getBundleSeparateTotal,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const bundle = await getBundleBySlug(slug);
  if (!bundle) {
    return Response.json({ error: "Bundle not found." }, { status: 404 });
  }

  const [components, separateTotal] = await Promise.all([
    getBundleComponents(bundle.id),
    getBundleSeparateTotal(bundle.id),
  ]);

  return Response.json({
    bundle,
    components,
    separateTotal,
  });
}
