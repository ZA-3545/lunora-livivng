import { parseImageInput, slugify } from "@/lib/admin/slug";
import type {
  AdminBundleInput,
  AdminCouponInput,
  AdminProductInput,
} from "@/lib/admin/db";
import type { ProductStatus } from "@/lib/types";

function text(value: unknown) {
  return String(value ?? "").trim();
}

function integer(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

export function parseProductBody(body: Record<string, unknown>): AdminProductInput {
  const name = text(body.name);
  const slug = slugify(text(body.slug) || name);
  const status = text(body.status) === "draft" ? "draft" : "active";
  if (!name || !slug) throw new Error("Name and slug are required.");
  if (!text(body.categoryId)) throw new Error("Category is required.");
  const price = integer(body.price);
  const stockQty = integer(body.stockQty);
  if (price < 0 || stockQty < 0) throw new Error("Price and stock cannot be negative.");
  return {
    name,
    slug,
    description: text(body.description),
    shortDescription: text(body.shortDescription),
    categoryId: text(body.categoryId),
    price,
    costPrice: Math.max(0, integer(body.costPrice)),
    stockQty,
    weight: Math.max(0, integer(body.weight)),
    images: parseImageInput(text(body.images)),
    status: status as ProductStatus,
  };
}

export function parseBundleBody(body: Record<string, unknown>): AdminBundleInput {
  const name = text(body.name);
  const slug = slugify(text(body.slug) || name);
  if (!name || !slug) throw new Error("Name and slug are required.");
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const items = rawItems.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as { productId?: unknown; quantity?: unknown };
    const productId = text(item.productId);
    const quantity = integer(item.quantity, 0);
    if (!productId || quantity < 1) return [];
    return [{ productId, quantity }];
  });
  if (items.length === 0) {
    throw new Error("A bundle needs at least one product.");
  }
  return {
    name,
    slug,
    description: text(body.description),
    bundlePrice: Math.max(0, integer(body.bundlePrice)),
    image: text(body.image),
    items,
  };
}

export function parseCouponBody(body: Record<string, unknown>): AdminCouponInput {
  const code = text(body.code).toUpperCase();
  const discountType = text(body.discountType) === "percent" ? "percent" : "fixed";
  if (!code) throw new Error("Coupon code is required.");
  const expiry = text(body.expiryDate);
  const usage = text(body.usageLimit);
  return {
    code,
    discountType,
    discountValue: Math.max(0, integer(body.discountValue)),
    minOrderValue: Math.max(0, integer(body.minOrderValue)),
    expiryDate: expiry || null,
    usageLimit: usage === "" ? null : Math.max(0, integer(body.usageLimit)),
  };
}
