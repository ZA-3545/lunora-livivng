import {
  CART_EVENT,
  COUPON_EVENT,
  STORAGE_KEYS,
  cartStorageNeedsRewrite,
  parseStoredCart,
  serializeCart,
} from "@/lib/commerce";
import type { CartLine, Order } from "@/lib/types";

function emit(name: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(name));
  }
}

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  return parseStoredCart(window.localStorage.getItem(STORAGE_KEYS.cart));
}

export function writeCart(lines: CartLine[]) {
  window.localStorage.setItem(STORAGE_KEYS.cart, serializeCart(lines));
  emit(CART_EVENT);
}

/** Drop Phase 3 rows (no snapshots) and persist the v2 shape. */
export function migrateCartStorage() {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(STORAGE_KEYS.cart);
  if (!cartStorageNeedsRewrite(raw)) return;
  writeCart(parseStoredCart(raw));
}

export function readLastOrder(): Order | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEYS.lastOrder);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}

export function writeLastOrder(order: Order) {
  window.sessionStorage.setItem(STORAGE_KEYS.lastOrder, JSON.stringify(order));
}

export function readCouponCode(): string {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem(STORAGE_KEYS.coupon) ?? "")
    .trim()
    .toUpperCase();
}

export function writeCouponCode(code: string) {
  const next = code.trim().toUpperCase();
  if (!next) {
    window.localStorage.removeItem(STORAGE_KEYS.coupon);
  } else {
    window.localStorage.setItem(STORAGE_KEYS.coupon, next);
  }
  emit(COUPON_EVENT);
}
