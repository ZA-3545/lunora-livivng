import { resolveWishlistItems } from "@/lib/catalog";
import { isWishlistItem } from "@/lib/wishlist-storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    items?: unknown;
  } | null;
  const items = Array.isArray(body?.items)
    ? body.items.filter(isWishlistItem)
    : [];
  const { resolved, kept } = await resolveWishlistItems(items);
  return Response.json({ resolved, kept });
}
