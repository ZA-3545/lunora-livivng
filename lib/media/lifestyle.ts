import { cache } from "react";
import {
  pexelsPage,
  pexelsSrc,
  searchPexelsPhoto,
  type PexelsPhoto,
} from "@/lib/media/pexels";

export type LifestyleSlot =
  | "hero"
  | "cozy-corner"
  | "study-desk"
  | "minimal-bedroom"
  | "glow-up-corner"
  | "inspiration-main"
  | "inspiration-a"
  | "inspiration-b"
  | "gifting";

export type MoodSlot = "cozy-corner" | "study-desk" | "minimal-bedroom" | "glow-up-corner";

type SlotSpec = {
  query: string;
  orientation: "portrait" | "landscape";
  fallback: PexelsPhoto;
};

function fallback(
  id: number,
  alt: string,
  photographer: string,
  photographerPath: string,
  width: number,
): PexelsPhoto {
  return {
    id,
    src: pexelsSrc(id, width),
    alt,
    photographer,
    photographerUrl: photographerPath
      ? `https://www.pexels.com/${photographerPath}`
      : "https://www.pexels.com",
    pageUrl: pexelsPage(id),
  };
}

const SLOTS: Record<LifestyleSlot, SlotSpec> = {
  hero: {
    query: "cozy bedroom warm lighting interior",
    orientation: "portrait",
    fallback: fallback(
      1454806,
      "Sunlit bedroom with layered bedding",
      "",
      "",
      1200,
    ),
  },
  "cozy-corner": {
    query: "cozy room corner blanket warm",
    orientation: "portrait",
    fallback: fallback(
      1571460,
      "Soft seating corner in a calm room",
      "",
      "",
      900,
    ),
  },
  "study-desk": {
    query: "aesthetic study desk apartment",
    orientation: "portrait",
    fallback: fallback(
      4050315,
      "Laptop and notebooks on a study desk",
      "Vlada Karpovich",
      "@vlada-karpovich/",
      900,
    ),
  },
  "minimal-bedroom": {
    query: "minimal bedroom interior calm",
    orientation: "portrait",
    fallback: fallback(1643383, "Quiet minimal bedroom", "", "", 900),
  },
  "glow-up-corner": {
    query: "fairy lights bedroom aesthetic corner",
    orientation: "portrait",
    fallback: fallback(
      1125135,
      "Warm string lights in a room",
      "",
      "",
      900,
    ),
  },
  "inspiration-main": {
    query: "styled apartment living room natural light",
    orientation: "landscape",
    fallback: fallback(
      1571453,
      "Styled living room with natural light",
      "",
      "",
      1400,
    ),
  },
  "inspiration-a": {
    query: "home decor shelf apartment",
    orientation: "landscape",
    fallback: fallback(1090638, "Shelf of home objects", "", "", 900),
  },
  "inspiration-b": {
    query: "warm living room home decor",
    orientation: "landscape",
    fallback: fallback(1350789, "Warm living-room seating", "", "", 900),
  },
  gifting: {
    query: "wrapped gift box home interior",
    orientation: "landscape",
    fallback: fallback(264771, "A wrapped gift on a table", "", "", 1200),
  },
};

export const getLifestylePhoto = cache(async (slot: LifestyleSlot) => {
  const spec = SLOTS[slot];
  try {
    const live = await searchPexelsPhoto(spec.query, spec.orientation);
    if (live) return live;
  } catch {
    // Use the curated Pexels photo if search is unavailable.
  }
  return spec.fallback;
});


export async function getMoodPhotos(): Promise<Record<MoodSlot, PexelsPhoto>> {
  const [cozy, desk, minimal, glow] = await Promise.all([
    getLifestylePhoto("cozy-corner"),
    getLifestylePhoto("study-desk"),
    getLifestylePhoto("minimal-bedroom"),
    getLifestylePhoto("glow-up-corner"),
  ]);
  return {
    "cozy-corner": cozy,
    "study-desk": desk,
    "minimal-bedroom": minimal,
    "glow-up-corner": glow,
  };
}
