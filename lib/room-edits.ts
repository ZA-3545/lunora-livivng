/** Editorial mapping only — bundles and products come from Postgres. */
export const roomEdits = [
  {
    slug: "cozy-corner",
    name: "Cozy Corner",
    bundleSlug: "cozy-room-bundle",
    gradient: "linear-gradient(150deg, #D9CBBA, #C98F86)",
    lede: "A corner that feels like an exhale. Soft light, one candle, a few stems — enough to make a hostel room or a rented flat feel held, without filling every surface.",
    body: "This is the look people mean when they send a Pinterest screenshot and say “like that.” Start with the bundle if you want it done in one sitting, or pick the pieces that were already on your list.",
  },
  {
    slug: "study-desk",
    name: "Study Desk",
    bundleSlug: "study-desk-bundle",
    gradient: "linear-gradient(150deg, #D2D9C4, #9CA88B)",
    lede: "A desk that looks like yours, not a borrowed table. Lamp, organizer, a plant that does not ask to be remembered, and a quiet candle for the late hours.",
    body: "Built for assignments, laptops, and the small ritual of sitting down. The bundle is the whole reset; every piece also stands on its own if you already have a lamp or a tray.",
  },
  {
    slug: "minimal-bedroom",
    name: "Minimal Bedroom",
    bundleSlug: "minimal-room-bundle",
    gradient: "linear-gradient(150deg, #E2D6C5, #B8A88F)",
    lede: "Two posters, a little green, one candle. Enough to quiet a bedroom without turning it into a catalog.",
    body: "If your room already has too much, this is the edit that subtracts. Hang the prints, set the fern where the light is, and let the rest of the room stay simple.",
  },
  {
    slug: "glow-up-corner",
    name: "Glow-Up Corner",
    bundleSlug: "glow-up-corner-bundle",
    gradient: "linear-gradient(150deg, #D9C7C2, #C98F86)",
    lede: "The corner you keep photographing. Strip light along a shelf, fairy lights in the edge, a small mirror and a tray so the mess looks like a still life.",
    body: "This is the aesthetic-corner look — not a whole-room makeover. Shop the bundle if you want the glow in one go, or take the lights first and add the rest when payday comes.",
  },
] as const;

export const giftingEdit = {
  bundleSlug: "gifting-bundle",
  categorySlugs: ["cozy", "organization"] as const,
  extraNameHints: ["frame"],
  lede: "A gift that feels chosen, not grabbed on the way. For birthdays, a first apartment, a new desk, or the friend who just moved cities.",
  body: "The Gifting Bundle is the easy yes — candle, frame, and a small set of boxes, ready to wrap. Around it, the candles, frames, and organizers people actually keep.",
} as const;

export function getRoomEditMeta(slug: string) {
  return roomEdits.find((edit) => edit.slug === slug);
}
