import { STORAGE_KEYS } from "@/lib/commerce";
import type { WishlistItem } from "@/lib/types";

export const WISHLIST_STORAGE_VERSION = 1;
export const WISHLIST_EVENT = "lunora-wishlist-change";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WISHLIST_EVENT));
  }
}

export function isWishlistItem(value: unknown): value is WishlistItem {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<WishlistItem>;
  return (
    (row.kind === "product" || row.kind === "bundle") &&
    typeof row.slug === "string" &&
    row.slug.length > 0
  );
}

export function parseWishlist(raw: string | null): WishlistItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          (parsed as { v?: number }).v === WISHLIST_STORAGE_VERSION &&
          Array.isArray((parsed as { items?: unknown }).items)
        ? (parsed as { items: unknown[] }).items
        : [];
    const seen = new Set<string>();
    const items: WishlistItem[] = [];
    for (const row of rows) {
      if (!isWishlistItem(row)) continue;
      const key = `${row.kind}:${row.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ kind: row.kind, slug: row.slug });
    }
    return items;
  } catch {
    return [];
  }
}

export function serializeWishlist(items: WishlistItem[]): string {
  return JSON.stringify({ v: WISHLIST_STORAGE_VERSION, items });
}

export function readWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  return parseWishlist(window.localStorage.getItem(STORAGE_KEYS.wishlist));
}

export function writeWishlist(items: WishlistItem[]) {
  window.localStorage.setItem(STORAGE_KEYS.wishlist, serializeWishlist(items));
  emit();
}

export function wishlistItemsEqual(a: WishlistItem[], b: WishlistItem[]) {
  if (a.length !== b.length) return false;
  return a.every(
    (item, index) =>
      item.kind === b[index].kind && item.slug === b[index].slug,
  );
}
