"use client";

import { useWishlist } from "@/components/wishlist/WishlistProvider";
import type { WishlistKind } from "@/lib/types";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20s-7.2-4.35-9.3-8.22C1.2 9.3 2.1 6.4 4.7 5.45c1.7-.63 3.55-.12 4.7 1.2L12 9.2l2.6-2.55c1.15-1.32 3-1.83 4.7-1.2 2.6.95 3.5 3.85 2 6.33C19.2 15.65 12 20 12 20z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WishlistButton({
  kind,
  slug,
  name,
  variant = "icon",
}: {
  kind: WishlistKind;
  slug: string;
  name: string;
  variant?: "icon" | "text";
}) {
  const { has, toggle } = useWishlist();
  const saved = has(kind, slug);
  const label = saved ? `Remove ${name} from wishlist` : `Save ${name}`;

  return (
    <button
      type="button"
      className={variant === "text" ? "wish-text" : "wish-btn"}
      aria-pressed={saved}
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(kind, slug);
      }}
    >
      <HeartIcon filled={saved} />
      {variant === "text" ? <span>{saved ? "Saved" : "Save"}</span> : null}
    </button>
  );
}
