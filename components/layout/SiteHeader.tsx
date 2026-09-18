import Link from "next/link";
import { CartLink } from "@/components/cart/CartLink";
import { WishlistLink } from "@/components/wishlist/WishlistLink";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link href="/" className="logo">
          {site.name}
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {site.nav.map((item) => (
            <Link key={item.label} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="nav-icons">
          <Link href="/search">Search</Link>
          <WishlistLink />
          <CartLink />
        </div>
      </div>
    </header>
  );
}
