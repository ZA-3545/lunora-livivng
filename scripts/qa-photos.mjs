const BASE = "http://localhost:3000";

const checks = {
  "/": ["images.pexels.com", "Photo", "Pexels", "Photo coming soon"],
  "/room-edits": ["images.pexels.com", "Cozy Corner"],
  "/room-edits/cozy-corner": ["images.pexels.com", "Photo coming soon", "Cozy Room Bundle"],
  "/gifting": ["images.pexels.com", "Photo coming soon", "Gifting Bundle"],
  "/product/warm-glow-fairy-lights": ["Photo coming soon"],
  "/bundle/cozy-room-bundle": ["Photo coming soon"],
  "/shop": ["Photo coming soon"],
};

async function main() {
  const report = {};
  for (const [path, needles] of Object.entries(checks)) {
    const res = await fetch(`${BASE}${path}`);
    const html = await res.text();
    const fakeProductPhoto =
      path.startsWith("/product") || path.startsWith("/bundle") || path === "/shop"
        ? html.includes("images.pexels.com") && html.includes("p-img")
        : false;
    report[path] = {
      status: res.status,
      missing: needles.filter((needle) => !html.includes(needle)),
      pexelsCount: (html.match(/images\.pexels\.com/g) || []).length,
      comingSoonCount: (html.match(/Photo coming soon/g) || []).length,
      fakeProductPhoto,
    };
  }
  console.log(JSON.stringify(report, null, 2));
  const failed = Object.entries(report).some(
    ([, row]) => row.status !== 200 || row.missing.length || row.fakeProductPhoto,
  );
  if (failed) throw new Error("Photo QA failed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
