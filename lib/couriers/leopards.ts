import { createHmac, timingSafeEqual } from "node:crypto";
import { createId } from "@/lib/commerce";
import { OrderError } from "@/lib/db/errors";
import type { ShipmentStatus } from "@/lib/types";

export function leopardsConfig() {
  const simulate =
    process.env.LEOPARDS_SIMULATE === "true" ||
    (process.env.LEOPARDS_API_KEY ?? "").startsWith("sandbox_dummy");
  return {
    simulate,
    apiKey: process.env.LEOPARDS_API_KEY ?? "",
    apiPassword: process.env.LEOPARDS_API_PASSWORD ?? "",
    webhookSecret: process.env.LEOPARDS_WEBHOOK_SECRET ?? "",
    host:
      process.env.LEOPARDS_ENV === "production"
        ? "https://merchantapi.leopardscourier.com"
        : "https://merchantapistaging.leopardscourier.com",
    originCityId: process.env.LEOPARDS_ORIGIN_CITY_ID ?? "1",
    pickupName: process.env.LEOPARDS_PICKUP_NAME ?? "Lunora Living",
    pickupPhone: process.env.LEOPARDS_PICKUP_PHONE ?? "03000000000",
    pickupAddress:
      process.env.LEOPARDS_PICKUP_ADDRESS ?? "Lunora warehouse, Lahore",
  };
}

export type CourierBooking = {
  trackingNumber: string;
  courierName: "Leopards";
};

const CITY_IDS: Record<string, string> = {
  lahore: process.env.LEOPARDS_CITY_LAHORE ?? "1",
  karachi: process.env.LEOPARDS_CITY_KARACHI ?? "2",
  islamabad: process.env.LEOPARDS_CITY_ISLAMABAD ?? "3",
  rawalpindi: process.env.LEOPARDS_CITY_RAWALPINDI ?? "4",
};

export function destinationCityId(city: string) {
  const key = city.trim().toLowerCase();
  return CITY_IDS[key] ?? leopardsConfig().originCityId;
}

export async function bookLeopardsShipment(input: {
  orderNumber: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  collectAmount: number;
  weightGrams: number;
  pieces: number;
}): Promise<CourierBooking> {
  const config = leopardsConfig();
  if (process.env.LEOPARDS_FORCE_FAIL === "true") {
    throw new OrderError(
      "COURIER_FAILED",
      "Leopards sandbox refused this booking.",
    );
  }
  if (config.simulate) {
    return {
      trackingNumber: `LPD${createId("sim").replace(/\W/g, "").slice(0, 12).toUpperCase()}`,
      courierName: "Leopards",
    };
  }
  if (!config.apiKey || !config.apiPassword) {
    throw new OrderError("COURIER_FAILED", "Leopards API credentials are not configured.");
  }

  const response = await fetch(
    `${config.host}/api/bookPacket/format/json/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: config.apiKey,
        api_password: config.apiPassword,
        booked_packet_weight: Math.max(100, input.weightGrams),
        booked_packet_no_piece: Math.max(1, input.pieces),
        booked_packet_collect_amount: input.collectAmount,
        booked_packet_order_id: input.orderNumber,
        origin_city: config.originCityId,
        destination_city: destinationCityId(input.city),
        shipment_name_eng: config.pickupName,
        shipment_phone: config.pickupPhone,
        shipment_address: config.pickupAddress,
        consignment_name_eng: input.name,
        consignment_phone: input.phone,
        consignment_address: `${input.address}, ${input.city}`,
        special_instructions: "Lunora Living décor — handle with care",
      }),
    },
  );
  const json = (await response.json().catch(() => ({}))) as {
    status?: number;
    error?: number;
    track_number?: string;
    tracking_number?: string;
    booked_packet_cn?: string;
    error_msg?: string;
    message?: string;
  };
  const tracking =
    json.track_number ?? json.tracking_number ?? json.booked_packet_cn ?? "";
  if (!response.ok || !tracking) {
    throw new OrderError(
      "COURIER_FAILED",
      json.error_msg ?? json.message ?? "Leopards could not book this shipment.",
    );
  }
  return { trackingNumber: String(tracking), courierName: "Leopards" };
}

export async function trackLeopardsShipment(
  trackingNumber: string,
): Promise<string | null> {
  const config = leopardsConfig();
  if (config.simulate || !trackingNumber) return null;
  if (!config.apiKey || !config.apiPassword) return null;

  const url = new URL(`${config.host}/api/trackBookedPacket/format/json/`);
  url.searchParams.set("api_key", config.apiKey);
  url.searchParams.set("api_password", config.apiPassword);
  url.searchParams.set("track_numbers", trackingNumber);

  const response = await fetch(url, { method: "GET" });
  const json = (await response.json().catch(() => ({}))) as {
    packet_list?: Array<{
      track_number?: string;
      booked_packet_status?: string;
      status?: string;
    }>;
    booked_packet_status?: string;
    status?: string;
  };
  const packet = json.packet_list?.find(
    (row) => row.track_number === trackingNumber,
  );
  return (
    packet?.booked_packet_status ??
    packet?.status ??
    json.booked_packet_status ??
    (typeof json.status === "string" ? json.status : null) ??
    null
  );
}

export function mapLeopardsStatus(raw: string): ShipmentStatus {
  const value = raw.trim().toLowerCase();
  if (
    value.includes("rto") ||
    value.includes("return") ||
    value.includes("undeliver") ||
    value.includes("failed") ||
    value === "returned"
  ) {
    return "returned";
  }
  if (value.includes("deliver")) return "delivered";
  if (value.includes("transit") || value.includes("out for")) return "in_transit";
  if (value.includes("dispatch") || value.includes("pickup") || value.includes("booked")) {
    return "dispatched";
  }
  return "in_transit";
}

export function verifyLeopardsWebhook(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
) {
  const secret = leopardsConfig().webhookSecret;
  if (!secret || !signature || !timestamp) return false;
  const expected = `sha256=${createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function signLeopardsWebhook(rawBody: string, timestamp: string) {
  const secret = leopardsConfig().webhookSecret;
  if (!secret) throw new Error("LEOPARDS_WEBHOOK_SECRET is not set.");
  return `sha256=${createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")}`;
}
