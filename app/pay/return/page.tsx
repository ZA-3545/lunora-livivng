import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { ConfirmationView } from "@/components/orders/ConfirmationView";

export const metadata = {
  title: "Payment result — Lunora Living",
};

export default function PayReturnPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <section className="commerce-page">
            <div className="wrap">
              <h1>Payment result</h1>
            </div>
          </section>
        }
      >
        <ConfirmationView />
      </Suspense>
    </PageShell>
  );
}
