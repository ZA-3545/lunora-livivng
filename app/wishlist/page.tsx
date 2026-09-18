import { PageShell } from "@/components/layout/PageShell";
import { WishlistView } from "@/components/wishlist/WishlistView";

export const metadata = {
  title: "Wishlist — Lunora Living",
};

export default function WishlistPage() {
  return (
    <PageShell>
      <WishlistView />
    </PageShell>
  );
}
