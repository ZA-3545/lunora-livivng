"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";

export function CartLink({ className }: { className?: string }) {
  const { count } = useCart();
  return (
    <Link href="/cart" className={className}>
      Cart ({count})
    </Link>
  );
}
