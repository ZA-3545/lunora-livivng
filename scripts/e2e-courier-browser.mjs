import puppeteer from "puppeteer-core";

const BASE = "http://localhost:3000";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function json(path, init = {}) {
  const response = await fetch(`${BASE}${path}`, init);
  return { status: response.status, body: await response.json(), headers: response.headers };
}

async function main() {
  const created = await json("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lines: [{ productId: "p1", quantity: 1 }],
      shipping: {
        name: "Phase 8 UI",
        phone: "03018889999",
        addressLine: "9 Browser Lane",
        city: "Lahore",
      },
      paymentMethod: "cod",
    }),
  });
  const order = created.body.order;

  const login = await json("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: "lunora-admin-dev" }),
  });
  const cookieHeader = login.headers.get("set-cookie") ?? "";
  const token = cookieHeader.match(/lunora_admin=([^;]+)/)?.[1];
  if (!token) throw new Error("Admin login did not set cookie.");

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

  await page.goto(`${BASE}/admin/orders/${order.id}`, { waitUntil: "networkidle0" });
  await page.waitForSelector('select[name="status"]');
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await page.select('select[name="status"]', "packed");
  await page.click("button[type=submit]");
  await page.waitForFunction(
    () => document.body.innerText.includes("LPDSIM_"),
    { timeout: 20000 },
  );
  const adminText = await page.evaluate(() => document.body.innerText);
  const tracking = adminText.match(/LPD[A-Z0-9_]+/)?.[0] ?? "";

  await page.goto(`${BASE}/admin/orders`, { waitUntil: "networkidle0" });
  const listText = await page.evaluate(() => document.body.innerText);

  await page.goto(`${BASE}/track-order`, { waitUntil: "networkidle0" });
  await page.type('input[name="orderNumber"]', order.orderNumber);
  await page.type('input[name="phone"]', "03018889999");
  await page.click("button[type=submit]");
  await page.waitForFunction(
    (number) => document.body.innerText.includes(number),
    { timeout: 15000 },
    tracking,
  );
  const trackText = await page.evaluate(() => document.body.innerText);

  await browser.close();

  const report = {
    orderNumber: order.orderNumber,
    tracking,
    adminShowsTracking: adminText.includes(tracking) && adminText.includes("Leopards"),
    adminListShowsTracking: listText.includes(tracking),
    trackShowsTracking: trackText.includes(tracking) && trackText.includes("Shipped"),
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.tracking || !report.adminShowsTracking || !report.trackShowsTracking) {
    throw new Error("Browser courier e2e failed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
