import type { CartLine } from "@/lib/types";

export const SHIPPING_FEE = 250;
export const COD_CONFIRM_THRESHOLD = 2000;
/** How long an unpaid online order may hold stock before it is released. */
export const ONLINE_PAYMENT_HOLD_MINUTES = Number(
  process.env.ONLINE_PAYMENT_HOLD_MINUTES ?? 25,
);

export const STORAGE_KEYS = {
  cart: "lunora.cart",
  lastOrder: "lunora.lastOrder",
  wishlist: "lunora.wishlist",
  coupon: "lunora.coupon",
} as const;

export const CART_STORAGE_VERSION = 2;
export const CART_EVENT = "lunora-cart-change";
export const COUPON_EVENT = "lunora-coupon-change";

export function isRenderableCartLine(line: unknown): line is CartLine {
  if (!line || typeof line !== "object") return false;
  const row = line as Partial<CartLine>;
  const hasProduct = typeof row.productId === "string" && row.productId.length > 0;
  const hasBundle = typeof row.bundleId === "string" && row.bundleId.length > 0;
  if (hasProduct === hasBundle) return false;
  return (
    typeof row.id === "string" &&
    row.id.length > 0 &&
    typeof row.name === "string" &&
    row.name.length > 0 &&
    typeof row.slug === "string" &&
    row.slug.length > 0 &&
    Number(row.unitPrice) > 0 &&
    Number(row.quantity) >= 1
  );
}

type VersionedCart = { v: number; lines: unknown[] };

function isVersionedCart(value: unknown): value is VersionedCart {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    (value as VersionedCart).v === CART_STORAGE_VERSION &&
    Array.isArray((value as VersionedCart).lines)
  );
}

/** Phase 3 stored a bare array without name/slug/image/unitPrice snapshots. */
export function parseStoredCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.filter(isRenderableCartLine);
    if (isVersionedCart(parsed)) return parsed.lines.filter(isRenderableCartLine);
    return [];
  } catch {
    return [];
  }
}

export function serializeCart(lines: CartLine[]): string {
  return JSON.stringify({ v: CART_STORAGE_VERSION, lines });
}

export function cartStorageNeedsRewrite(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return true;
    if (!isVersionedCart(parsed)) return true;
    return parsed.lines.length !== parsed.lines.filter(isRenderableCartLine).length;
  } catch {
    return true;
  }
}

export function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

export function createOrderNumber(): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LL-${Date.now().toString(36).toUpperCase()}${rand}`;
}

export function lineUnitPrice(line: CartLine): number {
  return Number(line.unitPrice) || 0;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineUnitPrice(line) * line.quantity, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function resolveCartLine(line: CartLine) {
  if (!line.name || (!line.productId && !line.bundleId)) return null;
  return {
    line,
    kind: line.bundleId ? ("bundle" as const) : ("product" as const),
    name: line.name,
    href: line.bundleId ? `/bundle/${line.slug}` : `/product/${line.slug}`,
    image: line.image,
    unitPrice: lineUnitPrice(line),
  };
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function normalizeOrderNumber(value: string): string {
  return value.trim().toUpperCase();
}
