"use client";

import { photoCredit, type PexelsPhoto } from "@/lib/media/pexels";

export function PhotoCreditLink({
  photo,
  className,
}: {
  photo: PexelsPhoto;
  className?: string;
}) {
  return (
    <a
      className={`photo-credit ${className ?? ""}`.trim()}
      href={photo.pageUrl}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {photoCredit(photo)}
    </a>
  );
}
