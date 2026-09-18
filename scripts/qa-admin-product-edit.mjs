import puppeteer from "puppeteer-core";

const BASE = "http://localhost:3000";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PHOTO =
  "https://images.pexels.com/photos/1125135/pexels-photo-1125135.jpeg";

async function json(path, init = {}) {
  const response = await fetch(`${BASE}${path}`, init);
  return {
    status: response.status,
    body: await response.json().catch(() => ({})),
    headers: response.headers,
  };
}

async function main() {
  const login = await json("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "lunora-admin-dev" }),
  });
  const token = (login.headers.get("set-cookie") ?? "").match(
    /lunora_admin=([^;]+)/,
  )?.[1];
  if (!token) throw new Error("Admin login failed.");
  const cookie = `lunora_admin=${token}`;
  const original = await json("/api/products/warm-glow-fairy-lights");
  const product = original.body.product;
  if (!product?.id) throw new Error("Could not load Warm Glow Fairy Lights.");

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setCookie({
    name: "lunora_admin",
    value: decodeURIComponent(token),
    domain: "localhost",
    path: "/",
    httpOnly: true,
  });

  await page.goto(`${BASE}/admin/products`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".admin-filter input");
  await new Promise((r) => setTimeout(r, 400));
  await page.type(".admin-filter input", "fairy");
  const afterSearch = await page.evaluate(() =>
    [...document.querySelectorAll("tbody tr")].map((row) => row.innerText),
  );
  await page.click("a.admin-btn-ghost");
  await page.waitForSelector('textarea[name="images"]');
  const title = await page.evaluate(() => document.querySelector("h1")?.textContent);
  await page.click('textarea[name="images"]');
  await page.evaluate(() => {
    const box = document.querySelector('textarea[name="images"]');
    if (box) box.value = "";
  });
  await page.type('textarea[name="images"]', PHOTO);
  await page.click('button[type="submit"]');
  await page.waitForFunction(
    () => document.querySelector("h1")?.textContent === "Products",
    { timeout: 15000 },
  );

  const saved = await json("/api/products/warm-glow-fairy-lights");
  const shopHtml = await (await fetch(`${BASE}/shop`)).text();
  const pdpHtml = await (await fetch(`${BASE}/product/warm-glow-fairy-lights`)).text();

  await page.goto(`${BASE}/admin/bundles`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".admin-filter input");
  await page.type(".admin-filter input", "cozy");
  await new Promise((r) => setTimeout(r, 250));
  const bundleRows = await page.evaluate(() =>
    [...document.querySelectorAll("tbody tr")].map((row) => row.innerText),
  );
  const bundleHasEdit = await page.evaluate(() =>
    Boolean(document.querySelector("a.admin-btn-ghost")),
  );

  await browser.close();

  const shopCard = shopHtml.match(
    /<article class="p-card">[\s\S]*?Warm Glow Fairy Lights[\s\S]*?<\/article>/,
  )?.[0] ?? "";
  const pdpHero = pdpHtml.match(
    /<section class="pdp">[\s\S]*?Warm Glow Fairy Lights[\s\S]{0,400}/,
  )?.[0] ?? "";
  const report = {
    searchRows: afterSearch,
    editTitle: title,
    savedImages: saved.body.product?.images ?? [],
    shopCardHasPhoto: shopCard.includes(PHOTO) && shopCard.includes("<img"),
    shopCardUsesComingSoon: shopCard.includes("Photo coming soon"),
    pdpHasPhoto: pdpHtml.includes(PHOTO) && pdpHtml.includes("<img"),
    pdpHeroHasComingSoon: pdpHero.includes("Photo coming soon"),
    bundleSearchRows: bundleRows,
    bundleHasEdit,
  };
  console.log(JSON.stringify(report, null, 2));

  await fetch(`${BASE}/api/admin/products/${product.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      categoryId: product.categoryId,
      price: product.price,
      costPrice: product.costPrice,
      stockQty: product.stockQty,
      weight: product.weight,
      images: "",
      status: product.status,
    }),
  });

  if (
    !afterSearch.some((row) => row.includes("Warm Glow Fairy Lights")) ||
    afterSearch.length !== 1 ||
    title !== "Edit product" ||
    report.savedImages[0] !== PHOTO ||
    !report.shopCardHasPhoto ||
    !report.pdpHasPhoto ||
    report.shopCardUsesComingSoon ||
    report.pdpHeroHasComingSoon
  ) {
    throw new Error("Admin product edit walkthrough failed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
