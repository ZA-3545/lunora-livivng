import { AdminNav } from "@/components/admin/AdminNav";
import { hasAdminSession } from "@/lib/admin/guard";
import "@/styles/admin.css";

export const metadata = {
  title: "Admin — Lunora Living",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const signedIn = await hasAdminSession();
  return (
    <div className="admin-root">
      {signedIn ? (
        <div className="admin-shell">
          <AdminNav />
          <div className="admin-main">{children}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
