import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { ConfirmationView } from "@/components/orders/ConfirmationView";

export const metadata = {
  title: "Payment pending — Lunora Living",
};

export default function PayCancelPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <section className="commerce-page">
            <div className="wrap">
              <h1>Payment pending</h1>
            </div>
          </section>
        }
      >
        <ConfirmationView />
      </Suspense>
    </PageShell>
  );
}
