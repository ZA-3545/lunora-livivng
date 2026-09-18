import { createHmac, timingSafeEqual } from "node:crypto";
import { createId } from "@/lib/commerce";

export const SAFEPAY_SUCCESS_EVENTS = new Set([
  "payment.succeeded",
  "payment.completed",
]);

export const SAFEPAY_FAILURE_EVENTS = new Set([
  "payment.failed",
  "payment.rejected",
]);

export function safepayConfig() {
  const simulate =
    process.env.SAFEPAY_SIMULATE === "true" ||
    (process.env.SAFEPAY_SECRET_KEY ?? "").startsWith("sandbox_dummy");
  return {
    simulate,
    apiKey: process.env.SAFEPAY_API_KEY ?? "",
    secretKey: process.env.SAFEPAY_SECRET_KEY ?? "",
    webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET ?? "",
    environment: (process.env.SAFEPAY_ENV === "production"
      ? "production"
      : "sandbox") as "sandbox" | "production",
    host:
      process.env.SAFEPAY_ENV === "production"
        ? "https://api.getsafepay.com"
        : "https://sandbox.api.getsafepay.com",
    appUrl: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  };
}

/** Safepay amounts are in the currency's lowest denomination (paisa for PKR). */
export function pkrToSafepayAmount(pkr: number) {
  return Math.round(pkr * 100);
}

export function signSafepayWebhook(rawBody: string, timestamp: string) {
  const secret = safepayConfig().webhookSecret;
  if (!secret) {
    throw new Error("SAFEPAY_WEBHOOK_SECRET is not set.");
  }
  const key = Buffer.from(secret, "base64");
  const digest = createHmac("sha256", key)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return `sha256=${digest}`;
}

export function verifySafepayWebhook(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
) {
  if (!signature || !timestamp) return false;
  if (!safepayConfig().webhookSecret) return false;
  let expected: string;
  try {
    expected = signSafepayWebhook(rawBody, timestamp);
  } catch {
    return false;
  }
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type SafepayCheckoutSession = {
  tracker: string;
  checkoutUrl: string;
};

export async function createSafepayCheckout(input: {
  orderId: string;
  orderNumber: string;
  amountPkr: number;
}): Promise<SafepayCheckoutSession> {
  const config = safepayConfig();
  const returnUrl = `${config.appUrl}/pay/return?order=${encodeURIComponent(input.orderNumber)}`;
  const cancelUrl = `${config.appUrl}/pay/cancel?order=${encodeURIComponent(input.orderNumber)}`;

  if (config.simulate) {
    const tracker = createId("track");
    const checkoutUrl = `${config.appUrl}/pay/sandbox?order=${encodeURIComponent(input.orderNumber)}&tracker=${encodeURIComponent(tracker)}`;
    return { tracker, checkoutUrl };
  }

  if (!config.apiKey || !config.secretKey) {
    throw new Error("Safepay API keys are not configured.");
  }

  const sessionRes = await fetch(`${config.host}/order/payments/v3/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SFPY-MERCHANT-SECRET": config.secretKey,
    },
    body: JSON.stringify({
      merchant_api_key: config.apiKey,
      intent: "CYBERSOURCE",
      mode: "payment",
      entry_mode: "raw",
      currency: "PKR",
      amount: pkrToSafepayAmount(input.amountPkr),
      metadata: {
        order_id: input.orderId,
        order_number: input.orderNumber,
      },
      include_fees: false,
    }),
  });
  const sessionJson = (await sessionRes.json().catch(() => ({}))) as {
    data?: { tracker?: { token?: string } };
    status?: { message?: string };
  };
  const tracker = sessionJson.data?.tracker?.token;
  if (!sessionRes.ok || !tracker) {
    throw new Error(
      sessionJson.status?.message ?? "Could not start Safepay checkout.",
    );
  }

  const tokenRes = await fetch(`${config.host}/client/passport/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SFPY-MERCHANT-SECRET": config.secretKey,
    },
    body: JSON.stringify({}),
  });
  const tokenJson = (await tokenRes.json().catch(() => ({}))) as {
    data?: string;
  };
  const tbt = tokenJson.data;
  if (!tokenRes.ok || !tbt) {
    throw new Error("Could not create a Safepay checkout token.");
  }

  const checkout = new URL(`${config.host}/embedded`);
  checkout.searchParams.set("beacon", tracker);
  checkout.searchParams.set("tbt", tbt);
  checkout.searchParams.set("environment", config.environment);
  checkout.searchParams.set("source", "hosted");
  checkout.searchParams.set("redirect_url", returnUrl);
  checkout.searchParams.set("cancel_url", cancelUrl);
  return { tracker, checkoutUrl: checkout.toString() };
}

export function extractSafepayEvent(payload: unknown) {
  const body = payload as {
    type?: string;
    event_type?: string;
    success?: boolean;
    data?: {
      type?: string;
      tracker?: string | { token?: string };
      metadata?: { order_id?: string; order_number?: string };
    };
    tracker?: string | { token?: string };
    metadata?: { order_id?: string; order_number?: string };
  };

  const type = body.type ?? body.event_type ?? body.data?.type ?? "";
  const trackerValue = body.data?.tracker ?? body.tracker;
  const tracker =
    typeof trackerValue === "string"
      ? trackerValue
      : (trackerValue?.token ?? "");
  const orderId = body.data?.metadata?.order_id ?? body.metadata?.order_id ?? "";
  const orderNumber =
    body.data?.metadata?.order_number ?? body.metadata?.order_number ?? "";

  return { type, tracker, orderId, orderNumber, success: body.success === true };
}
