"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useCart } from "@/components/cart/CartProvider";
import { apiFetch, ApiError } from "@/lib/api/client";
import { COUPON_EVENT, STORAGE_KEYS } from "@/lib/commerce";
import { writeCouponCode } from "@/lib/storage";

type CouponStatus = "idle" | "checking" | "valid" | "invalid";

type CouponContextValue = {
  code: string;
  discount: number;
  error: string;
  status: CouponStatus;
  applyCode: (code: string) => void;
  clearCode: () => void;
};

const CouponContext = createContext<CouponContextValue | null>(null);

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener(COUPON_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(COUPON_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEYS.coupon) ?? "";
}

function getServerSnapshot() {
  return "";
}

export function CouponProvider({ children }: { children: React.ReactNode }) {
  const { subtotal } = useCart();
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const code = raw.trim().toUpperCase();
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<CouponStatus>("idle");

  useEffect(() => {
    if (!code) {
      setDiscount(0);
      setError("");
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("checking");
    setDiscount(0);
    setError("");

    async function preview() {
      try {
        const result = await apiFetch<{ code: string; discount: number }>(
          "/api/coupons/preview",
          {
            method: "POST",
            body: JSON.stringify({ code, subtotal }),
          },
        );
        if (cancelled) return;
        setDiscount(result.discount);
        setError("");
        setStatus("valid");
      } catch (cause) {
        if (cancelled) return;
        setDiscount(0);
        setStatus("invalid");
        setError(
          cause instanceof ApiError
            ? cause.message
            : "That coupon could not be applied.",
        );
      }
    }

    void preview();
    return () => {
      cancelled = true;
    };
  }, [code, subtotal]);

  const applyCode = useCallback((next: string) => {
    writeCouponCode(next);
  }, []);

  const clearCode = useCallback(() => {
    writeCouponCode("");
  }, []);

  const value = useMemo<CouponContextValue>(
    () => ({
      code,
      discount,
      error,
      status,
      applyCode,
      clearCode,
    }),
    [applyCode, clearCode, code, discount, error, status],
  );

  return (
    <CouponContext.Provider value={value}>{children}</CouponContext.Provider>
  );
}

export function useCoupon() {
  const context = useContext(CouponContext);
  if (!context) {
    throw new Error("useCoupon must be used within CouponProvider");
  }
  return context;
}
