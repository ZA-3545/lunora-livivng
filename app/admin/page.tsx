import { requireAdminPage } from "@/lib/admin/guard";
import { getAdminStats } from "@/lib/admin/db";
import { formatPkr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const stats = await getAdminStats();

  return (
    <>
      <h1>Sales</h1>
      <p className="admin-lead">
        Live totals from the orders and order_items tables.
      </p>
      <div className="admin-cards">
        <div className="admin-card">
          <span>Orders today</span>
          <strong>{stats.orders_today}</strong>
        </div>
        <div className="admin-card">
          <span>Orders this week</span>
          <strong>{stats.orders_week}</strong>
        </div>
        <div className="admin-card">
          <span>Total revenue</span>
          <strong>{formatPkr(Number(stats.revenue))}</strong>
        </div>
        <div className="admin-card">
          <span>All orders</span>
          <strong>{stats.orders_all}</strong>
        </div>
      </div>

      <h1>Top 5 selling products</h1>
      <p className="admin-lead">
        Direct product lines plus products sold inside bundles.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Units</th>
            </tr>
          </thead>
          <tbody>
            {stats.topProducts.length === 0 ? (
              <tr>
                <td colSpan={2}>No order items yet.</td>
              </tr>
            ) : (
              stats.topProducts.map((row: { sku: string; name: string; qty: number }) => (
                <tr key={row.sku}>
                  <td>{row.name}</td>
                  <td>{row.qty}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
