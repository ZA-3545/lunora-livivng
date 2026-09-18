import type { CartLine } from "@/lib/types";

export type CatalogIdSlug = { id: string; slug: string };

/**
 * Keep lines that still exist in the live catalog.
 * If an ID is gone but the stored slug still matches, rewrite the ID.
 * Drop the line if neither the ID nor the slug resolves.
 */
export function reconcileCartLines(
  lines: CartLine[],
  products: CatalogIdSlug[],
  bundles: CatalogIdSlug[],
): CartLine[] {
  return lines.flatMap((line) => {
    if (line.productId) {
      if (products.some((product) => product.id === line.productId)) return [line];
      const match = products.find((product) => product.slug === line.slug);
      return match ? [{ ...line, productId: match.id }] : [];
    }
    if (line.bundleId) {
      if (bundles.some((bundle) => bundle.id === line.bundleId)) return [line];
      const match = bundles.find((bundle) => bundle.slug === line.slug);
      return match ? [{ ...line, bundleId: match.id }] : [];
    }
    return [];
  });
}

export function cartLinesEqual(a: CartLine[], b: CartLine[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((line, index) => {
    const other = b[index];
    return (
      line.id === other.id &&
      line.productId === other.productId &&
      line.bundleId === other.bundleId &&
      line.quantity === other.quantity &&
      line.slug === other.slug
    );
  });
}
