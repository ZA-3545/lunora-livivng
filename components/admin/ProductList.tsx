"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminListFilter } from "@/components/admin/AdminListFilter";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { formatPkr } from "@/lib/format";

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  category_name: string;
  price: number;
  stock_qty: number;
  status: string;
};

export function ProductList({
  products,
  categories,
}: {
  products: AdminProductRow[];
  categories: Array<{ id: string; name: string }>;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      if (category && product.category_id !== category) return false;
      if (!needle) return true;
      return (
        product.name.toLowerCase().includes(needle) ||
        product.slug.toLowerCase().includes(needle)
      );
    });
  }, [products, query, category]);

  return (
    <>
      <AdminListFilter
        query={query}
        onQuery={setQuery}
        placeholder="Search by product name"
        category={category}
        onCategory={setCategory}
        categories={categories}
      />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>No products match that search.</td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link href={`/admin/products/${product.id}`}>{product.name}</Link>
                    <div>{product.slug}</div>
                  </td>
                  <td>{product.category_name}</td>
                  <td>{formatPkr(Number(product.price))}</td>
                  <td>{product.stock_qty}</td>
                  <td>{product.status}</td>
                  <td className="admin-row-actions">
                    <Link className="admin-btn-ghost" href={`/admin/products/${product.id}`}>
                      Edit
                    </Link>
                    <DeleteButton action={`/api/admin/products/${product.id}`} />
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
