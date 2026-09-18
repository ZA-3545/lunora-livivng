import { cache } from "react";
import { homepagePicks } from "@/lib/homepage-picks";
import { giftingEdit, getRoomEditMeta, roomEdits } from "@/lib/room-edits";
import { getPool } from "@/lib/db/pool";
import { mapBundle, mapCategory, mapProduct } from "@/lib/db/mappers";
import type {
  Bundle,
  CatalogItem,
  Category,
  Product,
  ShopFilters,
  ResolvedWishlistEntry,
  WishlistItem,
} from "@/lib/types";

type BundleItemRow = {
  id: string;
  bundle_id: string;
  product_id: string;
  quantity: number;
};

type CatalogSnapshot = {
  categories: Category[];
  products: Product[];
  bundles: Bundle[];
  bundleItems: BundleItemRow[];
};

export const loadCatalog = cache(async (): Promise<CatalogSnapshot> => {
  const pool = getPool();
  const [categories, products, bundles, bundleItems] = await Promise.all([
    pool.query("SELECT * FROM categories ORDER BY id"),
    pool.query(
      "SELECT * FROM products WHERE status = 'active' ORDER BY id",
    ),
    pool.query("SELECT * FROM bundles ORDER BY id"),
    pool.query("SELECT * FROM bundle_items ORDER BY id"),
  ]);

  return {
    categories: categories.rows.map(mapCategory),
    products: products.rows.map(mapProduct),
    bundles: bundles.rows.map(mapBundle),
    bundleItems: bundleItems.rows as BundleItemRow[],
  };
});

export async function getCategories(): Promise<Category[]> {
  const catalog = await loadCatalog();
  return catalog.categories;
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | undefined> {
  const catalog = await loadCatalog();
  return catalog.categories.find((category) => category.slug === slug);
}

export async function getCategoryById(
  id: string,
): Promise<Category | undefined> {
  const catalog = await loadCatalog();
  return catalog.categories.find((category) => category.id === id);
}

export async function getProducts(): Promise<Product[]> {
  const catalog = await loadCatalog();
  return catalog.products;
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  const catalog = await loadCatalog();
  return catalog.products.find((product) => product.slug === slug);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const catalog = await loadCatalog();
  return catalog.products.find((product) => product.id === id);
}

export async function getBundles(): Promise<Bundle[]> {
  const catalog = await loadCatalog();
  return catalog.bundles;
}

export async function getBundleBySlug(
  slug: string,
): Promise<Bundle | undefined> {
  const catalog = await loadCatalog();
  return catalog.bundles.find((bundle) => bundle.slug === slug);
}

export async function getBundleById(id: string): Promise<Bundle | undefined> {
  const catalog = await loadCatalog();
  return catalog.bundles.find((bundle) => bundle.id === id);
}

export async function getBundleSeparateTotal(bundleId: string): Promise<number> {
  const catalog = await loadCatalog();
  return catalog.bundleItems
    .filter((item) => item.bundle_id === bundleId)
    .reduce((sum, item) => {
      const product = catalog.products.find((row) => row.id === item.product_id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
}

export async function getBundleComponents(bundleId: string) {
  const catalog = await loadCatalog();
  return catalog.bundleItems
    .filter((item) => item.bundle_id === bundleId)
    .flatMap((item) => {
      const product = catalog.products.find((row) => row.id === item.product_id);
      return product ? [{ product, quantity: item.quantity }] : [];
    });
}

export async function getBundleTeaser(bundleId: string): Promise<string> {
  const components = await getBundleComponents(bundleId);
  return components.map(({ product }) => product.name).join(", ");
}

function bundleIncludesCategory(
  catalog: CatalogSnapshot,
  bundleId: string,
  categoryId: string,
) {
  return catalog.bundleItems
    .filter((item) => item.bundle_id === bundleId)
    .some((item) => {
      const product = catalog.products.find((row) => row.id === item.product_id);
      return product?.categoryId === categoryId;
    });
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const catalog = await loadCatalog();
  const sameCategory = catalog.products.filter(
    (item) => item.categoryId === product.categoryId && item.id !== product.id,
  );
  const extras = catalog.products.filter(
    (item) =>
      item.id !== product.id &&
      !sameCategory.some((related) => related.id === item.id),
  );
  return [...sameCategory, ...extras].slice(0, limit);
}

export async function getRelatedBundles(limit = 3): Promise<Bundle[]> {
  const catalog = await loadCatalog();
  return catalog.bundles.slice(0, limit);
}

export async function getFeaturedBundles(): Promise<Bundle[]> {
  const catalog = await loadCatalog();
  return homepagePicks.featuredBundleSlugs
    .map((slug) => catalog.bundles.find((bundle) => bundle.slug === slug))
    .filter((bundle): bundle is Bundle => Boolean(bundle));
}

export async function getRoomEditPages() {
  const pages = await Promise.all(roomEdits.map((edit) => getRoomEditPage(edit.slug)));
  return pages.filter((page): page is NonNullable<typeof page> => Boolean(page));
}

export async function getRoomEditPage(slug: string) {
  const meta = getRoomEditMeta(slug);
  if (!meta) return null;
  const bundle = await getBundleBySlug(meta.bundleSlug);
  if (!bundle) return null;
  const catalog = await loadCatalog();
  const [components, separateTotal, teaser] = await Promise.all([
    getBundleComponents(bundle.id),
    getBundleSeparateTotal(bundle.id),
    getBundleTeaser(bundle.id),
  ]);
  return {
    ...meta,
    bundle,
    separateTotal,
    teaser,
    stockQty: bundleStockQty(catalog, bundle.id),
    products: components.map((item) => item.product),
  };
}

export async function getGiftingPage() {
  const catalog = await loadCatalog();
  const bundle = catalog.bundles.find(
    (item) => item.slug === giftingEdit.bundleSlug,
  );
  if (!bundle) return null;
  const giftCategories = catalog.categories.filter((category) =>
    (giftingEdit.categorySlugs as readonly string[]).includes(category.slug),
  );
  const giftCategoryIds = new Set(giftCategories.map((category) => category.id));
  const products = catalog.products.filter((product) => {
    if (giftCategoryIds.has(product.categoryId)) return true;
    return giftingEdit.extraNameHints.some((hint) =>
      product.slug.includes(hint),
    );
  });
  const [separateTotal, teaser] = await Promise.all([
    getBundleSeparateTotal(bundle.id),
    getBundleTeaser(bundle.id),
  ]);
  return {
    ...giftingEdit,
    bundle,
    separateTotal,
    teaser,
    products,
  };
}

export async function getBestSellers(): Promise<Product[]> {
  const catalog = await loadCatalog();
  return homepagePicks.bestSellerSlugs
    .map((slug) => catalog.products.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product));
}

function itemPrice(item: CatalogItem): number {
  return item.kind === "product" ? item.product.price : item.bundle.bundlePrice;
}

export async function getCatalogItems(
  filters: ShopFilters = {},
): Promise<CatalogItem[]> {
  const catalog = await loadCatalog();
  const category = filters.category
    ? catalog.categories.find((row) => row.slug === filters.category)
    : undefined;

  const productItems: CatalogItem[] = catalog.products
    .filter((product) =>
      category ? product.categoryId === category.id : true,
    )
    .map((product) => ({ kind: "product", product }));

  const bundleEntries: CatalogItem[] = [];
  for (const bundle of catalog.bundles) {
    if (
      category &&
      !bundleIncludesCategory(catalog, bundle.id, category.id)
    ) {
      continue;
    }
    bundleEntries.push({
      kind: "bundle",
      bundle,
      separateTotal: await getBundleSeparateTotal(bundle.id),
      teaser: await getBundleTeaser(bundle.id),
    });
  }

  let items = filters.bundlesOnly
    ? bundleEntries
    : [...bundleEntries, ...productItems];

  if (filters.sort === "price-asc") {
    items = [...items].sort((a, b) => itemPrice(a) - itemPrice(b));
  } else if (filters.sort === "price-desc") {
    items = [...items].sort((a, b) => itemPrice(b) - itemPrice(a));
  }

  return items;
}

function likePattern(query: string) {
  return `%${query.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&")}%`;
}

export async function searchCatalog(query: string): Promise<CatalogItem[]> {
  const term = query.trim();
  if (!term) return [];

  const pool = getPool();
  const pattern = likePattern(term);
  const [productRows, bundleRows] = await Promise.all([
    pool.query(
      `SELECT * FROM products
       WHERE status = 'active' AND name ILIKE $1 ESCAPE '\\'
       ORDER BY name`,
      [pattern],
    ),
    pool.query(
      `SELECT * FROM bundles
       WHERE name ILIKE $1 ESCAPE '\\'
       ORDER BY name`,
      [pattern],
    ),
  ]);

  const products = productRows.rows.map(mapProduct);
  const items: CatalogItem[] = products.map((product) => ({
    kind: "product",
    product,
  }));

  for (const bundle of bundleRows.rows.map(mapBundle)) {
    items.push({
      kind: "bundle",
      bundle,
      separateTotal: await getBundleSeparateTotal(bundle.id),
      teaser: await getBundleTeaser(bundle.id),
    });
  }

  return items;
}

export function bundleStockQty(
  catalog: CatalogSnapshot,
  bundleId: string,
): number {
  const items = catalog.bundleItems.filter((item) => item.bundle_id === bundleId);
  if (items.length === 0) return 0;
  return Math.min(
    ...items.map((item) => {
      const product = catalog.products.find((row) => row.id === item.product_id);
      if (!product) return 0;
      return Math.floor(product.stockQty / item.quantity);
    }),
  );
}

export async function resolveWishlistItems(
  items: WishlistItem[],
): Promise<{ resolved: ResolvedWishlistEntry[]; kept: WishlistItem[] }> {
  const catalog = await loadCatalog();
  const resolved: ResolvedWishlistEntry[] = [];
  const kept: WishlistItem[] = [];

  for (const item of items) {
    if (item.kind === "product") {
      const product = catalog.products.find((row) => row.slug === item.slug);
      if (!product) continue;
      kept.push(item);
      resolved.push({ kind: "product", product, stockQty: product.stockQty });
      continue;
    }

    const bundle = catalog.bundles.find((row) => row.slug === item.slug);
    if (!bundle) continue;
    kept.push(item);
    resolved.push({
      kind: "bundle",
      bundle,
      separateTotal: await getBundleSeparateTotal(bundle.id),
      teaser: await getBundleTeaser(bundle.id),
      stockQty: bundleStockQty(catalog, bundle.id),
    });
  }

  return { resolved, kept };
}
