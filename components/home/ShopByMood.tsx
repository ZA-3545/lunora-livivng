import { LinkedLifestyleCard } from "@/components/ui/LinkedLifestyleCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { homepage } from "@/lib/homepage";

import { getMoodPhotos, type MoodSlot } from "@/lib/media/lifestyle";

const MOOD_SLOTS: MoodSlot[] = [
  "cozy-corner",
  "study-desk",
  "minimal-bedroom",
  "glow-up-corner",
];

export async function ShopByMood() {
  const { moods } = homepage;
  const photos = await getMoodPhotos();

  return (
    <section id="moods" className="section">
      <div className="wrap">
        <SectionHeader
          title={moods.title}
          href={moods.link.href}
          linkLabel={moods.link.label}
        />
        <div className="mood-grid">
          {moods.items.map((mood, index) => {
            const slot = MOOD_SLOTS[index];
            const photo = photos[slot];
            return (
              <LinkedLifestyleCard
                key={mood.name}
                href={mood.href}
                photo={photo}
                photoClassName="mood-photo"
              >
                <span className="mood-label">{mood.name}</span>
              </LinkedLifestyleCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
