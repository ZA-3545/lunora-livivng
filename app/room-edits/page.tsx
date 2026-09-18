import { LinkedLifestyleCard } from "@/components/ui/LinkedLifestyleCard";
import { PageShell } from "@/components/layout/PageShell";
import { getRoomEditPages } from "@/lib/catalog";

import { getMoodPhotos, type MoodSlot } from "@/lib/media/lifestyle";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Room Edits — Lunora Living",
  description:
    "Editorial room looks — Cozy Corner, Study Desk, Minimal Bedroom, Glow-Up Corner — each one shoppable.",
};

export default async function RoomEditsIndexPage() {
  const [edits, photos] = await Promise.all([
    getRoomEditPages(),
    getMoodPhotos(),
  ]);

  return (
    <PageShell>
      <section className="catalog-page">
        <div className="wrap">
          <div className="page-intro">
            <h1>Room Edits</h1>
            <p>
              Four looks, not a catalog dump. Each edit is a small room mood —
              the bundle if you want it done, or the pieces that make it.
            </p>
          </div>
          {edits.length === 0 ? (
            <p className="catalog-empty">No room edits are ready yet.</p>
          ) : (
            <div className="mood-grid">
              {edits.map((edit) => (
                <LinkedLifestyleCard
                  key={edit.slug}
                  href={`/room-edits/${edit.slug}`}
                  photo={photos[edit.slug as MoodSlot]}
                  photoClassName="mood-photo"
                >
                  <span className="mood-label">{edit.name}</span>
                </LinkedLifestyleCard>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
