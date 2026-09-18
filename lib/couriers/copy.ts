import type { ShipmentStatus } from "@/lib/types";

export function shipmentStatusLabel(status: ShipmentStatus) {
  switch (status) {
    case "pending":
      return "Pending dispatch";
    case "dispatched":
      return "Dispatched";
    case "in_transit":
      return "In transit";
    case "delivered":
      return "Delivered";
    case "returned":
      return "Returned to origin";
    default:
      return status;
  }
}
