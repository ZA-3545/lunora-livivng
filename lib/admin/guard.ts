import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin/session";

export async function hasAdminSession() {
  const store = await cookies();
  return isAdminToken(store.get(ADMIN_COOKIE)?.value);
}

export async function requireAdminPage() {
  if (!(await hasAdminSession())) redirect("/admin/login");
}

export async function requireAdminApi() {
  if (!(await hasAdminSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
