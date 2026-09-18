/** JS mirror of `styles/tokens.css` — keep hex values in sync with the wireframe. */
export const theme = {
  colors: {
    bg: "#EFE9DE",
    bgAlt: "#E5DED0",
    ink: "#2B2420",
    inkSoft: "#6B6055",
    rose: "#C98F86",
    sage: "#9CA88B",
    card: "#FAF7F1",
    line: "#DDD4C4",
  },
  fonts: {
    heading: "Fraunces",
    body: "Inter",
  },
  radii: {
    tight: "2px",
    media: "4px",
    panel: "6px",
  },
  layout: {
    wrap: 1180,
    desktopBreakpoint: 801,
  },
} as const;
