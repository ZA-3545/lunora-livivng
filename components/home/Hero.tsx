import Link from "next/link";
import { LifestylePhoto } from "@/components/ui/LifestylePhoto";
import { homepage } from "@/lib/homepage";
import { getLifestylePhoto } from "@/lib/media/lifestyle";

export async function Hero() {
  const { hero } = homepage;
  const photo = await getLifestylePhoto("hero");

  return (
    <section className="hero wrap">
      <div>
        <div className="hero-tag">{hero.tag}</div>
        <h1>{hero.title}</h1>
        <p>{hero.body}</p>
        <div className="hero-actions">
          <Link className="btn" href={hero.primaryCta.href}>
            {hero.primaryCta.label}
          </Link>
          <Link className="btn-outline" href={hero.secondaryCta.href}>
            {hero.secondaryCta.label}
          </Link>
        </div>
      </div>
      <LifestylePhoto photo={photo} className="hero-art" />
    </section>
  );
}
