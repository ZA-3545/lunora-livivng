"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "returned",
  "payment_failed",
  "needs_review",
];

export function OrderStatusForm({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const next = String(new FormData(event.currentTarget).get("status") ?? "");
    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(result?.error ?? "Could not update status.");
      setPending(false);
      return;
    }
    router.refresh();
    setPending(false);
  }

  return (
    <form className="admin-form" method="post" onSubmit={onSubmit}>
      <label>
        Order status
        <select name="status" defaultValue={status} key={status}>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <p className="admin-note">
        Setting status to packed books a Leopards shipment. If booking fails the
        order stays packed and is not marked shipped.
      </p>
      {error ? <p className="admin-error">{error}</p> : null}
      <button className="admin-btn" type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update status"}
      </button>
    </form>
  );
}
