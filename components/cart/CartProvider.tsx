"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { apiFetch } from "@/lib/api/client";
import { cartLinesEqual, reconcileCartLines } from "@/lib/cart-reconcile";
import {
  CART_EVENT,
  STORAGE_KEYS,
  cartCount,
  cartSubtotal,
  createId,
  parseStoredCart,
} from "@/lib/commerce";
import { migrateCartStorage, writeCart } from "@/lib/storage";
import type { Bundle, CartLine, Product } from "@/lib/types";

export type AddToCartInput = {
  productId?: string;
  bundleId?: string;
  quantity: number;
  name: string;
  slug: string;
  image: string;
  unitPrice: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  addItem: (input: AddToCartInput) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener(CART_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CART_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEYS.cart) ?? "";
}

function getServerSnapshot() {
  return "";
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const lines = useMemo(() => parseStoredCart(raw || null), [raw]);
  const catalogRef = useRef<{
    products: { id: string; slug: string }[];
    bundles: { id: string; slug: string }[];
  } | null>(null);

  useLayoutEffect(() => {
    migrateCartStorage();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function reconcile() {
      if (lines.length === 0) return;
      try {
        if (!catalogRef.current) {
          const [productRes, bundleRes] = await Promise.all([
            apiFetch<{ products: Product[] }>("/api/products"),
            apiFetch<{ bundles: Bundle[] }>("/api/bundles"),
          ]);
          if (cancelled) return;
          catalogRef.current = {
            products: productRes.products.map(({ id, slug }) => ({ id, slug })),
            bundles: bundleRes.bundles.map(({ id, slug }) => ({ id, slug })),
          };
        }
        const catalog = catalogRef.current;
        const next = reconcileCartLines(lines, catalog.products, catalog.bundles);
        if (!cartLinesEqual(lines, next)) writeCart(next);
      } catch {
        // Keep snapshot lines if the catalog API is unreachable.
      }
    }

    void reconcile();
    return () => {
      cancelled = true;
    };
  }, [lines]);

  const addItem = useCallback(
    (input: AddToCartInput) => {
      const productId = input.productId ?? null;
      const bundleId = input.bundleId ?? null;
      if (Boolean(productId) === Boolean(bundleId)) return;

      const existing = lines.find(
        (line) => line.productId === productId && line.bundleId === bundleId,
      );
      if (existing) {
        writeCart(
          lines.map((line) =>
            line.id === existing.id
              ? { ...line, quantity: line.quantity + input.quantity }
              : line,
          ),
        );
        return;
      }

      writeCart([
        ...lines,
        {
          id: createId("line"),
          productId,
          bundleId,
          quantity: input.quantity,
          name: input.name,
          slug: input.slug,
          image: input.image,
          unitPrice: input.unitPrice,
        },
      ]);
    },
    [lines],
  );

  const updateQuantity = useCallback(
    (lineId: string, quantity: number) => {
      if (quantity < 1) {
        writeCart(lines.filter((line) => line.id !== lineId));
        return;
      }
      writeCart(
        lines.map((line) =>
          line.id === lineId ? { ...line, quantity } : line,
        ),
      );
    },
    [lines],
  );

  const removeItem = useCallback(
    (lineId: string) => {
      writeCart(lines.filter((line) => line.id !== lineId));
    },
    [lines],
  );

  const clearCart = useCallback(() => {
    writeCart([]);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      subtotal: cartSubtotal(lines),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [addItem, clearCart, lines, removeItem, updateQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
