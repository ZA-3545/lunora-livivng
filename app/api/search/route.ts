import { searchCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const items = await searchCatalog(q);
  return Response.json({ query: q.trim(), items });
}
