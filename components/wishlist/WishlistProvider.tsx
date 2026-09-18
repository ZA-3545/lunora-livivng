"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { apiFetch } from "@/lib/api/client";
import { STORAGE_KEYS } from "@/lib/commerce";
import {
  WISHLIST_EVENT,
  parseWishlist,
  wishlistItemsEqual,
  writeWishlist,
} from "@/lib/wishlist-storage";
import type { WishlistItem, WishlistKind } from "@/lib/types";

type WishlistContextValue = {
  items: WishlistItem[];
  count: number;
  has: (kind: WishlistKind, slug: string) => boolean;
  toggle: (kind: WishlistKind, slug: string) => void;
  remove: (kind: WishlistKind, slug: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener(WISHLIST_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(WISHLIST_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEYS.wishlist) ?? "";
}

function getServerSnapshot() {
  return "";
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const items = useMemo(() => parseWishlist(raw || null), [raw]);

  useEffect(() => {
    let cancelled = false;

    async function reconcile() {
      if (items.length === 0) return;
      try {
        const { kept } = await apiFetch<{ kept: WishlistItem[] }>(
          "/api/wishlist/resolve",
          {
            method: "POST",
            body: JSON.stringify({ items }),
          },
        );
        if (cancelled) return;
        if (!wishlistItemsEqual(items, kept)) writeWishlist(kept);
      } catch {
        // Keep stored slugs if the catalog is unreachable.
      }
    }

    void reconcile();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const has = useCallback(
    (kind: WishlistKind, slug: string) =>
      items.some((item) => item.kind === kind && item.slug === slug),
    [items],
  );

  const toggle = useCallback(
    (kind: WishlistKind, slug: string) => {
      if (has(kind, slug)) {
        writeWishlist(
          items.filter((item) => !(item.kind === kind && item.slug === slug)),
        );
        return;
      }
      writeWishlist([...items, { kind, slug }]);
    },
    [has, items],
  );

  const remove = useCallback(
    (kind: WishlistKind, slug: string) => {
      writeWishlist(
        items.filter((item) => !(item.kind === kind && item.slug === slug)),
      );
    },
    [items],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      count: items.length,
      has,
      toggle,
      remove,
    }),
    [has, items, remove, toggle],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
