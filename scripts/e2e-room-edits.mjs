import puppeteer from "puppeteer-core";

const BASE = "http://localhost:3000";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const LIVE_MARKERS = {
  "/room-edits": ["Cozy Corner", "Study Desk", "Minimal Bedroom", "Glow-Up Corner"],
  "/room-edits/cozy-corner": ["Cozy Room Bundle", "Warm Glow Fairy Lights", "Vanilla Amber Candle"],
  "/room-edits/study-desk": ["Study Desk Bundle", "Desk Organizer Set", "Mini LED Desk Lamp"],
  "/room-edits/minimal-bedroom": ["Minimal Room Bundle", "Rolled Line-Art Poster", "Small Potted Fern"],
  "/room-edits/glow-up-corner": ["Glow-Up Corner Bundle", "Peel-Stick LED Strip Lights", "Acrylic Mini Mirror"],
  "/gifting": ["Gifting Bundle", "Vanilla Amber Candle", "Acrylic Photo Frame", "Desktop Storage Boxes"],
};

async function main() {
  const htmlChecks = {};
  for (const [path, needles] of Object.entries(LIVE_MARKERS)) {
    const res = await fetch(`${BASE}${path}`);
    const html = await res.text();
    htmlChecks[path] = {
      status: res.status,
      missing: needles.filter((needle) => !html.includes(needle)),
    };
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  const homeHrefs = await page.evaluate(() => {
    const nav = [...document.querySelectorAll(".nav-links a")].map((el) => ({
      label: el.textContent.trim(),
      href: el.getAttribute("href"),
    }));
    const moods = [...document.querySelectorAll(".mood-card")].map((el) => ({
      name: el.textContent.trim(),
      href: el.getAttribute("href"),
    }));
    const viewAll = document.querySelector(".section .wrap a")?.getAttribute("href");
    return { nav, moods, viewAll };
  });

  const clicks = [];
  for (const mood of homeHrefs.moods) {
    await page.goto(`${BASE}${mood.href}`, { waitUntil: "networkidle0" });
    const title = await page.evaluate(() => document.querySelector("h1")?.textContent ?? "");
    clicks.push({ from: "homepage mood", href: mood.href, title, statusOk: title.length > 0 });
  }

  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  await page.click('.nav-links a[href="/room-edits"]');
  await page.waitForFunction(() => location.pathname === "/room-edits");
  const roomIndexTitle = await page.evaluate(() => document.querySelector("h1")?.textContent ?? "");
  clicks.push({ from: "nav Room Edits", href: "/room-edits", title: roomIndexTitle, statusOk: roomIndexTitle === "Room Edits" });

  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  await page.click('.nav-links a[href="/gifting"]');
  await page.waitForFunction(() => location.pathname === "/gifting");
  const giftTitle = await page.evaluate(() => document.querySelector("h1")?.textContent ?? "");
  clicks.push({ from: "nav Gifting", href: "/gifting", title: giftTitle, statusOk: giftTitle === "Gifting" });

  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`${BASE}/room-edits/cozy-corner`, { waitUntil: "networkidle0" });
  const desktopTitle = await page.evaluate(() => document.querySelector("h1")?.textContent ?? "");

  await browser.close();

  const report = { htmlChecks, homeHrefs, clicks, desktopTitle };
  console.log(JSON.stringify(report, null, 2));

  const htmlFailed = Object.values(htmlChecks).some(
    (row) => row.status !== 200 || row.missing.length,
  );
  const clickFailed = clicks.some((row) => !row.statusOk);
  const moodHrefsOk = homeHrefs.moods.every((mood) =>
    mood.href.startsWith("/room-edits/"),
  );
  if (htmlFailed || clickFailed || !moodHrefsOk || desktopTitle !== "Cozy Corner") {
    throw new Error("Room edits / gifting e2e failed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
