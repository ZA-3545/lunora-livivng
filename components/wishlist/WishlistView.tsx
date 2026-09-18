"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BundleCard } from "@/components/catalog/BundleCard";
import { ProductCard } from "@/components/catalog/ProductCard";
import { useCart } from "@/components/cart/CartProvider";
import { apiFetch } from "@/lib/api/client";
import type { ResolvedWishlistEntry } from "@/lib/types";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

export function WishlistView() {
  const { items, remove } = useWishlist();
  const { addItem } = useCart();
  const [resolved, setResolved] = useState<ResolvedWishlistEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (items.length === 0) {
        setResolved([]);
        return;
      }
      try {
        const data = await apiFetch<{ resolved: ResolvedWishlistEntry[] }>(
          "/api/wishlist/resolve",
          {
            method: "POST",
            body: JSON.stringify({ items }),
          },
        );
        if (!cancelled) setResolved(data.resolved);
      } catch {
        if (!cancelled) setResolved([]);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (resolved === null) {
    return (
      <section className="catalog-page">
        <div className="wrap">
          <h1>Wishlist</h1>
          <p className="catalog-empty">Looking up your saved pieces…</p>
        </div>
      </section>
    );
  }

  if (resolved.length === 0) {
    return (
      <section className="catalog-page">
        <div className="wrap">
          <h1>Wishlist</h1>
          <p className="commerce-empty">
            Nothing saved yet.{" "}
            <Link href="/shop">Browse the edit</Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="catalog-page">
      <div className="wrap">
        <div className="page-intro">
          <h1>Wishlist</h1>
          <p>Saved pieces with today’s price and stock — no account needed.</p>
        </div>
        <div className="catalog-grid">
          {resolved.map((item) => {
            if (item.kind === "product") {
              const { product } = item;
              return (
                <div key={`product-${product.slug}`} className="wishlist-tile">
                  <ProductCard product={product} />
                  <p className="wishlist-stock">
                    {item.stockQty > 0
                      ? `${item.stockQty} in stock`
                      : "Out of stock"}
                  </p>
                  <div className="wishlist-actions">
                    <button
                      type="button"
                      className="btn"
                      disabled={item.stockQty < 1}
                      onClick={() => {
                        addItem({
                          productId: product.id,
                          quantity: 1,
                          name: product.name,
                          slug: product.slug,
                          image: product.images[0] ?? "",
                          unitPrice: product.price,
                        });
                        remove("product", product.slug);
                      }}
                    >
                      Move to cart
                    </button>
                    <button
                      type="button"
                      className="cart-remove"
                      onClick={() => remove("product", product.slug)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            }

            const { bundle } = item;
            return (
              <div key={`bundle-${bundle.slug}`} className="wishlist-tile">
                <BundleCard
                  bundle={bundle}
                  separateTotal={item.separateTotal}
                  teaser={item.teaser}
                />
                <p className="wishlist-stock">
                  {item.stockQty > 0
                    ? `${item.stockQty} in stock`
                    : "Out of stock"}
                </p>
                <div className="wishlist-actions">
                  <button
                    type="button"
                    className="btn"
                    disabled={item.stockQty < 1}
                    onClick={() => {
                      addItem({
                        bundleId: bundle.id,
                        quantity: 1,
                        name: bundle.name,
                        slug: bundle.slug,
                        image: bundle.image,
                        unitPrice: bundle.bundlePrice,
                      });
                      remove("bundle", bundle.slug);
                    }}
                  >
                    Move to cart
                  </button>
                  <button
                    type="button"
                    className="cart-remove"
                    onClick={() => remove("bundle", bundle.slug)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
