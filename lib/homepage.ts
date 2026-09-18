export const homepage = {
  hero: {
    tag: "MAKE YOUR SPACE FEEL LIKE YOU",
    title: "Small, affordable touches that make a room feel like yours.",
    body: "Curated bundles for the corner, desk, or bedroom you're finally ready to fix up — under PKR 3,000, delivered nationwide, Cash on Delivery available.",
    primaryCta: { label: "Shop the Edit", href: "/shop" },
    secondaryCta: { label: "Shop Bundles", href: "/shop?bundles=1" },
    gradient: "linear-gradient(160deg, #DCCFC0 0%, #C98F86 60%, #9CA88B 130%)",
    artLabel: "Lifestyle photo — warm, natural light, styled room corner",
  },
  moods: {
    title: "Shop by mood",
    link: { label: "View all rooms", href: "/room-edits" },
    items: [
      {
        name: "Cozy Corner",
        href: "/room-edits/cozy-corner",
        gradient: "linear-gradient(150deg, #D9CBBA, #C98F86)",
      },
      {
        name: "Study Desk",
        href: "/room-edits/study-desk",
        gradient: "linear-gradient(150deg, #D2D9C4, #9CA88B)",
      },
      {
        name: "Minimal Bedroom",
        href: "/room-edits/minimal-bedroom",
        gradient: "linear-gradient(150deg, #E2D6C5, #B8A88F)",
      },
      {
        name: "Glow-Up Corner",
        href: "/room-edits/glow-up-corner",
        gradient: "linear-gradient(150deg, #D9C7C2, #C9A6A0)",
      },
    ],
  },
  bundles: {
    title: "Bundles",
    link: { label: "All bundles", href: "/shop?bundles=1" },
    items: [
      {
        name: "Cozy Room Bundle",
        description: "Fairy lights, poster, mini vase, artificial flowers, candle",
        was: "PKR 3,100",
        now: "PKR 2,499",
        gradient: "linear-gradient(140deg, #E5DBC9, #C98F86)",
      },
      {
        name: "Study Desk Bundle",
        description: "Desk organizer, mini plant, candle, frame, small lamp",
        was: "PKR 2,750",
        now: "PKR 2,199",
        gradient: "linear-gradient(140deg, #DCE2CE, #9CA88B)",
      },
      {
        name: "Minimal Room Bundle",
        description: "Two posters, vase, artificial plant, candle",
        was: "PKR 2,300",
        now: "PKR 1,899",
        gradient: "linear-gradient(140deg, #E3D5CC, #B99A88)",
      },
    ],
  },
  bestSellers: {
    title: "Best sellers",
    link: { label: "Shop all", href: "/shop" },
    items: [
      {
        name: "Warm Glow Fairy Lights",
        price: "PKR 799",
        gradient: "linear-gradient(145deg, #EADFC9, #C98F86)",
      },
      {
        name: "Mini Terrazzo Vase",
        price: "PKR 1,150",
        gradient: "linear-gradient(145deg, #DCE2CE, #9CA88B)",
      },
      {
        name: "Desk Organizer Set",
        price: "PKR 1,450",
        gradient: "linear-gradient(145deg, #E8DACB, #B99A88)",
      },
      {
        name: "Vanilla Amber Candle",
        price: "PKR 950",
        gradient: "linear-gradient(145deg, #E3D5CC, #CBA79C)",
      },
    ],
  },
  inspiration: {
    title: "Room inspiration",
    main: "linear-gradient(150deg, #DCCFC0, #9CA88B)",
    secondary: [
      "linear-gradient(150deg, #E3D5CC, #C98F86)",
      "linear-gradient(150deg, #D9CBBA, #B8A88F)",
    ],
  },
  reviews: {
    title: "What customers say",
    items: [
      {
        quote:
          "My hostel room finally feels like mine. The cozy bundle was worth every rupee.",
        who: "— Amna, Lahore",
      },
      {
        quote: "Ordered COD, arrived in 3 days, packaging felt genuinely premium.",
        who: "— Zara, Karachi",
      },
      {
        quote:
          "Bought the desk bundle for my sister's birthday — she loved it.",
        who: "— Hira, Islamabad",
      },
    ],
  },
  newsletter: {
    title: "Get 10% off your first order",
    body: "Join the list for new bundles, room edits, and restock alerts.",
    placeholder: "Your email or WhatsApp number",
    cta: "Subscribe",
  },
  footer: {
    blurb:
      "Make your space feel like you. Affordable, aesthetic home décor across Pakistan.",
    columns: [
      {
        title: "Shop",
        links: [
          { label: "Bundles", href: "/shop?bundles=1" },
          { label: "New Arrivals", href: "/shop" },
          { label: "Best Sellers", href: "/shop" },
          { label: "Gifting", href: "/gifting" },
        ],
      },
      {
        title: "Help",
        links: [
          { label: "Track Order", href: "/track-order" },
          { label: "Shipping Policy", href: "#footer" },
          { label: "Returns", href: "#footer" },
          { label: "FAQ", href: "#footer" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About Us", href: "#footer" },
          { label: "Contact", href: "#newsletter" },
          { label: "Instagram", href: "#footer" },
          { label: "TikTok", href: "#footer" },
        ],
      },
    ],
  },
} as const;
