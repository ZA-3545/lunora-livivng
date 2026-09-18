import { CartView } from "@/components/cart/CartView";
import { PageShell } from "@/components/layout/PageShell";

export const metadata = {
  title: "Cart — Lunora Living",
};

export default function CartPage() {
  return (
    <PageShell>
      <CartView />
    </PageShell>
  );
}
