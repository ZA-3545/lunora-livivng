"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/pdp/AddToCartButton";
import { QuantitySelector } from "@/components/pdp/QuantitySelector";
import { WishlistButton } from "@/components/wishlist/WishlistButton";

export function PurchaseRow({
  label,
  productId,
  bundleId,
  name,
  slug,
  image,
  unitPrice,
}: {
  label?: string;
  productId?: string;
  bundleId?: string;
  name: string;
  slug: string;
  image: string;
  unitPrice: number;
}) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="pdp-purchase">
      <QuantitySelector value={quantity} onChange={setQuantity} />
      <AddToCartButton
        label={label}
        quantity={quantity}
        productId={productId}
        bundleId={bundleId}
        name={name}
        slug={slug}
        image={image}
        unitPrice={unitPrice}
      />
      <WishlistButton
        kind={bundleId ? "bundle" : "product"}
        slug={slug}
        name={name}
        variant="text"
      />
    </div>
  );
}
