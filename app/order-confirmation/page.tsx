import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { ConfirmationView } from "@/components/orders/ConfirmationView";

export const metadata = {
  title: "Order confirmation — Lunora Living",
};

export default function OrderConfirmationPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <section className="commerce-page">
            <div className="wrap">
              <h1>Order confirmation</h1>
            </div>
          </section>
        }
      >
        <ConfirmationView />
      </Suspense>
    </PageShell>
  );
}
