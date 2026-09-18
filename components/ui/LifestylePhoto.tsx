import { PhotoCreditLink } from "@/components/ui/PhotoCreditLink";
import type { PexelsPhoto } from "@/lib/media/pexels";

export function LifestylePhoto({
  photo,
  className,
  children,
  showCredit = true,
}: {
  photo: PexelsPhoto;
  className?: string;
  children?: React.ReactNode;
  showCredit?: boolean;
}) {
  return (
    <figure className={`lifestyle-photo ${className ?? ""}`.trim()}>
      {/* Pexels requires hotlinking their CDN URLs, not rehosting. */}
      <img src={photo.src} alt={photo.alt} />
      {children}
      {showCredit ? (
        <figcaption>
          <PhotoCreditLink photo={photo} />
        </figcaption>
      ) : null}
    </figure>
  );
}
