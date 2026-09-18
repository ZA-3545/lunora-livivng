export type PexelsPhoto = {
  id: number;
  src: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  pageUrl: string;
};

type PexelsSearchResponse = {
  photos?: Array<{
    id: number;
    url: string;
    alt?: string | null;
    photographer?: string;
    photographer_url?: string;
    src?: {
      large?: string;
      large2x?: string;
      landscape?: string;
      portrait?: string;
      medium?: string;
    };
  }>;
};

export function pexelsSrc(
  id: number,
  width = 1200,
  extra = "",
) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}${extra}`;
}

export function pexelsPage(id: number) {
  return `https://www.pexels.com/photo/${id}/`;
}

export async function searchPexelsPhoto(
  query: string,
  orientation: "portrait" | "landscape" = "portrait",
): Promise<PexelsPhoto | null> {
  const key = process.env.PEXELS_API_KEY?.trim();
  if (!key) return null;

  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "8");
  url.searchParams.set("orientation", orientation);

  const response = await fetch(url, {
    headers: { Authorization: key },
    next: { revalidate: 86400 },
  });
  if (!response.ok) return null;

  const json = (await response.json()) as PexelsSearchResponse;
  const photo = json.photos?.find((item) => item.src?.large || item.src?.medium);
  if (!photo) return null;

  const src =
    (orientation === "landscape"
      ? photo.src?.landscape
      : photo.src?.portrait) ??
    photo.src?.large ??
    photo.src?.medium ??
    "";
  if (!src) return null;

  return {
    id: photo.id,
    src,
    alt: photo.alt?.trim() || query,
    photographer: photo.photographer?.trim() || "",
    photographerUrl: photo.photographer_url ?? "https://www.pexels.com",
    pageUrl: photo.url || pexelsPage(photo.id),
  };
}

export function photoCredit(photo: PexelsPhoto) {
  return photo.photographer
    ? `Photo by ${photo.photographer} on Pexels`
    : "Photo on Pexels";
}
