import {
  getBundleSeparateTotal,
  getBundleTeaser,
  getBundles,
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const bundles = await getBundles();
  const items = await Promise.all(
    bundles.map(async (bundle) => ({
      ...bundle,
      separateTotal: await getBundleSeparateTotal(bundle.id),
      teaser: await getBundleTeaser(bundle.id),
    })),
  );
  return Response.json({ bundles: items });
}
