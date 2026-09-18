"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/bundles", label: "Bundles" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/coupons", label: "Coupons" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="admin-nav">
      <Link href="/admin" className="admin-brand">
        Lunora Admin
      </Link>
      <nav className="admin-links" aria-label="Admin">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={
              link.href === "/admin"
                ? pathname === "/admin"
                  ? "page"
                  : undefined
                : pathname.startsWith(link.href)
                  ? "page"
                  : undefined
            }
          >
            {link.label}
          </Link>
        ))}
        <button
          type="button"
          className="admin-logout"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            router.push("/admin/login");
            router.refresh();
          }}
        >
          Log out
        </button>
      </nav>
    </aside>
  );
}
