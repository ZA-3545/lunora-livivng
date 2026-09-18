import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = "http://localhost:3000";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function loadEnv() {
  const text = readFileSync(resolve(".env.local"), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const mobile = {};
  for (const path of ["/", "/shop", "/product/warm-glow-fairy-lights", "/checkout"]) {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 40000 });
    await new Promise((r) => setTimeout(r, 500));
    mobile[path] = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth > window.innerWidth + 2;
      const shop = [...document.querySelectorAll(".nav-links a")].find((a) => a.textContent.trim() === "Shop");
      const r = shop?.getBoundingClientRect();
      const box = document.querySelector(".shop-toggle input")?.getBoundingClientRect();
      return {
        overflow,
        shopTap: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : null,
        bundlesBox: box ? `${Math.round(box.width)}x${Math.round(box.height)}` : null,
      };
    });
  }

  await page.goto(`${BASE}/product/warm-glow-fairy-lights`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 800));
  await page.click(".pdp-cart .btn");
  await page.waitForFunction(() => document.body.innerText.includes("Added to cart"));
  await page.goto(`${BASE}/checkout`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 800));
  const checkout = await page.evaluate(() => {
    const name = document.querySelector('input[name="name"]');
    name?.focus();
    return {
      guest: document.body.innerText.includes("Guest checkout"),
      nameLabeled: Boolean(document.querySelector('label input[name="name"]')),
      phoneLabeled: Boolean(document.querySelector('label input[name="phone"]')),
      nameFocused: document.activeElement?.getAttribute("name") === "name",
      focusOutline: name ? getComputedStyle(name).outline : null,
      noAccountField: !document.querySelector('input[name="password"], input[name="email"]'),
      codDefault: document.querySelector('input[value="cod"]')?.checked === true,
    };
  });

  await browser.close();

  const { Client } = await import("pg");
  loadEnv();
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const before = await client.query("SELECT stock_qty FROM products WHERE id = 'p19'");
  await client.query("UPDATE products SET stock_qty = 0 WHERE id = 'p19'");
  const emptyPage = await fetch(`${BASE}/room-edits/minimal-bedroom`);
  const emptyHtml = await emptyPage.text();
  await client.query("UPDATE products SET stock_qty = $1 WHERE id = 'p19'", [
    before.rows[0].stock_qty,
  ]);
  await client.end();

  const report = {
    mobile,
    checkout,
    restockMessage: emptyHtml.includes("waiting on a restock"),
    stillShowsBundle: emptyHtml.includes("Minimal Room Bundle"),
  };
  console.log(JSON.stringify(report, null, 2));
  if (
    Object.values(mobile).some((row) => row.overflow) ||
    !checkout.guest ||
    !checkout.nameLabeled ||
    !checkout.codDefault ||
    !checkout.noAccountField ||
    !report.restockMessage
  ) {
    throw new Error("Recheck failed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
