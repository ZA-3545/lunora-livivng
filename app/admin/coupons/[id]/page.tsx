import { notFound } from "next/navigation";
import { CouponForm } from "@/components/admin/CouponForm";
import { requireAdminPage } from "@/lib/admin/guard";
import { getAdminCoupon } from "@/lib/admin/db";

export const dynamic = "force-dynamic";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const coupon = await getAdminCoupon(id);
  if (!coupon) notFound();

  return (
    <>
      <h1>Edit coupon</h1>
      <CouponForm coupon={coupon} />
    </>
  );
}
