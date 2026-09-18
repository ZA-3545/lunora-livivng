import { CouponForm } from "@/components/admin/CouponForm";
import { requireAdminPage } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function NewCouponPage() {
  await requireAdminPage();
  return (
    <>
      <h1>Add coupon</h1>
      <CouponForm />
    </>
  );
}
