import { CheckoutView } from "@/components/checkout/CheckoutView";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Checkout — Lunora Living",
  description: "Guest checkout. Cash on Delivery available nationwide.",
};

export default function CheckoutPage() {
  return (
    <PageShell>
      <CheckoutView />
    </PageShell>
  );
}
