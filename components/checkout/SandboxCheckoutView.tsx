"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api/client";
import { formatPkr } from "@/lib/format";
import { readLastOrder, writeLastOrder } from "@/lib/storage";
import type { Order } from "@/lib/types";
import { useHydrated } from "@/lib/use-hydrated";

export function SandboxCheckoutView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "";
  const tracker = searchParams.get("tracker") ?? "";
  const hydrated = useHydrated();
  const stored = hydrated ? readLastOrder() : null;
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"paid" | "failed" | "">("");

  const order =
    stored && stored.orderNumber.toUpperCase() === orderNumber.toUpperCase()
      ? stored
      : null;

  async function complete(outcome: "paid" | "failed") {
    setError("");
    setPending(outcome);
    try {
      const result = await apiFetch<{ order: Order }>("/api/pay/sandbox/complete", {
        method: "POST",
        body: JSON.stringify({ orderNumber, tracker, outcome }),
      });
      if (result.order) writeLastOrder(result.order);
      router.push(`/pay/return?order=${encodeURIComponent(orderNumber)}`);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Sandbox payment could not be completed.",
      );
      setPending("");
    }
  }

  function abandon() {
    router.push(`/pay/cancel?order=${encodeURIComponent(orderNumber)}`);
  }

  if (!hydrated) {
    return (
      <section className="commerce-page">
        <div className="wrap">
          <h1>Safepay sandbox</h1>
          <p className="commerce-empty">Loading checkout…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="commerce-page">
      <div className="wrap pay-sandbox">
        <p className="pdp-kicker">Safepay sandbox</p>
        <h1>Test hosted checkout</h1>
        <p className="pdp-short">
          This page stands in for Safepay’s hosted checkout while we use dummy
          sandbox credentials. Pay, fail, or leave — the webhook is signed with
          the same HMAC Safepay documents.
        </p>
        {order ? (
          <p className="summary-note">
            {order.orderNumber} · {formatPkr(order.total)}
          </p>
        ) : (
          <p className="summary-note">Order {orderNumber}</p>
        )}
        {error ? <p className="form-error">{error}</p> : null}
        <div className="pay-actions">
          <button
            type="button"
            className="btn"
            disabled={Boolean(pending)}
            onClick={() => complete("paid")}
          >
            {pending === "paid" ? "Paying…" : "Pay with test card"}
          </button>
          <button
            type="button"
            className="btn-outline"
            disabled={Boolean(pending)}
            onClick={() => complete("failed")}
          >
            {pending === "failed" ? "Failing…" : "Fail this payment"}
          </button>
          <button
            type="button"
            className="btn-outline"
            disabled={Boolean(pending)}
            onClick={abandon}
          >
            Leave without paying
          </button>
        </div>
        <p className="summary-note">
          Test card (Safepay docs): 5200 0000 0000 1096 · 03/28 · CVC 111
        </p>
        <p className="summary-note">
          <Link href="/checkout">Back to checkout</Link>
        </p>
      </div>
    </section>
  );
}
