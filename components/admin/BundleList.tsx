"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminListFilter } from "@/components/admin/AdminListFilter";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { formatPkr } from "@/lib/format";

export type AdminBundleRow = {
  id: string;
  name: string;
  slug: string;
  bundle_price: number;
  items: Array<{ name: string; quantity: number }>;
};

export function BundleList({ bundles }: { bundles: AdminBundleRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bundles.filter((bundle) => {
      if (!needle) return true;
      const itemNames = bundle.items.map((item) => item.name).join(" ");
      return (
        bundle.name.toLowerCase().includes(needle) ||
        bundle.slug.toLowerCase().includes(needle) ||
        itemNames.toLowerCase().includes(needle)
      );
    });
  }, [bundles, query]);

  return (
    <>
      <AdminListFilter
        query={query}
        onQuery={setQuery}
        placeholder="Search by bundle or product name"
      />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Items</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4}>No bundles match that search.</td>
              </tr>
            ) : (
              filtered.map((bundle) => (
                <tr key={bundle.id}>
                  <td>
                    <Link href={`/admin/bundles/${bundle.id}`}>{bundle.name}</Link>
                    <div>{bundle.slug}</div>
                  </td>
                  <td>{formatPkr(Number(bundle.bundle_price))}</td>
                  <td>
                    {bundle.items
                      .map((item) => `${item.quantity} × ${item.name}`)
                      .join(", ") || "—"}
                  </td>
                  <td className="admin-row-actions">
                    <Link className="admin-btn-ghost" href={`/admin/bundles/${bundle.id}`}>
                      Edit
                    </Link>
                    <DeleteButton action={`/api/admin/bundles/${bundle.id}`} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
