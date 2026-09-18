import { getProductBySlug } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return Response.json({ error: "Product not found." }, { status: 404 });
  }
  return Response.json({ product });
}
