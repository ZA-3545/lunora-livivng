import Link from "next/link";
import { notFound } from "next/navigation";
import { BundleCard } from "@/components/catalog/BundleCard";
import { CatalogGrid } from "@/components/catalog/CatalogGrid";
import { PageShell } from "@/components/layout/PageShell";
import { LifestylePhoto } from "@/components/ui/LifestylePhoto";
import { getRoomEditPage } from "@/lib/catalog";
import { getLifestylePhoto, type LifestyleSlot } from "@/lib/media/lifestyle";
import { roomEdits } from "@/lib/room-edits";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const edit = await getRoomEditPage(slug);
  return {
    title: edit ? `${edit.name} — Lunora Living` : "Room Edit — Lunora Living",
    description: edit?.lede,
  };
}

export default async function RoomEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const edit = await getRoomEditPage(slug);
  if (!edit) notFound();
  const banner = await getLifestylePhoto(edit.slug as LifestyleSlot);

  return (
    <PageShell>
      <section className="catalog-page">
        <div className="wrap">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/room-edits">Room Edits</Link>
            <span>/</span>
            <span>{edit.name}</span>
          </nav>
          <LifestylePhoto photo={banner} className="edit-banner" />
          <div className="page-intro">
            <p className="pdp-kicker">Room Edit</p>
            <h1>{edit.name}</h1>
            <p>{edit.lede}</p>
            <p>{edit.body}</p>
            {edit.stockQty < 1 ? (
              <p className="catalog-empty">
                This look is waiting on a restock. Save the pieces you like,
                or browse another room for now.
              </p>
            ) : null}
          </div>

          <div className="edit-feature">
            <h2 className="edit-heading">The bundle</h2>
            <BundleCard
              bundle={edit.bundle}
              separateTotal={edit.separateTotal}
              teaser={edit.teaser}
            />
          </div>

          <h2 className="edit-heading">The look, piece by piece</h2>
          <CatalogGrid
            items={edit.products.map((product) => ({
              kind: "product" as const,
              product,
            }))}
          />

          <nav className="edit-more" aria-label="Other room edits">
            {roomEdits
              .filter((item) => item.slug !== edit.slug)
              .map((item) => (
                <Link key={item.slug} href={`/room-edits/${item.slug}`}>
                  {item.name}
                </Link>
              ))}
          </nav>
        </div>
      </section>
    </PageShell>
  );
}
