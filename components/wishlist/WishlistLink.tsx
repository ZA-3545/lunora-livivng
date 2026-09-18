"use client";

import Link from "next/link";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

export function WishlistLink({ className }: { className?: string }) {
  const { count } = useWishlist();
  return (
    <Link href="/wishlist" className={className}>
      Wishlist ({count})
    </Link>
  );
}
