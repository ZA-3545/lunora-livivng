"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api/client";
import { writeLastOrder } from "@/lib/storage";
import type { Order } from "@/lib/types";

export function PaymentRecoveryActions({ order }: { order: Order }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"pay" | "cod" | "">("");

  async function retryPay() {
    setError("");
    setPending("pay");
    try {
      const result = await apiFetch<{ checkoutUrl: string; order: Order }>(
        "/api/orders/pay",
        {
          method: "POST",
          body: JSON.stringify({
            orderNumber: order.orderNumber,
            phone: order.shipping.phone,
          }),
        },
      );
      writeLastOrder(result.order);
      window.location.href = result.checkoutUrl;
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Could not restart payment.",
      );
      setPending("");
    }
  }

  async function switchCod() {
    setError("");
    setPending("cod");
    try {
      const result = await apiFetch<{ order: Order }>("/api/orders/switch-cod", {
        method: "POST",
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          phone: order.shipping.phone,
        }),
      });
      writeLastOrder(result.order);
      router.push(`/order-confirmation?order=${result.order.orderNumber}`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Could not switch to COD.",
      );
      setPending("");
    }
  }

  return (
    <div className="pay-actions">
      <button
        type="button"
        className="btn"
        onClick={retryPay}
        disabled={Boolean(pending)}
      >
        {pending === "pay" ? "Redirecting…" : "Retry online payment"}
      </button>
      <button
        type="button"
        className="btn-outline"
        onClick={switchCod}
        disabled={Boolean(pending)}
      >
        {pending === "cod" ? "Switching…" : "Switch to Cash on Delivery"}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
