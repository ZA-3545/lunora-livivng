import type {
  Bundle,
  Category,
  Order,
  OrderItem,
  Payment,
  Product,
  Shipment,
} from "@/lib/types";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category_id: string;
  price: number;
  cost_price: number;
  stock_qty: number;
  weight: number;
  images: string[];
  status: Product["status"];
};

type BundleRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  bundle_price: number;
  image: string;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
};

type OrderRow = {
  id: string;
  user_id: string | null;
  order_number: string;
  status: Order["status"];
  subtotal: number;
  shipping_fee: number;
  discount_amount?: number;
  coupon_code?: string | null;
  review_reason?: string | null;
  total: number;
  payment_method: Order["paymentMethod"];
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  created_at: Date | string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  bundle_id: string | null;
  quantity: number;
  unit_price: number;
  name: string;
  slug: string;
  image: string;
};

type PaymentRow = {
  id: string;
  order_id: string;
  gateway: Payment["gateway"];
  status: Payment["status"];
  transaction_ref: string | null;
  amount: number;
  paid_at: Date | string | null;
};

type ShipmentRow = {
  id: string;
  order_id: string;
  courier_name: string | null;
  tracking_number: string | null;
  status: Shipment["status"];
  last_event?: string | null;
  dispatched_at: Date | string | null;
  delivered_at: Date | string | null;
};

function asIso(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image,
  };
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    categoryId: row.category_id,
    price: Number(row.price),
    costPrice: Number(row.cost_price),
    stockQty: Number(row.stock_qty),
    weight: Number(row.weight),
    images: row.images ?? [],
    status: row.status,
  };
}

export function mapBundle(row: BundleRow): Bundle {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    bundlePrice: Number(row.bundle_price),
    image: row.image,
  };
}

export function mapOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    bundleId: row.bundle_id,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    name: row.name,
    slug: row.slug,
    image: row.image,
  };
}

export function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    orderId: row.order_id,
    gateway: row.gateway,
    status: row.status,
    transactionRef: row.transaction_ref,
    amount: Number(row.amount),
    paidAt: asIso(row.paid_at),
  };
}

export function mapShipment(row: ShipmentRow): Shipment {
  return {
    id: row.id,
    orderId: row.order_id,
    courierName: row.courier_name,
    trackingNumber: row.tracking_number,
    status: row.status,
    lastEvent: row.last_event ?? null,
    dispatchedAt: asIso(row.dispatched_at),
    deliveredAt: asIso(row.delivered_at),
  };
}

export function mapOrder(
  row: OrderRow,
  items: OrderItem[],
  payment: Payment,
  shipment: Shipment,
): Order {
  return {
    id: row.id,
    userId: row.user_id,
    orderNumber: row.order_number,
    status: row.status,
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    discountAmount: Number(row.discount_amount ?? 0),
    couponCode: row.coupon_code ?? null,
    reviewReason: row.review_reason ?? null,
    total: Number(row.total),
    paymentMethod: row.payment_method,
    createdAt: asIso(row.created_at) ?? new Date().toISOString(),
    shipping: {
      name: row.shipping_name,
      phone: row.shipping_phone,
      addressLine: row.shipping_address,
      city: row.shipping_city,
    },
    items,
    payment,
    shipment,
  };
}
