import { OrderError } from "@/lib/db/errors";

export function handleOrderError(error: unknown) {
  if (error instanceof OrderError) {
    const status =
      error.code === "INSUFFICIENT_STOCK"
        ? 409
        : error.code === "COURIER_FAILED"
          ? 502
          : error.code === "NOT_FOUND"
            ? 404
            : 400;
    return Response.json(
      { error: error.message, code: error.code },
      { status },
    );
  }
  console.error(error);
  return Response.json({ error: "Something went wrong." }, { status: 500 });
}
