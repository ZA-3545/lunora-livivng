import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { TrackOrderView } from "@/components/orders/TrackOrderView";

export const metadata = {
  title: "Track order — Lunora Living",
};

export default function TrackOrderPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <section className="commerce-page">
            <div className="wrap">
              <h1>Track order</h1>
            </div>
          </section>
        }
      >
        <TrackOrderView />
      </Suspense>
    </PageShell>
  );
}
