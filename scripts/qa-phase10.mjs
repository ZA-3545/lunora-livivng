import puppeteer from "puppeteer-core";
import { createHmac } from "node:crypto";

const BASE = "http://localhost:3000";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ADMIN_PASSWORD = "lunora-admin-dev";
const MOBILE = { width: 390, height: 844, isMobile: true, hasTouch: true };

async function json(path, init = {}) {
  const response = await fetch(`${BASE}${path}`, init);
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body, headers: response.headers };
}

async function html(path) {
  const response = await fetch(`${BASE}${path}`);
  return { status: response.status, text: await response.text() };
}

function cookieFrom(headers) {
  const raw = headers.get("set-cookie") ?? "";
  return raw.match(/lunora_admin=([^;]+)/)?.[1];
}

async function adminCookie() {
  const login = await json("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  const token = cookieFrom(login.headers);
  if (!token) throw new Error("Admin login failed.");
  return decodeURIComponent(token);
}

async function launch(viewport = MOBILE) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport(viewport);
  page.setDefaultTimeout(25000);
  return { browser, page };
}

async function waitReady(page) {
  await page.waitForFunction(() => document.readyState === "complete");
  await new Promise((r) => setTimeout(r, 400));
}

function auditLayout() {
  const issues = [];
  const vw = window.innerWidth;
  if (document.documentElement.scrollWidth > vw + 2) {
    issues.push(`horizontal overflow ${document.documentElement.scrollWidth} > ${vw}`);
  }
  const interactive = [
    ...document.querySelectorAll("a, button, input, select, textarea"),
  ];
  for (const el of interactive) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") continue;
    const tooSmall = r.height < 32 && r.width < 32;
    const text = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("name") || "").trim();
    if (tooSmall && !["Increase quantity", "Decrease quantity"].includes(el.getAttribute("aria-label") ?? "")) {
      issues.push(`tiny tap ${Math.round(r.width)}x${Math.round(r.height)} ${el.tagName} ${text.slice(0, 40)}`);
    }
  }
  const unlabeled = [...document.querySelectorAll("input, select, textarea")].filter((el) => {
    if (el.type === "hidden") return false;
    if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return false;
    const id = el.id;
    if (id && document.querySelector(`label[for="${id}"]`)) return false;
    return !el.closest("label");
  });
  for (const el of unlabeled) {
    issues.push(`unlabeled ${el.tagName} name=${el.name || el.id || "?"}`);
  }
  return issues.slice(0, 12);
}

async function addProductAndCheckout(page, { payment, name, phone }) {
  await page.goto(`${BASE}/cart`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.removeItem("lunora.cart");
    localStorage.removeItem("lunora.coupon");
  });
  await page.goto(`${BASE}/product/warm-glow-fairy-lights`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await page.waitForSelector(".pdp-cart .btn");
  await new Promise((r) => setTimeout(r, 800));
  await page.click(".pdp-cart .btn");
  await page.waitForFunction(() => document.body.innerText.includes("Added to cart"));
  await page.goto(`${BASE}/checkout`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await page.waitForSelector('input[name="name"]');
  await new Promise((r) => setTimeout(r, 800));
  const guest = await page.evaluate(() => document.body.innerText.includes("Guest checkout"));
  const codFirst = await page.evaluate(() => {
    const radios = [...document.querySelectorAll('input[type="radio"][name="payment"]')];
    return radios[0]?.value === "cod" && radios[0]?.checked;
  });
  await page.type('input[name="name"]', name);
  await page.type('input[name="phone"]', phone);
  await page.type('input[name="address"]', "12 QA Street");
  await page.type('input[name="city"]', "Lahore");
  if (payment === "online") {
    await page.click('input[value="online"]');
  }
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await waitReady(page);
  await page.waitForFunction(
    () =>
      document.body.innerText.includes("LL-") ||
      document.body.innerText.toLowerCase().includes("safepay") ||
      document.body.innerText.toLowerCase().includes("waiting for payment"),
    { timeout: 20000 },
  );
  return { guest, codFirst, url: page.url(), text: await page.evaluate(() => document.body.innerText) };
}

async function runFlows() {
  const findings = [];
  const { browser, page } = await launch();
  try {
    const cod = await addProductAndCheckout(page, {
      payment: "cod",
      name: "QA Cod Buyer",
      phone: "03020001111",
    });
    if (!cod.guest) findings.push("COD checkout missing guest copy");
    if (!cod.codFirst) findings.push("COD was not the default-first payment option");
    const orderMatch = cod.text.match(/LL-[A-Z0-9]+/);
    if (!orderMatch || !cod.text.toLowerCase().includes("thank")) {
      findings.push(`COD confirmation failed at ${cod.url}`);
    }
    const orderNumber = orderMatch?.[0] ?? "";
    if (!orderNumber) {
      findings.push(`COD confirmation text: ${cod.text.slice(0, 400)}`);
      return { findings, guestCheckout: Boolean(cod.guest), codDefault: Boolean(cod.codFirst) };
    }
    await page.goto(`${BASE}/track-order`, { waitUntil: "domcontentloaded" });
    await waitReady(page);
    await page.waitForSelector('input[name="orderNumber"]');
    await new Promise((r) => setTimeout(r, 800));
    await page.type('input[name="orderNumber"]', orderNumber);
    await page.type('input[name="phone"]', "03020001111");
    await page.click("button[type=submit]");
    await page.waitForFunction(
      (n) => document.body.innerText.includes(n),
      { timeout: 15000 },
      orderNumber,
    );

    const token = await adminCookie();
    await page.setCookie({
      name: "lunora_admin",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
    });
    const lookup = await json(
      `/api/orders/lookup?orderNumber=${orderNumber}&phone=03020001111`,
    );
    const orderId = lookup.body.order?.id;
    const packed = await json(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `lunora_admin=${token}` },
      body: JSON.stringify({ status: "packed" }),
    });
    const delivered = await json(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `lunora_admin=${token}` },
      body: JSON.stringify({ status: "delivered" }),
    });
    const after = await json(
      `/api/orders/lookup?orderNumber=${orderNumber}&phone=03020001111`,
    );
    if (packed.body.status !== "shipped" || !packed.body.trackingNumber) {
      findings.push(`COD pack/book failed ${JSON.stringify(packed.body)}`);
    }
    if (after.body.order?.status !== "delivered") {
      findings.push(`COD deliver failed ${JSON.stringify(delivered.body)} status=${after.body.order?.status}`);
    }

    const online = await addProductAndCheckout(page, {
      payment: "online",
      name: "QA Online Buyer",
      phone: "03020002222",
    });
    if (!online.url.includes("/pay/")) {
      findings.push(`Online checkout did not reach Safepay sandbox: ${online.url}`);
    } else {
      await page.waitForSelector(".pay-actions .btn");
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null),
        page.click(".pay-actions .btn"),
      ]);
      await waitReady(page);
      const paidText = await page.evaluate(() => document.body.innerText);
      if (!paidText.toLowerCase().includes("paid") && !paidText.includes("Thank")) {
        findings.push(`Online payment confirmation weak: ${page.url()}`);
      }
      const onlineOrder = paidText.match(/LL-[A-Z0-9]+/)?.[0];
      if (onlineOrder) {
        const looked = await json(
          `/api/orders/lookup?orderNumber=${onlineOrder}&phone=03020002222`,
        );
        const id = looked.body.order?.id;
        const ship = await json(`/api/admin/orders/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `lunora_admin=${token}`,
          },
          body: JSON.stringify({ status: "packed" }),
        });
        await json(`/api/admin/orders/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `lunora_admin=${token}`,
          },
          body: JSON.stringify({ status: "delivered" }),
        });
        const shipped = await json(
          `/api/orders/lookup?orderNumber=${onlineOrder}&phone=03020002222`,
        );
        if (ship.body.status !== "shipped") {
          findings.push(`Online pack/book failed ${JSON.stringify(ship.body)}`);
        }
        if (shipped.body.order?.status !== "delivered") {
          findings.push(`Online deliver ended ${shipped.body.order?.status}`);
        }
      }
    }

    return {
      findings,
      codOrder: orderNumber,
      onlineUrl: online.url,
      guestCheckout: cod.guest && online.guest,
      codDefault: cod.codFirst,
    };
  } finally {
    await browser.close();
  }
}

async function runMobileAndA11y() {
  const paths = [
    "/",
    "/shop",
    "/shop/lighting",
    "/product/warm-glow-fairy-lights",
    "/bundle/cozy-room-bundle",
    "/room-edits",
    "/room-edits/cozy-corner",
    "/gifting",
    "/cart",
    "/checkout",
    "/order-confirmation",
    "/track-order",
    "/search",
    "/search?q=zzzz-no-such-item",
    "/wishlist",
    "/admin/login",
  ];
  const { browser, page } = await launch();
  const report = [];
  try {
    for (const path of paths) {
      try {
        await page.goto(`${BASE}${path}`, {
          waitUntil: "domcontentloaded",
          timeout: 40000,
        });
        await waitReady(page);
        const issues = await page.evaluate(auditLayout);
        const title = await page.evaluate(
          () => document.querySelector("h1")?.textContent ?? "",
        );
        report.push({ path, title, issues });
      } catch (error) {
        report.push({
          path,
          title: "",
          issues: [`navigation failed: ${error.message}`],
        });
      }
    }

    const token = await adminCookie();
    await page.setCookie({
      name: "lunora_admin",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
    });
    for (const path of ["/admin", "/admin/orders"]) {
      await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
      await waitReady(page);
      const issues = await page.evaluate(auditLayout);
      const title = await page.evaluate(() => document.querySelector("h1")?.textContent ?? "");
      report.push({ path, title, issues });
    }

    await page.goto(`${BASE}/checkout`, { waitUntil: "domcontentloaded" });
    await waitReady(page);
    const focus = await page.evaluate(async () => {
      const reached = [];
      for (let i = 0; i < 20; i += 1) {
        const active = document.activeElement;
        const label =
          active?.getAttribute("name") ||
          active?.getAttribute("href") ||
          active?.textContent?.trim()?.slice(0, 24) ||
          active?.tagName;
        reached.push(label);
        document.activeElement?.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
        );
        const next =
          document.querySelectorAll("a, button, input, select, textarea");
        // tab via focus() on sequential tabbables
      }
      const tabbables = [
        ...document.querySelectorAll("a, button, input, select, textarea"),
      ].filter((el) => el.offsetParent !== null);
      return {
        tabbableCount: tabbables.length,
        first: tabbables[0]?.textContent?.trim()?.slice(0, 30) ?? tabbables[0]?.getAttribute("href"),
        hasCheckoutName: Boolean(document.querySelector('input[name="name"]')),
        nameInsideLabel: Boolean(document.querySelector('label input[name="name"]')),
        focusOutline: getComputedStyle(document.documentElement).getPropertyValue("outline") || "see :focus-visible",
      };
    });

    await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
    await waitReady(page);
    const adminFocus = await page.evaluate(() => {
      const input = document.querySelector('input[name="password"]');
      input?.focus();
      const style = input ? getComputedStyle(input) : null;
      return {
        labeled: Boolean(document.querySelector('label input[name="password"]')),
        canFocus: document.activeElement?.getAttribute("name") === "password",
        outline: style?.outline,
      };
    });

    return { pages: report, focus, adminFocus };
  } finally {
    await browser.close();
  }
}

async function runEdges() {
  const cart = await html("/cart");
  const wishlist = await html("/wishlist");
  const search = await html("/search?q=zzzz-no-such-item");
  const badLookup = await json(
    "/api/orders/lookup?orderNumber=LL-NOPE&phone=03000000000",
  );
  const { browser, page } = await launch();
  try {
    await page.goto(`${BASE}/track-order`, { waitUntil: "domcontentloaded" });
    await waitReady(page);
    await page.type('input[name="orderNumber"]', "LL-NOPE");
    await page.type('input[name="phone"]', "03000000000");
    await page.click("button[type=submit]");
    await page.waitForFunction(
      () => document.body.innerText.toLowerCase().includes("no order"),
      { timeout: 10000 },
    );
    const trackError = await page.evaluate(() => document.body.innerText);
    return {
      cartEmpty: cart.text.includes("Your cart is empty"),
      wishlistEmpty: wishlist.text.includes("Nothing saved yet") || wishlist.text.includes("Looking up"),
      searchEmpty: search.text.includes("Nothing matched"),
      lookupApi: badLookup.status === 404,
      trackUi: trackError.toLowerCase().includes("no order"),
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  const started = await fetch(BASE).catch(() => null);
  if (!started) throw new Error("Dev server is not running on :3000");

  let flows;
  try {
    flows = await runFlows();
  } catch (error) {
    flows = { findings: [`flow crashed: ${error.message}`], guestCheckout: false, codDefault: false };
  }
  const edges = await runEdges();
  const mobile = await runMobileAndA11y();

  console.log(
    JSON.stringify(
      {
        flows,
        edges,
        focus: mobile.focus,
        adminFocus: mobile.adminFocus,
        mobile: mobile.pages.map((row) => ({
          path: row.path,
          title: row.title,
          issues: row.issues,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
