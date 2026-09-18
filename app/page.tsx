import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Hero } from "@/components/home/Hero";
import { ShopByMood } from "@/components/home/ShopByMood";
import { Bundles } from "@/components/home/Bundles";
import { BestSellers } from "@/components/home/BestSellers";
import { RoomInspiration } from "@/components/home/RoomInspiration";
import { Reviews } from "@/components/home/Reviews";
import { Newsletter } from "@/components/home/Newsletter";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ShopByMood />
        <Bundles />
        <BestSellers />
        <RoomInspiration />
        <Reviews />
        <Newsletter />
      </main>
      <SiteFooter />
    </>
  );
}
