import type { Order, PaymentStatus } from "@/lib/types";

export function paymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "Paid";
    case "awaiting_payment":
      return "Awaiting payment";
    case "payment_failed":
    case "failed":
      return "Payment failed";
    case "pending_collection":
      return "Pending collection (COD)";
    case "collected_on_delivery":
      return "Collected on delivery";
    default:
      return status;
  }
}

export function isOnlineUnpaid(order: Order) {
  return (
    order.paymentMethod === "online" &&
    (order.payment.status === "awaiting_payment" ||
      order.payment.status === "payment_failed" ||
      order.payment.status === "failed" ||
      order.status === "payment_failed")
  );
}
