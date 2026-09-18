"use client";

import { useState } from "react";
import { CatalogMedia, isRemotePhoto } from "@/components/ui/ComingSoonMedia";

export function ProductGallery({
  name,
  images,
}: {
  name: string;
  images: string[];
}) {
  const real = images.filter((image) => isRemotePhoto(image));
  const [active, setActive] = useState(0);
  const gallery = real.length > 0 ? real : [""];
  const current = gallery[active] ?? gallery[0];

  return (
    <div className="pdp-gallery">
      <CatalogMedia className="pdp-main-image" src={current} name={name} />
      {real.length > 1 ? (
        <div className="pdp-thumbs">
          {real.map((image, index) => (
            <button
              key={image}
              type="button"
              className={index === active ? "pdp-thumb is-active" : "pdp-thumb"}
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${name}`}
            >
              <CatalogMedia
                className="pdp-thumb-media"
                src={image}
                name={`${name} ${index + 1}`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
