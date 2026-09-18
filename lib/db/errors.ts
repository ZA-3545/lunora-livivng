export type OrderErrorCode =
  | "INSUFFICIENT_STOCK"
  | "VALIDATION"
  | "NOT_FOUND"
  | "INVALID_CODE"
  | "EXPIRED"
  | "MIN_ORDER"
  | "LIMIT_REACHED"
  | "COURIER_FAILED";

export class OrderError extends Error {
  constructor(
    public code: OrderErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "OrderError";
  }
}
