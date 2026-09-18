"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Bundle, BundleItem, Product } from "@/lib/types";

type Line = { productId: string; quantity: number };

export function BundleForm({
  bundle,
  items,
  products,
}: {
  bundle?: Bundle;
  items?: BundleItem[];
  products: Product[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [lines, setLines] = useState<Line[]>(
    items?.length
      ? items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      : [{ productId: products[0]?.id ?? "", quantity: 1 }],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const payload = {
      name: data.get("name"),
      slug: data.get("slug"),
      description: data.get("description"),
      bundlePrice: data.get("bundlePrice"),
      image: data.get("image"),
      items: lines,
    };
    const response = await fetch(
      bundle ? `/api/admin/bundles/${bundle.id}` : "/api/admin/bundles",
      {
        method: bundle ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(result?.error ?? "Could not save bundle.");
      setPending(false);
      return;
    }
    router.push("/admin/bundles");
    router.refresh();
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <label>
        Name
        <input name="name" required defaultValue={bundle?.name} />
      </label>
      <label>
        Slug
        <input name="slug" defaultValue={bundle?.slug} placeholder="auto from name if blank" />
      </label>
      <label>
        Description
        <textarea name="description" defaultValue={bundle?.description} />
      </label>
      <label>
        Bundle price (PKR)
        <input
          name="bundlePrice"
          type="number"
          min="0"
          required
          defaultValue={bundle?.bundlePrice ?? 0}
        />
      </label>
      <label>
        Image URL
        <input
          name="image"
          defaultValue={
            bundle?.image && /^https?:\/\//.test(bundle.image) ? bundle.image : ""
          }
          placeholder="https://… — replaces Photo coming soon on bundle cards"
        />
      </label>
      <p className="admin-note">
        Leave blank for the “Photo coming soon” placeholder until you have a
        real bundle photo.
      </p>

      <div>
        <p>Products in this bundle</p>
        {lines.map((line, index) => (
          <div className="admin-bundle-row" key={`${line.productId}-${index}`}>
            <label>
              Product
              <select
                value={line.productId}
                onChange={(event) =>
                  setLines((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index
                        ? { ...row, productId: event.target.value }
                        : row,
                    ),
                  )
                }
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Qty
              <input
                type="number"
                min="1"
                value={line.quantity}
                onChange={(event) =>
                  setLines((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index
                        ? { ...row, quantity: Number(event.target.value) || 1 }
                        : row,
                    ),
                  )
                }
              />
            </label>
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() =>
                setLines((current) => current.filter((_, rowIndex) => rowIndex !== index))
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="admin-btn-ghost"
          onClick={() =>
            setLines((current) => [
              ...current,
              { productId: products[0]?.id ?? "", quantity: 1 },
            ])
          }
        >
          Add product
        </button>
      </div>

      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-actions">
        <button className="admin-btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save bundle"}
        </button>
      </div>
    </form>
  );
}
