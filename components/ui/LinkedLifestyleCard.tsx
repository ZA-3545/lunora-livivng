import Link from "next/link";
import { LifestylePhoto } from "@/components/ui/LifestylePhoto";
import { PhotoCreditLink } from "@/components/ui/PhotoCreditLink";
import type { PexelsPhoto } from "@/lib/media/pexels";

export function LinkedLifestyleCard({
  href,
  photo,
  className,
  photoClassName,
  children,
}: {
  href: string;
  photo: PexelsPhoto;
  className?: string;
  photoClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`lifestyle-linked ${className ?? ""}`.trim()}>
      <Link href={href} className="mood-card">
        <LifestylePhoto photo={photo} className={photoClassName} showCredit={false}>
          {children}
        </LifestylePhoto>
      </Link>
      <PhotoCreditLink photo={photo} />
    </div>
  );
}
