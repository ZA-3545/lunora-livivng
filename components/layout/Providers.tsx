"use client";

import { CartProvider } from "@/components/cart/CartProvider";
import { CouponProvider } from "@/components/cart/CouponProvider";
import { WishlistProvider } from "@/components/wishlist/WishlistProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <CouponProvider>
        <WishlistProvider>{children}</WishlistProvider>
      </CouponProvider>
    </CartProvider>
  );
}
