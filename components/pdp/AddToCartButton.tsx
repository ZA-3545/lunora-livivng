"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart, type AddToCartInput } from "@/components/cart/CartProvider";

export function AddToCartButton({
  label = "Add to Cart",
  quantity,
  productId,
  bundleId,
  name,
  slug,
  image,
  unitPrice,
}: {
  label?: string;
  quantity: number;
} & Omit<AddToCartInput, "quantity">) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <div className="pdp-cart">
      <button
        type="button"
        className="btn"
        onClick={() => {
          addItem({
            productId,
            bundleId,
            quantity,
            name,
            slug,
            image,
            unitPrice,
          });
          setAdded(true);
        }}
      >
        {label}
      </button>
      {added ? (
        <p className="pdp-note">
          Added to cart. <Link href="/cart">View cart</Link>
        </p>
      ) : null}
    </div>
  );
}
