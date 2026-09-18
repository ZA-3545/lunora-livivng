import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", { ...adminCookieClear() });
  return Response.json({ ok: true });
}
function adminCookieClear() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

