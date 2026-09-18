import Link from "next/link";
import { requireAdminPage } from "@/lib/admin/guard";
import { listAdminCustomers } from "@/lib/admin/db";
import { formatPkr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await requireAdminPage();
  const customers = await listAdminCustomers();

  return (
    <>
      <h1>Customers</h1>
      <p className="admin-lead">
        Guest buyers grouped by phone. There are no user accounts yet.
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Phone</th>
              <th>Name</th>
              <th>Orders</th>
              <th>Spend</th>
              <th>Last order</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5}>No customers yet.</td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.phone_digits}>
                  <td>
                    <Link href={`/admin/customers/${customer.phone_digits}`}>
                      {customer.phone}
                    </Link>
                  </td>
                  <td>{customer.name}</td>
                  <td>{customer.order_count}</td>
                  <td>{formatPkr(Number(customer.spend))}</td>
                  <td>{new Date(customer.last_order_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
