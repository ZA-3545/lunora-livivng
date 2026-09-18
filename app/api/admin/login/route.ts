import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  expectedAdminToken,
} from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    password?: string;
  } | null;
  const password = String(body?.password ?? "");
  const expected = await expectedAdminToken();
  if (
    !expected ||
    !process.env.ADMIN_PASSWORD ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return Response.json({ error: "Wrong password." }, { status: 401 });
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, expected, adminCookieOptions());
  return Response.json({ ok: true });
}
