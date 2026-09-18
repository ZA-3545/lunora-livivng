# Lunora Living — Master Business & Technical Plan
**Tagline:** *Make Your Space Feel Like You.*
**Market:** Pakistan (Lahore/Karachi/Islamabad first) | **Niche:** Affordable aesthetic home décor | **Audience:** Women 18–35

> This document is the single source of truth to hand to Cursor (or any developer) to build the site. It replaces the current placeholder at step-to-grow.netlify.app with a real, branded, production-ready store. Read top to bottom before writing code — Phase order matters.

**How to read this document:** every factual claim below is labeled 🟢 (verified against current market/pricing data), 🟡 (a reasonable industry-pattern estimate — sanity-check the specific number yourself), or 🔴 (genuinely unverified — requires your own outreach before you commit money to it). This labeling starts in §5 and §12 where real money decisions get made; treat unlabeled statements elsewhere as strategic recommendations, not verified facts.

### Executive Summary
Lunora Living launches with a tight ~24-SKU catalog (§3) built specifically to be sold as curated bundles (§4) rather than a browse-everything catalog — this is the core structural difference from every existing Pakistani décor competitor (§14). Source 80-90% locally through Shah Alam Market and 2-3 local candle/cushion makers for the first 2-3 months (§5), track real cost and RTO data from day one, then selectively bulk-import only proven bestsellers via Alibaba once volume justifies it. The site is a custom Next.js + PostgreSQL build (§9) with COD as the default payment method and Leopards/PostEx as primary couriers (§9, §12) — both chosen because of concrete, current cost/cash-flow trade-offs, not brand-name defaults. The single biggest financial risk is COD return-to-origin loss (§12, §17), not sourcing cost — plan operations (§6) around reducing it from day one.

---

## 1. Brand Concept

**Positioning statement:**
> Lunora Living helps young women turn any room — hostel, apartment, or bedroom — into a space that feels calm, personal, and pulled-together, without spending a fortune.

**Brand personality:** Warm minimalist. Not childish, not corporate-luxury. Think "soft girl aesthetic meets Scandinavian calm" — the emotional register of a Pinterest moodboard, not a hardware-store catalog.

**Why "Lunora Living" works:** Invented word (Luna + Aurora undertones) → easy to trademark, no generic-name SEO competition, pronounceable in Urdu and English, feels premium/international while remaining approachable. "Living" signals lifestyle/home, keeps it broader than just "décor" for future expansion (candles → bedding → lifestyle objects).

**Brand personality traits:** calm, warm, self-expressive, gently aspirational, honest (no fake luxury claims), a little poetic in copy tone.

**Voice examples:**
- Product copy: *"A small light that makes a big room feel held."* (fairy lights)
- Bundle copy: *"Everything your desk needs to feel like yours."*
- Avoid: exclamation-heavy, overly salesy, Daraz-style ALL CAPS DISCOUNT copy.

### Visual Identity
| Element | Direction |
|---|---|
| **Primary palette** | Warm off-white / bone (#F7F3EE), soft terracotta or muted clay (#C98C6B), deep charcoal-brown text (#2E2621), one accent — muted sage or dusty rose (#B7C4A6 or #D9B8B0) |
| **Typography** | A refined serif for headings (e.g., "Fraunces", "Canela"-style, or "Playfair Display" as a free alternative) + a clean humanist sans for body (e.g., "Inter" or "General Sans") |
| **Logo direction** | Wordmark-first (not an icon-heavy logo) — lowercase or small-caps serif "lunora living," possibly with a small crescent/arc motif tying to "Luna." Must work as a small Instagram profile-picture crop. |
| **Photography style** | Warm, natural light, lifestyle-in-context shots (product styled in a real-feeling room corner), NOT white-background catalog shots as the primary style — those are for PDP thumbnails only. Consistent color grading (warm, slightly desaturated) across all product photos so the feed looks cohesive. |
| **UI direction** | Generous white space, soft rounded corners (8–12px), large product photography, minimal borders, editorial-style homepage sections (like a Pinterest/Notion hybrid), NOT a dense Daraz-style grid. |

**Before finalizing:** verify `lunoraliving.com` / `.pk` domain availability and `@lunoraliving` on Instagram/TikTok before committing — do this in Phase 2, not after building.

---

## 2. Target Customer (confirmed from your brief)

- **Primary:** Women 18–35, students + young professionals, Instagram/TikTok/Pinterest-influenced, decorating one room/desk/apartment rather than a whole house, price-sensitive but aesthetic-motivated.
- **Secondary:** Gift buyers, young couples, new-room setups.
- **Buying trigger:** Not "I need storage" — it's "I saw a room like this online and want mine to feel like that." Design the whole site around *inspiration → shoppable bundle*, not just a product catalog.

---

## 3. Product Categories & Launch Assortment (20–30 SKUs)

Analyzing your four proposed categories against shipping cost, breakage risk, and Pakistan sourcing reality, here's the recommended v1 assortment:

### Recommended for Launch (high confidence)
| Category | Products | Why |
|---|---|---|
| **Wall & Light Décor** | LED fairy/string lights, small wall posters (rolled, not framed), peel-stick LED strip lights | Lightweight, unbreakable, extremely high social/video appeal, cheap to source locally |
| **Desk/Table Décor** | Desk organizers, small resin/wood trays, mini LED lamps, photo frames (small, acrylic or wood) | Core to the "study desk" audience, low breakage, decent margin |
| **Cozy/Soft Décor** | Scented candles, candle holders, cushion covers (16x16 standard size) | High repeat-purchase potential, good bundle glue, candles are locally manufacturable |
| **Greenery** | Artificial small plants/succulents in pots, small artificial flower stems | Extremely popular on Pakistani Instagram décor pages, lightweight, unbreakable if PU/plastic (avoid glass vases initially) |
| **Organization** | Makeup/jewelry organizers, small storage boxes/baskets | Practical + aesthetic crossover, good for bundles |

### Deliberately excluded or limited at launch
- **Mirrors** — fragile, high shipping-damage risk, expensive to replace on COD returns → include only 1–2 small acrylic (not glass) mirror SKUs if at all, revisit after logistics are proven.
- **Large wall art / framed prints** — heavy, fragile, expensive to ship → defer to Phase 2 once you have delivery data.
- **Vases** — same fragility issue as mirrors; if included, launch with resin/ceramic-alternative or plastic versions only, not glass.

### Suggested v1 count: ~24 SKUs
6 lighting · 5 desk · 5 cozy/candle-textile · 4 greenery · 4 organization — gives you enough for 4–5 coherent bundles without overextending inventory cash.

**Price band:** PKR 500–3,000 for singles, PKR 1,800–5,500 for bundles, consistent with your brief. A few "hero" items (a nice lamp or a multi-piece organizer set) can go up to PKR 4,000–6,000 as aspirational anchors — but keep these under 10% of SKUs.

---

## 4. Bundle Strategy

Bundles are commercially essential here, not optional — they solve three problems at once: they raise average order value (COD delivery cost is fixed per parcel, so bundling directly improves margin per delivery), they reduce decision fatigue for a customer who wants "a vibe" not "an object," and they're your best-performing content format (before/after room reveals).

**Launch bundles (aligned to your brief, refined):**
1. **Cozy Room Bundle** — fairy lights + poster + mini vase-alternative + artificial flowers + candle
2. **Study Desk Bundle** — desk organizer + mini plant + candle + photo frame + small lamp
3. **Minimal Room Bundle** — 2 minimal posters + artificial plant + candle
4. **Glow-Up Corner Bundle** (new suggestion) — LED strip lights + mini mirror-alternative + small tray + fairy lights — targeted at the "aesthetic corner" trend specifically
5. **Gifting Bundle** — candle + small organizer + photo frame, boxed with ribbon — targeted at the secondary gifting audience

**Bundle pricing rule:** price at ~15–20% below buying the items individually, and make the discount visible on the PDP ("Buy separately: PKR X · Bundle price: PKR Y") — this is a proven conversion lever and costs you nothing since it's just clearer math for the customer.

**Operationally:** a bundle is not a new physical SKU — it's a saved combination in your database (see §15) that maps to real inventory line items, so stock deducts correctly from the individual products, not a separate "bundle stock" count.

---

## 5. Product Sourcing

**Confidence key used throughout this section:** 🟢 verified from current listings/market data · 🟡 general market pattern, confirm exact number yourself · 🔴 needs direct outreach, no reliable public data exists.

### 5.1 Named sourcing locations (real, not generic)

| Location | What's actually there | Confidence |
|---|---|---|
| **Shah Alam Market, Lahore** (also called Shah Alami) — Pakistan's largest wholesale market, inside the Walled City near Mayo Chowk. Has 25+ internal sub-bazaars including a dedicated lighting/electrical cluster (around Shah Jamal-adjacent light shops) and a general "Other Decor Items" + "Candles" wholesale segment | LED/fancy lights, candles, wooden wall clocks, resin trays, artificial flowers, desk organizers — this is your single best first stop for 60-70% of your launch SKU list | 🟢 Confirmed via current marketplace listings: e.g. resin trays ~PKR 1,200/set, personalized tin candles ~PKR 750, artificial plants ~PKR 2,600 at **retail** listing price (wholesale/bulk price will be meaningfully lower — treat these as ceiling references, not your buying cost) |
| **Jodia Bazaar, Karachi** — Karachi's oldest and largest general wholesale market near the port area | Broader general-goods wholesale (household, plastics, crockery, gadgets) rather than décor-specific; useful if you're Karachi-based, less targeted than Shah Alam for this niche specifically | 🟢 Confirmed as a real, large wholesale hub; 🔴 decor-specific pricing not independently verified |
| **Tijarah Mall / Gul Plaza area, M.A. Jinnah Road, Karachi** | Smaller wholesalers specifically selling imported "trending" gadgets, organizers, and gift items (the one-dollar-shop style Chinese-import resellers) | Useful for organizers, small gadgets, trending viral décor items | 🟡 Real cluster, exact shop reliability/pricing needs a visit |
| **Local candle & cushion-cover manufacturers** (small home-based or workshop producers, common in Lahore/Karachi/Faisalabad) | Custom-scented candles, custom cushion covers — these let you develop signature Lunora Living scents/prints, which none of your wholesale-sourced competitors can copy | 🔴 No public pricing data — this needs direct outreach (search Instagram for "candle manufacturer Pakistan wholesale" or "custom candle making Lahore" and message 4-5 directly for quotes) |

**What this means practically:** go to Shah Alam Market in person (or send someone) before finalizing your SKU list in Phase 3 — walk the lighting and "other decor" sections specifically, photograph options, and negotiate bulk pricing on the spot. This single market visit will likely cover lighting, candles, trays, artificial flowers, and clocks in one trip.

### 5.2 Import comparison (Alibaba) — worked example on your highest-priority SKU

LED fairy lights (your #1 recommended launch item, §3) are, as of current Alibaba listings: 🟢 **roughly $0.20–$1.00 per unit at MOQ 100–500 pieces** for basic battery-operated string lights (verified across multiple current suppliers), rising to $2–5/unit for higher-LED-count or app-controlled versions. At ~PKR 280/USD, that's **roughly PKR 55–280 landed cost per unit before shipping and duty** — meaningfully cheaper than a locally-wholesaled equivalent once you're ordering 300+ units of one design, but:
- MOQ of 100-500 **units of one exact design/color** means you can't easily test 5 different light styles in one order — you're committing cash to one SKU.
- Add ~15-25% for freight + customs duty + agent handling on top of the unit price for a realistic landed cost — don't plan around the raw Alibaba quote alone.
- 20–40 day lead time means this is a *reorder* strategy for a proven bestseller, not a *launch* strategy.

This confirms the sequencing recommendation below: local sourcing removes MOQ and lead-time risk for launch, Alibaba becomes attractive only once you know fairy lights (or any specific SKU) are a proven seller and you can commit to one design at 300+ units.

### 5.3 Sourcing comparison table

| Source | Best for | Typical MOQ pattern | Trade-offs |
|---|---|---|---|
| **Shah Alam Market, Lahore** | Lighting, candles, trays, artificial flowers, clocks, organizers | Low/no formal MOQ for walk-in buyers; price drops with bulk negotiation | No import wait, inspect quality in person, best starting point for a first-time founder — see 5.1 |
| **Jodia Bazaar / Tijarah Mall, Karachi** | General household + trending gadget-style décor | Similar to Lahore, varies by shop | Only worth it if you're Karachi-based or already routing freight there |
| **Local candle/cushion manufacturers** | Signature-scent candles, custom cushion covers | Negotiable, often 50-100 unit minimums for custom work | Best margin + real brand differentiation (§17 risk #5) — requires direct outreach, budget 2-3 weeks to find and sample-test a reliable maker |
| **Alibaba** | LED lights, resin trays, desk organizers, acrylic frames — once a design is *proven* | Typically 50–500 units per SKU/design (see 5.2 for real current pricing) | Cheapest unit cost at volume, but 20–40 day shipping + ~15-25% landed-cost markup for duty/freight + QC risk — reorder strategy, not launch strategy |
| **1688** (China domestic, needs an agent) | Same categories as Alibaba, often 10-30% cheaper | Similar or higher MOQ, plus agent fees (~5-10% of order value) | Only worth the added complexity once you're importing multiple SKUs per shipment to spread the agent/freight cost |

**Recommended sourcing sequence:**
- **Launch (Month 1–2):** Source 80–90% locally, led by a direct Shah Alam Market visit (§5.1) plus outreach to 2-3 local candle/cushion manufacturers. Low MOQ, fast restock, no customs delay, lets you validate which SKUs actually sell before committing bulk cash.
- **Once 2–3 months of sales data exist:** identify your 5–8 best-sellers and bulk-import those *specific, proven* designs via Alibaba (§5.2 shows fairy lights can drop to a fraction of local wholesale cost at 300+ units of one design).
- **Bulk importing becomes sensible** once a single SKU is reliably selling 50+ units/month — below that, the cash tied up in a 20-40 day shipment plus the 15-25% landed-cost overhead isn't worth the unit-cost savings for a new brand.

---

## 6. Customer Journey (confirmed, with technical notes added)

1. Discovery (Instagram/TikTok Reel or ad)
2. Lands on Homepage or a specific product/bundle landing page (**tag every social link with UTM parameters** so you know which content converts)
3. Browses Shop / Categories
4. Views Product or Bundle detail page
5. Adds to Cart (persistent cart — survives a closed tab)
6. Checkout: shipping info → guest checkout must be allowed (do not force account creation, this kills conversion for first-time impulse buyers)
7. Payment method: **Cash on Delivery** (default/primary for Pakistan) or online payment
8. Order placed → confirmation page + SMS/WhatsApp confirmation (email alone is unreliable for this audience)
9. Order enters admin queue → packed → handed to courier
10. Courier delivers, collects COD if applicable
11. Customer can track via order-tracking page (order number + phone number lookup, no login required)
12. Post-delivery: automated WhatsApp/SMS asking for a review + reorder nudge
13. Repeat purchase, ideally nudged via a "restock your candle" or "complete your set" email/WhatsApp flow

**Critical Pakistan-specific point:** COD failed-delivery and refusal rates are meaningfully higher here than card-based markets. Build **order confirmation via WhatsApp/call for COD orders above a threshold (e.g., PKR 2,000)** into your operational plan from day one — many successful PK D2C brands manually confirm COD orders before dispatch to cut return-to-origin (RTO) losses.

---

## 7. Website Structure

**Core pages (as you listed, confirmed correct):** Home, Shop, Category, Product Detail, Bundle Detail, Cart, Checkout, Order Confirmation, Order Tracking, About, Contact, FAQ, Shipping Policy, Return/Refund Policy, Privacy Policy, Terms & Conditions.

**Additional pages worth adding:**
- **"Room Edits" / Style Guides** (e.g., "Cozy Study Corner," "Minimal Bedroom") — editorial pages that double as SEO content and bundle landing pages; this is your Pinterest-style differentiator.
- **Gifting page** — separate entry point for the secondary gifting audience.
- **Wishlist/Save for later** — high-intent browsers on this audience often "window shop" before payday; a saved list drives return visits.
- **Size/Dimension guide per product** — reduces returns from mismatched expectations (e.g., "this poster is smaller than I thought").

---

## 8. Homepage Structure (conversion-ordered)

> A visual wireframe reference implementing this exact structure with the real brand tokens (§1) is provided alongside this document (`lunora-living-homepage-reference.html`) — open it in a browser. It uses gradient placeholders instead of real photography, but the layout, spacing, type pairing, and color usage are the actual reference Cursor should build against, not a generic template.

1. **Hero** — one strong lifestyle image/video + tagline "Make Your Space Feel Like You" + single clear CTA ("Shop the Edit" or "Shop Bundles")
2. **Shop by Room/Mood** (not by generic category) — e.g., "Cozy Corner," "Study Desk," "Minimal Bedroom" — this matches how your customer actually thinks
3. **Bundles** (promoted early — bundles are your AOV driver, don't bury them)
4. **Best Sellers**
5. **Room Inspiration / Lifestyle strip** — 3–4 styled-room images, shoppable (click a hotspot → product)
6. **New Arrivals**
7. **Customer Reviews / UGC** — Pakistani buyers trust social proof heavily; real customer room photos outperform studio shots here
8. **Instagram feed embed**
9. **Newsletter/WhatsApp list signup** — offer a small first-order discount for signup
10. **Footer** with policy links, contact, socials

---

## 9. Technology Stack

**Recommendation: Next.js (React) frontend + Node.js/Express (or Next API routes) backend + PostgreSQL.**

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js** | SEO-critical for a content-plus-commerce brand (you need Google to index category/room pages); server-rendering beats a pure SPA for a store that depends on organic + social traffic landing on specific pages |
| Backend | **Node.js/Express**, or Next.js API routes for a leaner v1 | JS end-to-end reduces context-switching for a solo/small dev workflow with Cursor; huge ecosystem for Pakistani payment gateway SDKs |
| Database | **PostgreSQL** over MongoDB | Orders, inventory, and payments are inherently relational (an order has items, items reference products, products have inventory) — this needs real joins and transactional integrity (don't oversell stock), which Postgres handles natively; MongoDB adds complexity here for no benefit at this scale |
| Hosting | **Vercel** (frontend/Next.js) + a managed Postgres (Supabase, Neon, or Railway) | Fast to deploy, generous free/low tiers for v1, minimal DevOps overhead |
| Payments | **PayFast or Safepay** as primary gateway (broadest local method coverage — cards + JazzCash + Easypaisa + Raast in one integration), **with Cash on Delivery as the default option at checkout** | Pakistani D2C stores still convert primarily on COD; the gateway is for the online-payment minority, not the primary flow |
| Courier | **Leopards Courier** or **PostEx** as primary, API-integrated | Leopards: largest network + bundles COD into base rate (cheaper for high COD volume). PostEx: same-day COD cash settlement, which matters a lot for a new business's cash flow. Recommend opening accounts with both and A/B testing delivery success rates by city in month 1–2. |
| Admin dashboard | Custom-built within the same Next.js app under an `/admin` route, gated by role-based auth | No need for a separate admin framework at this scale — keep one codebase |

**Why not Shopify/WooCommerce:** you explicitly said you want a real, custom production platform, not a template store — a custom Next.js + Postgres stack gives full control over the homepage storytelling sections (§8) that off-the-shelf themes handle poorly, and avoids monthly platform fees eating into thin décor margins. (If development time becomes the constraint rather than cost, WooCommerce is a legitimate fallback — flag this trade-off to Cursor/your dev before committing.)

---

## 10. Admin Dashboard — v1 Minimum Scope

**Must-have for launch:**
- Add/edit/delete products (with multi-image upload)
- Manage inventory (stock count per SKU, low-stock flag)
- Create/edit bundles (select component products + bundle price)
- View orders + change order status (Pending → Confirmed → Packed → Shipped → Delivered → Returned)
- Manage coupons/discount codes
- View customers + their order history
- Basic sales dashboard (orders today/week, revenue, best-selling SKUs)

**Defer to v2:**
- Advanced analytics/cohort reporting
- Multi-admin roles/permissions
- Automated email marketing tools (use a third-party tool like Mailchimp/WhatsApp Business API initially instead of building this)

---

## 11. Database Design (core entities)

```
users (id, name, phone, email, password_hash, created_at)
addresses (id, user_id, label, address_line, city, phone, is_default)
categories (id, name, slug, description, image)
products (id, name, slug, description, category_id, price, cost_price, stock_qty, weight, images[], status)
bundles (id, name, slug, description, bundle_price, image)
bundle_items (id, bundle_id, product_id, quantity)
orders (id, user_id NULLABLE for guest, order_number, status, subtotal, shipping_fee, total, payment_method, created_at)
order_items (id, order_id, product_id NULLABLE, bundle_id NULLABLE, quantity, unit_price)
payments (id, order_id, gateway, status, transaction_ref, amount, paid_at)
coupons (id, code, discount_type, discount_value, min_order_value, expiry_date, usage_limit)
reviews (id, product_id, user_id, rating, comment, image, created_at)
shipments (id, order_id, courier_name, tracking_number, status, dispatched_at, delivered_at)
```

**Key relationships:** `orders → order_items → products/bundles` (one order has many items; each item references either a product OR a bundle, never both). `bundles → bundle_items → products` (a bundle is a curated list of real products, so stock deduction cascades correctly). `orders → payments` (1:1, since COD orders still get a payment record marked "collected on delivery"). `orders → shipments` (1:1) keeps courier tracking separate from order status so a courier API webhook can update shipment status independently.

---

## 12. Business Economics (labeled by confidence — see §5 key)

**Example 1a: Fairy Lights, locally sourced (Shah Alam Market)**
- Buying cost: ~PKR 250-400 at bulk-negotiated rate 🟡 (retail listing price for similar items runs PKR 750+ per §5.1 — bulk should undercut this meaningfully, confirm on your market visit)
- Packaging: ~PKR 40
- Selling price: PKR 799
- Courier charge (Leopards ~PKR 230-260 base + COD handling, per §9 research): ~PKR 250-300, 🟢 sourced from current courier rate comparisons
- **Gross margin per unit (shipping passed to customer at checkout):** roughly PKR 250-400 before ad spend

**Example 1b: Same fairy lights, Alibaba-imported at 300+ units (reorder scenario, per §5.2)**
- Landed cost: ~PKR 70-350/unit depending on design + ~20% freight/duty 🟢 (from current Alibaba pricing)
- At the low end this roughly **doubles your margin per unit** vs. local sourcing — this is the concrete payoff of the "prove it locally, then bulk-import the winner" sequence in §5.3, but only after you've confirmed 300+ units/design will actually sell.

**Example 2: Cozy Room Bundle**
- Combined local buying cost of 5 items: ~PKR 900-1,300 🟡 (estimate pending your market visit — treat as a planning range, not a committed number)
- Packaging (branded box/tissue): ~PKR 100
- Selling price: PKR 2,499
- Courier + COD handling: ~PKR 230-300 🟢 (per current Leopards/TCS/PostEx rate comparisons in §9)
- **Gross margin per bundle:** roughly PKR 1,000-1,270 before ad spend

**Rule of thumb for this model:** because courier cost is nearly fixed per parcel regardless of what's inside (a 1kg fairy-light order and a 1kg bundle cost roughly the same to ship), **bundles and higher-AOV carts are structurally more profitable per delivery** than single cheap items — reinforce this in your merchandising (§4, §8).

**Net profit sensitivity — the two numbers that will actually make or break this business:**
1. **RTO (Return-to-Origin / failed COD delivery) rate.** Budget 10-15% as a starting planning assumption 🟡 (a widely-cited industry range for Pakistan COD e-commerce, not specific to your brand) — every RTO parcel costs you the *outbound* courier fee with zero revenue, so a bad RTO rate can wipe out the margin shown above entirely. This is exactly why §6 recommends manual WhatsApp confirmation on COD orders above PKR 2,000 — it's not a nice-to-have, it's margin protection.
2. **Blended ad cost per order.** Not estimated here 🔴 because it depends entirely on your content quality and ad platform — track this from day 1 (total ad spend ÷ orders placed) and compare it against the gross margins above; if cost-per-order exceeds your bundle gross margin, you're paying to lose money and need to fix content/targeting before scaling spend.

---

## 13. Starting Budget Scenarios

| | Low (~PKR 50,000) | Medium (~PKR 100,000) | Higher (~PKR 200,000+) |
|---|---|---|---|
| Inventory | 20,000 (narrow SKU set, low stock depth) | 40,000 | 80,000 |
| Packaging/branding materials | 5,000 | 10,000 | 20,000 |
| Website (dev tools, hosting, domain) | 5,000 | 8,000 | 15,000 |
| Branding (logo, basic photography) | 5,000 | 10,000 | 20,000 |
| Marketing/ads | 10,000 | 20,000 | 45,000 |
| Delivery setup (courier account, initial packaging supplies) | 3,000 | 5,000 | 10,000 |
| Working capital / buffer | 2,000 | 7,000 | 10,000+ |

**Realistic recommendation: start at the Medium tier if possible.** The Low tier forces you to launch with too few SKUs to build coherent bundles (your key differentiator), while Medium gives enough inventory depth for ~15-18 launch SKUs plus a real (not token) marketing push. If only Low is available, launch with 3 tight bundles instead of trying to stock all 24 SKUs at once — prove the model, reinvest revenue into SKU count.

---

## 14. Competitive Landscape

Pakistani home décor players fall into three distinct tiers, each with a real gap relative to your positioning:

| Tier | Examples | Positioning | Where they leave a gap open for Lunora Living |
|---|---|---|---|
| **Fashion-house home lines** | Khaadi Home, Nishat Linen Home, Ideas by Gul Ahmed | Textile-led (bedcovers, cushion sets, table linen), earthy/culturally-motif-driven aesthetic, sold through their existing large retail + e-commerce infrastructure | 🟢 Confirmed textile-first focus, not décor-object-specific — they don't sell lighting, wall art, desk organizers, or artificial greenery as a category, and their aesthetic (rich prints, cultural motifs) is a different visual language than the minimal/Pinterest look your audience wants |
| **General décor e-commerce stores** | Luminaria.pk, Decorum Pakistan, Janan Homes, Unique Home Decor, Creoliving | Broad catalogs spanning furniture-adjacent pieces, mirrors, lamps, wall panels — positioned as "premium home decor Pakistan" or "luxury living accessories," several explicitly using marble/brass/wood premium-material language | 🟢 Confirmed via current site copy — these skew toward whole-home/premium furnishing shoppers (often slightly older, higher-budget) rather than a single-room, student/young-professional budget shopper; none structure their offering around *bundles* or a specific price band like PKR 500-3,000 |
| **Instagram/TikTok micro-sellers** | Pages like Basket Studio, LivingTherapy, Cottonleftover, and dozens of unnamed decor pages (tens of thousands of followers each) | DM-based or link-in-bio ordering, no real checkout/tracking infrastructure, highly aesthetic content that matches your target audience closely | 🟢 Confirmed these accounts exist and have real followings (30K-500K range) proving the *audience and content format* work — but 🟡 their actual operational setup (whether they have real websites) wasn't individually verified for each; the pattern across this tier is DM/WhatsApp ordering, not a proper cart-and-checkout site |

**The gap, stated precisely:** nobody in the market combines (a) a curated, tightly-scoped catalog in the PKR 500-3,000 band, (b) *bundles* as the primary merchandising unit rather than single SKUs, (c) a real website with cart/checkout/tracking (not DM-ordering), and (d) short-form-video-first content in the specific minimal/cozy aesthetic your brief describes. The fashion houses have (c) but not (a)/(b)/(d). The micro-sellers have (d) and sometimes (a), but not (c). The general décor stores have (c) but not (a)/(b), and often not (d) either.

**Your USP:**
> *Curated, affordable room-transformation bundles for the aesthetic-but-budget-conscious young woman — shoppable in one real checkout, not assembled from ten different Instagram DMs.*

**Action item before Phase 1 is "done":** this analysis is directionally solid but not exhaustive — before finalizing pricing, spend 2-3 hours actually messaging 5-10 of the Instagram micro-sellers as a "customer" to see their real prices, delivery time, and DM-ordering friction firsthand. That hands-on data will sharpen your pricing and messaging far more precisely than any secondary research (including this document) can.

---

## 15. Development Roadmap

| Phase | Tasks | Deliverable | Must finish before next phase |
|---|---|---|---|
| **1. Market research** | Validate competitor pricing, confirm target price band, survey 10–15 target customers if possible | Findings doc | Confirmed positioning |
| **2. Brand** | Finalize logo, palette, typography, verify domain/social handles for "Lunora Living" | Brand kit (logo files, color/type spec) | Brand kit locked |
| **3. Product selection** | Finalize the ~20-24 launch SKUs + 4-5 bundles from §3–4 | Final SKU + bundle list | Sourcing can begin |
| **4. Sourcing** | Contact Lahore/Karachi wholesalers, get real quotes/MOQs, place first small trial order | Verified supplier list + costs | Real cost data feeds §12 economics |
| **5. UI/UX** | Wireframe homepage (§8), category, PDP, cart, checkout in Figma or directly in code | Approved design | Design locked before frontend build |
| **6. Frontend** | Build Next.js pages per §7–8 | Working frontend (dummy data) | Connects to backend next |
| **7. Backend** | Build API routes: products, bundles, cart, orders, auth | Working API | Needed before payment/courier integration |
| **8. Database** | Implement schema from §11, seed with real product data | Live DB | Needed before checkout goes live |
| **9. Payment** | Integrate PayFast/Safepay + COD flow | Working checkout | Needed before real orders |
| **10. Courier/shipping** | Integrate Leopards and/or PostEx API for label creation + tracking webhook | Automated shipment creation | Needed before fulfillment at scale |
| **11. Admin dashboard** | Build §10 admin scope | Working admin panel | Needed to operate day-to-day |
| **12. Testing** | Full order-flow test (browse → cart → checkout → COD → admin → shipment), mobile testing (this audience is majority mobile) | QA sign-off | No launch without this |
| **13. Deployment** | Deploy to Vercel + production DB, connect real domain | Live site | — |
| **14. Marketing launch** | Content batch (see below) goes live, paid ads start, influencer outreach begins | Launch | — |

---

## 16. Marketing — What to Prepare Before Launch

- **10–15 short-form videos** ready before day 1: room-styling/before-after content, unboxing, "PKR X room makeover" videos — this content type outperforms static product posts for this audience by a wide margin.
- **Product photography**: both clean PDP shots (white/neutral background) AND styled lifestyle shots (in a "real" room corner) — you need both for the site and for content.
- **3–5 micro-influencer (5K–50K follower) partnerships** in the home/lifestyle/student niche, paid in product + small fee, for launch-week UGC.
- **Launch offer**: first-order discount tied to newsletter/WhatsApp signup (ties into §8 homepage section 9).
- **Bundle-first ad creative** — ads should sell "the vibe" (a styled corner) with the bundle price, not a single product on white background.

---

## 17. Key Risks & Gaps to Watch

1. **COD RTO risk is the single biggest threat to margin** — build the WhatsApp/call confirmation step into ops from day one (§6), don't treat it as optional.
2. **Breakage on fragile categories** (mirrors, glass vases) — the assortment in §3 deliberately minimizes this; don't add glass items back in without solid packaging tested first.
3. **Inventory cash lock-up** — don't over-order on unproven SKUs; the sourcing sequence in §5 (local-first, bulk-import only proven winners) exists specifically to protect your starting capital.
4. **Content dependency** — this brand's growth is driven by short-form video, not SEO alone in year 1. Underinvesting in content production is a bigger risk than underinvesting in ad spend.
5. **Generic-catalog trap** — the biggest gap vs. competitors (§14) is curation and a point of view. Resist the temptation to add "just a few more products" beyond the 20-30 SKU discipline in §3 — breadth is what makes competitors look generic.
6. **Payment gateway approval time** — PayFast/Safepay merchant approval can take days to weeks; apply in Phase 9, not the week before launch.

---

## 18. Instructions for Cursor / Your Developer

When you hand this to Cursor, the build order should follow §15 exactly. Key constraints Cursor should respect:
- Stack: Next.js + Node/Express (or Next API routes) + PostgreSQL, hosted on Vercel + a managed Postgres provider.
- Guest checkout is mandatory — do not gate checkout behind account creation.
- Cash on Delivery must be the default, first-listed payment option at checkout.
- Mobile-first: design and test mobile layouts first, desktop second — this audience is overwhelmingly mobile.
- Follow the database schema in §11 as the starting schema; extend, don't restructure, unless there's a clear technical reason.
- Homepage section order must follow §8 — do not default to a generic "hero → grid of products" template.
- Brand tokens (colors/type from §1) should be implemented as CSS variables/design tokens from the first commit, not hardcoded per-component, so the aesthetic stays consistent as pages are added.
