import { LifestylePhoto } from "@/components/ui/LifestylePhoto";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { homepage } from "@/lib/homepage";
import { getLifestylePhoto } from "@/lib/media/lifestyle";

export async function RoomInspiration() {
  const { inspiration } = homepage;
  const [main, secondaryA, secondaryB] = await Promise.all([
    getLifestylePhoto("inspiration-main"),
    getLifestylePhoto("inspiration-a"),
    getLifestylePhoto("inspiration-b"),
  ]);

  return (
    <section id="room-inspiration" className="section">
      <div className="wrap">
        <SectionHeader title={inspiration.title} />
        <div className="inspo">
          <LifestylePhoto photo={main} className="inspo-main" />
          <div className="inspo-sub">
            <LifestylePhoto photo={secondaryA} className="inspo-a" />
            <LifestylePhoto photo={secondaryB} className="inspo-b" />
          </div>
        </div>
      </div>
    </section>
  );
}
