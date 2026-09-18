/** Catalog shapes aligned to Master Plan §11. Extra fields are noted in comments. */

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
};

export type ProductStatus = "active" | "draft";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  /** Not in §11 — short PDP/card lede. Likely a new column or derived later. */
  shortDescription: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stockQty: number;
  weight: number;
  /** Remote URL when a supplier photo exists; otherwise a coming-soon placeholder. */
  images: string[];
  status: ProductStatus;
};

export type Bundle = {
  id: string;
  name: string;
  slug: string;
  description: string;
  bundlePrice: number;
  image: string;
};

export type BundleItem = {
  id: string;
  bundleId: string;
  productId: string;
  quantity: number;
};

export type CatalogItem =
  | { kind: "product"; product: Product }
  | { kind: "bundle"; bundle: Bundle; separateTotal: number; teaser: string };

export type ShopSort = "featured" | "price-asc" | "price-desc";

export type ShopFilters = {
  category?: string;
  sort?: ShopSort;
  bundlesOnly?: boolean;
};

export type WishlistKind = "product" | "bundle";

/** Client-side wishlist key — slug only, never a regenerating ID. */
export type WishlistItem = {
  kind: WishlistKind;
  slug: string;
};

export type ResolvedWishlistEntry = CatalogItem & { stockQty: number };

/** Cart line — same exclusivity as §11 order_items (product XOR bundle). */
export type CartLine = {
  id: string;
  productId: string | null;
  bundleId: string | null;
  quantity: number;
  /** Display snapshot so the cart does not need the live catalog. */
  name: string;
  slug: string;
  image: string;
  unitPrice: number;
};

export type PaymentMethod = "cod" | "online";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "returned"
  | "payment_failed"
  | "needs_review";

export type PaymentGateway = "cod" | "safepay";

export type PaymentStatus =
  | "pending_collection"
  | "collected_on_delivery"
  | "awaiting_payment"
  | "paid"
  | "failed"
  | "payment_failed";

export type ShipmentStatus =
  | "pending"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "returned";

/** Matches §11 order_items. name/slug/image are display denormalization only. */
export type OrderItem = {
  id: string;
  orderId: string;
  productId: string | null;
  bundleId: string | null;
  quantity: number;
  unitPrice: number;
  name: string;
  slug: string;
  image: string;
};

/** Matches §11 payments (1:1 with order). */
export type Payment = {
  id: string;
  orderId: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  transactionRef: string | null;
  amount: number;
  paidAt: string | null;
};

/** Matches §11 shipments (1:1 with order). */
export type Shipment = {
  id: string;
  orderId: string;
  courierName: string | null;
  trackingNumber: string | null;
  status: ShipmentStatus;
  lastEvent: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
};

/** Guest shipping snapshot stored on the order, not a live addresses row. */
export type GuestShipping = {
  name: string;
  phone: string;
  addressLine: string;
  city: string;
};

export type Order = {
  id: string;
  userId: string | null;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  couponCode: string | null;
  reviewReason: string | null;
  total: number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  shipping: GuestShipping;
  items: OrderItem[];
  payment: Payment;
  shipment: Shipment;
};
