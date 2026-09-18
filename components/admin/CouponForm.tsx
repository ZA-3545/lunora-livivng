"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export type CouponRecord = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_value: number;
  expiry_date: string | null;
  usage_limit: number | null;
};

export function CouponForm({ coupon }: { coupon?: CouponRecord }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const expiry = coupon?.expiry_date
    ? String(coupon.expiry_date).slice(0, 10)
    : "";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const payload = {
      code: data.get("code"),
      discountType: data.get("discountType"),
      discountValue: data.get("discountValue"),
      minOrderValue: data.get("minOrderValue"),
      expiryDate: data.get("expiryDate"),
      usageLimit: data.get("usageLimit"),
    };
    const response = await fetch(
      coupon ? `/api/admin/coupons/${coupon.id}` : "/api/admin/coupons",
      {
        method: coupon ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(result?.error ?? "Could not save coupon.");
      setPending(false);
      return;
    }
    router.push("/admin/coupons");
    router.refresh();
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <label>
        Code
        <input name="code" required defaultValue={coupon?.code} placeholder="WELCOME10" />
      </label>
      <label>
        Discount type
        <select name="discountType" defaultValue={coupon?.discount_type ?? "fixed"}>
          <option value="fixed">fixed (PKR)</option>
          <option value="percent">percent</option>
        </select>
      </label>
      <label>
        Discount value
        <input
          name="discountValue"
          type="number"
          min="0"
          required
          defaultValue={coupon?.discount_value ?? 0}
        />
      </label>
      <label>
        Minimum order value (PKR)
        <input
          name="minOrderValue"
          type="number"
          min="0"
          defaultValue={coupon?.min_order_value ?? 0}
        />
      </label>
      <label>
        Expiry date
        <input name="expiryDate" type="date" defaultValue={expiry} />
      </label>
      <label>
        Usage limit
        <input
          name="usageLimit"
          type="number"
          min="0"
          defaultValue={coupon?.usage_limit ?? ""}
          placeholder="unlimited if blank"
        />
      </label>
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-actions">
        <button className="admin-btn" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save coupon"}
        </button>
      </div>
    </form>
  );
}
