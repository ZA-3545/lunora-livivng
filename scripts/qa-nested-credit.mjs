import puppeteer from "puppeteer-core";

const BASE = "http://localhost:3000";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function listen(page) {
  const messages = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      messages.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    messages.push(`pageerror: ${error.message}`);
  });
  return messages;
}

async function inspect(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector(".lifestyle-linked", { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 400));
  return page.evaluate(() => {
    const nested = [...document.querySelectorAll("a a")].map((node) =>
      node.outerHTML.slice(0, 120),
    );
    const cards = [...document.querySelectorAll(".lifestyle-linked")].map((shell) => {
      const card = shell.querySelector(":scope > a.mood-card");
      const credit = shell.querySelector(":scope > a.photo-credit");
      return {
        cardHref: card?.getAttribute("href") ?? null,
        creditHref: credit?.getAttribute("href") ?? null,
        creditInsideCard: Boolean(
          card?.querySelector(".photo-credit, a[href*='pexels.com']"),
        ),
        creditIsSibling: Boolean(
          card && credit && card.parentElement === credit.parentElement,
        ),
        cardTabbable:
          card instanceof HTMLAnchorElement && card.tabIndex >= 0 && Boolean(card.href),
        creditTabbable:
          credit instanceof HTMLAnchorElement &&
          credit.tabIndex >= 0 &&
          Boolean(credit.href),
      };
    });
    return { nested, cards };
  });
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const consoleMessages = listen(page);

  const home = await inspect(page, "/");
  const rooms = await inspect(page, "/room-edits");

  const hit = await page.evaluate(() => {
    const credit = document.querySelector(".lifestyle-linked > a.photo-credit");
    const rect = credit?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : 0;
    const y = rect ? rect.top + rect.height / 2 : 0;
    const top = document.elementFromPoint(x, y);
    return {
      href: credit?.getAttribute("href") ?? null,
      w: rect?.width ?? 0,
      h: rect?.height ?? 0,
      topTag: top?.tagName ?? null,
      topClass: top?.className ?? null,
      topHref: top instanceof HTMLAnchorElement ? top.href : top?.closest("a")?.href ?? null,
    };
  });

  const label = await page.$(".lifestyle-linked .mood-label");
  const box = await label?.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }
  await page
    .waitForFunction(() => location.pathname.startsWith("/room-edits/"), {
      timeout: 10000,
    })
    .catch(() => null);
  const afterCard = page.url();

  await page.goto(`${BASE}/room-edits`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForSelector(".lifestyle-linked > a.photo-credit");
  const beforeCredit = page.url();
  const created = [];
  browser.on("targetcreated", (target) => {
    created.push(target.url());
  });
  await page.$eval(".lifestyle-linked > a.photo-credit", (el) => el.click());
  await new Promise((r) => setTimeout(r, 800));
  const afterCredit = page.url();
  await browser.close();
  console.log({ hit, beforeCredit, afterCredit, afterCard, created });

  const relevant = consoleMessages.filter((line) =>
    /cannot be a descendant|hydration|Hydration|nested/i.test(line),
  );

  const report = {
    homeCards: home.cards.length,
    roomCards: rooms.cards.length,
    nestedAnchors: [...home.nested, ...rooms.nested],
    homeCreditSibling: home.cards.every(
      (card) => card.creditIsSibling && !card.creditInsideCard,
    ),
    roomCreditSibling: rooms.cards.every(
      (card) => card.creditIsSibling && !card.creditInsideCard,
    ),
    keyboard: [...home.cards, ...rooms.cards].every(
      (card) => card.cardTabbable && card.creditTabbable,
    ),
    hit,
    creditKeptPage: afterCredit.split("?")[0] === beforeCredit.split("?")[0],
    creditOpenedPexels: created.some((url) => /pexels\.com/.test(url)),
    popupUrls: created,
    cardNavigated: /\/room-edits\//.test(afterCard),
    hydrationErrors: relevant,
  };
  console.log(JSON.stringify(report, null, 2));

  if (
    report.nestedAnchors.length ||
    !report.homeCreditSibling ||
    !report.roomCreditSibling ||
    !report.keyboard ||
    !report.creditKeptPage ||
    !report.creditOpenedPexels ||
    !report.cardNavigated ||
    report.hydrationErrors.length ||
    report.hit.topClass !== "photo-credit"
  ) {
    throw new Error("Nested photo-credit walkthrough failed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
