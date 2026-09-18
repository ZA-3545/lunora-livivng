"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Product } from "@/lib/types";

export function ProductForm({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const payload = {
      name: data.get("name"),
      slug: data.get("slug"),
      shortDescription: data.get("shortDescription"),
      description: data.get("description"),
      categoryId: data.get("categoryId"),
      price: data.get("price"),
      costPrice: data.get("costPrice"),
      stockQty: data.get("stockQty"),
      weight: data.get("weight"),
      images: data.get("images"),
      status: data.get("status"),
    };
    const response = await fetch(
      product ? `/api/admin/products/${product.id}` : "/api/admin/products",
      {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(result?.error ?? "Could not save product.");
      setPending(false);
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <label>
        Name
        <input name="name" required defaultValue={product?.name} />
      </label>
      <label>
        Slug
        <input name="slug" defaultValue={product?.slug} placeholder="auto from name if blank" />
      </label>
      <label>
        Category
        <select name="categoryId" required defaultValue={product?.categoryId}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Short description
        <input name="shortDescription" defaultValue={product?.shortDescription} />
      </label>
      <label>
        Description
        <textarea name="description" defaultValue={product?.description} />
      </label>
      <label>
        Price (PKR)
        <input name="price" type="number" min="0" required defaultValue={product?.price ?? 0} />
      </label>
      <label>
        Cost price (PKR)
        <input name="costPrice" type="number" min="0" defaultValue={product?.costPrice ?? 0} />
      </label>
      <label>
        Stock quantity
        <input name="stockQty" type="number" min="0" required defaultValue={product?.stockQty ?? 0} />
      </label>
      <label>
        Weight (g)
        <input name="weight" type="number" min="0" defaultValue={product?.weight ?? 0} />
      </label>
      <label>
        Images (one URL per line)
        <textarea
          name="images"
          defaultValue={product?.images.filter((src) => /^https?:\/\//.test(src)).join("\n")}
          placeholder="https://… — first URL replaces Photo coming soon on the storefront"
        />
      </label>
      <p className="admin-note">
        Leave blank to keep the branded “Photo coming soon” placeholder. Paste a
        real supplier photo URL here when you have it — shop cards and the
        product page pick it up on the next load.
      </p>
      <label>
        Status
        <select name="status" defaultValue={product?.status ?? "active"}>
          <option value="active">active</option>
          <option value="draft">draft</option>
        </select>
      </label>
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-actions">
        <button className="admin-btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save product"}
        </button>
      </div>
    </form>
  );
}
