"use client";

import { FormEvent, useEffect, useState } from "react";
import { useCoupon } from "@/components/cart/CouponProvider";
import { formatPkr } from "@/lib/format";

export function CouponField() {
  const { code, discount, error, status, applyCode, clearCode } = useCoupon();
  const [draft, setDraft] = useState(code);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setDraft(code);
  }, [code]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) {
      setLocalError("Enter a coupon code.");
      return;
    }
    setLocalError("");
    applyCode(draft);
  }

  return (
    <form className="coupon-field" onSubmit={onSubmit}>
      <p className="coupon-label">Have a coupon code?</p>
      <div className="coupon-row">
        <input
          type="text"
          name="coupon"
          autoComplete="off"
          spellCheck={false}
          value={draft}
          onChange={(event) => setDraft(event.target.value.toUpperCase())}
          placeholder="CODE"
          aria-label="Coupon code"
        />
        <button type="submit" className="coupon-apply" disabled={status === "checking"}>
          {status === "checking" ? "Checking…" : "Apply"}
        </button>
      </div>
      {status === "valid" && discount > 0 ? (
        <p className="coupon-ok">
          {code} applied — {formatPkr(discount)} off.{" "}
          <button type="button" className="coupon-remove" onClick={clearCode}>
            Remove
          </button>
        </p>
      ) : null}
      {localError || error ? (
        <p className="coupon-error">{localError || error}</p>
      ) : null}
    </form>
  );
}
