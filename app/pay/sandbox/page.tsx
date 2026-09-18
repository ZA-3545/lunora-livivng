import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { SandboxCheckoutView } from "@/components/checkout/SandboxCheckoutView";

export const metadata = {
  title: "Safepay sandbox — Lunora Living",
};

export default function PaySandboxPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <section className="commerce-page">
            <div className="wrap">
              <h1>Safepay sandbox</h1>
            </div>
          </section>
        }
      >
        <SandboxCheckoutView />
      </Suspense>
    </PageShell>
  );
}
