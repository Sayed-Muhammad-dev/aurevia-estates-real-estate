import { mkdir, writeFile, rm, readFile, readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import net from "node:net";
import crypto from "node:crypto";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "Portfolio-Screenshots");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9333;
const baseUrl = "http://127.0.0.1:3000";
const userDataDir = path.join(root, ".tmp-chrome-screenshots");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function httpJson(endpoint, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${endpoint}`, options);
  if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}`);
  return response.json();
}

async function connect(wsUrl) {
  const url = new URL(wsUrl);
  const socket = net.createConnection({ host: "127.0.0.1", port: Number(url.port) });
  const key = crypto.randomBytes(16).toString("base64");
  let id = 0;
  const pending = new Map();
  let buffer = Buffer.alloc(0);
  let handshaken = false;
  let handshakeResolve;
  let handshakeReject;

  const handleMessage = (payload) => {
    const message = JSON.parse(payload.toString("utf8"));
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
    }
  };

  const parseFrames = () => {
    while (buffer.length >= 2) {
      const second = buffer[1];
      let length = second & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (buffer.length < 4) return;
        length = buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (buffer.length < 10) return;
        length = Number(buffer.readBigUInt64BE(2));
        offset = 10;
      }
      const masked = (second & 0x80) !== 0;
      const maskOffset = masked ? 4 : 0;
      if (buffer.length < offset + maskOffset + length) return;
      let payload = buffer.subarray(offset + maskOffset, offset + maskOffset + length);
      if (masked) {
        const mask = buffer.subarray(offset, offset + 4);
        payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
      }
      buffer = buffer.subarray(offset + maskOffset + length);
      handleMessage(payload);
    }
  };

  socket.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    if (!handshaken) {
      const marker = buffer.indexOf("\r\n\r\n");
      if (marker === -1) return;
      const header = buffer.subarray(0, marker).toString("utf8");
      console.log(`debug handshake ${header.split("\r\n")[0]}`);
      buffer = buffer.subarray(marker + 4);
      if (!header.includes("101")) {
        handshakeReject?.(new Error(`WebSocket handshake failed: ${header}`));
        return;
      }
      handshaken = true;
      handshakeResolve?.();
    }
    parseFrames();
  });
  socket.on("error", (error) => {
    handshakeReject?.(error);
    for (const { reject } of pending.values()) reject(error);
    pending.clear();
  });
  socket.on("close", () => {
    const error = new Error("WebSocket socket closed");
    handshakeReject?.(error);
    for (const { reject } of pending.values()) reject(error);
    pending.clear();
  });

  await new Promise((resolve, reject) => {
    handshakeResolve = resolve;
    handshakeReject = reject;
    socket.write(
      [
        `GET ${url.pathname}${url.search} HTTP/1.1`,
        `Host: ${url.host}`,
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Key: ${key}`,
        "Sec-WebSocket-Version: 13",
        "Origin: http://127.0.0.1",
        "\r\n",
      ].join("\r\n"),
    );
  });

  const frame = (text) => {
    const payload = Buffer.from(text);
    const mask = crypto.randomBytes(4);
    let header;
    if (payload.length < 126) {
      header = Buffer.from([0x81, 0x80 | payload.length]);
    } else if (payload.length < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(payload.length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 0x80 | 127;
      header.writeBigUInt64BE(BigInt(payload.length), 2);
    }
    const masked = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
    return Buffer.concat([header, mask, masked]);
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const callId = ++id;
      pending.set(callId, { resolve, reject });
      socket.write(frame(JSON.stringify({ id: callId, method, params })));
    });

  return { close: () => socket.end(), send };
}

async function waitForPage(send) {
  await sleep(900);
  await send("Runtime.evaluate", {
    expression: `Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise((resolve) => {
        const done = () => resolve(true);
        if (document.readyState === "complete") done();
        else window.addEventListener("load", done, { once: true });
      }),
      new Promise((resolve) => {
        const started = Date.now();
        const tick = () => {
          const imgs = Array.from(document.images);
          const ready = imgs.every((img) => img.complete && img.naturalWidth > 0);
          if (ready || Date.now() - started > 4500) resolve(true);
          else setTimeout(tick, 150);
        };
        tick();
      })
    ])`,
    awaitPromise: true,
  });
  await sleep(500);
}

async function evaluate(send, expression) {
  return send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    userGesture: true,
  });
}

async function setViewport(send, viewport) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile ?? false,
  });
  await send("Emulation.setPageScaleFactor", { pageScaleFactor: 1 });
}

async function goto(send, url, viewport) {
  await setViewport(send, viewport);
  await send("Page.navigate", { url: `${baseUrl}${url}` });
  await waitForPage(send);
}

async function screenshot(send, name) {
  const result = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(path.join(outputDir, name), Buffer.from(result.data, "base64"));
}

async function capture(send, shot) {
  await goto(send, shot.url, shot.viewport);
  if (shot.prepare) {
    await evaluate(send, shot.prepare);
    await waitForPage(send);
  }
  await screenshot(send, shot.name);
}

async function pngSize(file) {
  const buffer = await readFile(path.join(outputDir, file));
  if (buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), bytes: buffer.length };
}

const desktop = { width: 1920, height: 1080 };
const laptop = { width: 1440, height: 900 };
const tablet = { width: 768, height: 1024, mobile: true };
const mobile = { width: 390, height: 844, mobile: true };

const shots = [
  { name: "01-home.png", url: "/", viewport: desktop },
  { name: "02-listings.png", url: "/listings", viewport: desktop },
  { name: "03-listings-filters-search.png", url: "/listings?query=Miami&mode=buy&location=Miami", viewport: desktop },
  { name: "04-property-detail.png", url: "/properties/serenity-cliffside-villa-malibu", viewport: desktop },
  { name: "05-agents.png", url: "/agents", viewport: desktop },
  { name: "06-agent-profile.png", url: "/agents/elena-marchetti", viewport: desktop },
  { name: "07-mortgage-calculator.png", url: "/mortgage", viewport: desktop },
  { name: "08-booking-calendar-form.png", url: "/booking?property=serenity-cliffside-villa-malibu", viewport: desktop },
  { name: "09-contact-form.png", url: "/contact?property=serenity-cliffside-villa-malibu", viewport: desktop },
  { name: "10-saved-properties.png", url: "/saved", viewport: desktop },
  { name: "11-search-page.png", url: "/search", viewport: desktop },
  { name: "12-login.png", url: "/login", viewport: desktop },
  { name: "13-register.png", url: "/register", viewport: desktop },
  { name: "14-mobile-dashboard.png", url: "/", viewport: mobile },
  { name: "15-tablet-dashboard.png", url: "/", viewport: tablet },
  {
    name: "16-navigation-open.png",
    url: "/",
    viewport: mobile,
    prepare: `document.querySelector('button[aria-label="Toggle menu"]')?.click(); true;`,
  },
  { name: "17-navigation-desktop.png", url: "/", viewport: desktop },
  {
    name: "18-modal.png",
    url: "/booking",
    viewport: desktop,
    prepare: `
      (async () => {
        const set = (selector, value) => {
          const el = document.querySelector(selector);
          if (!el) return;
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        set('input:not([type])', 'Sayed Muhammad');
        set('input[type="email"]', 'client@example.com');
        const inputs = Array.from(document.querySelectorAll('input:not([type]), input[type="email"], input[type="date"], input[type="time"]'));
        const phone = inputs.find((el) => !el.type || el.type === "text");
        if (phone) {
          phone.value = '+1 555 010 3344';
          phone.dispatchEvent(new Event("input", { bubbles: true }));
        }
        set('input[type="date"]', '2026-08-15');
        set('input[type="time"]', '14:30');
        document.querySelector('textarea')?.dispatchEvent(new Event("input", { bubbles: true }));
        document.querySelector('form button[type="submit"]')?.click();
        await new Promise((resolve) => setTimeout(resolve, 500));
        return true;
      })();
    `,
  },
  {
    name: "19-dropdown-menu.png",
    url: "/",
    viewport: mobile,
    prepare: `document.querySelector('button[aria-label="Toggle menu"]')?.click(); true;`,
  },
  { name: "20-responsive-laptop.png", url: "/", viewport: laptop },
  {
    name: "21-dark-mode-home.png",
    url: "/",
    viewport: desktop,
    prepare: `localStorage.setItem("aurevia-theme", "dark"); document.documentElement.classList.add("dark"); true;`,
  },
  {
    name: "22-light-mode-components.png",
    url: "/listings",
    viewport: desktop,
    prepare: `localStorage.setItem("aurevia-theme", "light"); document.documentElement.classList.remove("dark"); true;`,
  },
  {
    name: "23-property-gallery-modal.png",
    url: "/properties/serenity-cliffside-villa-malibu",
    viewport: desktop,
    prepare: `document.querySelector('button[aria-label^="Open image"], button[class*="group"]')?.click(); true;`,
  },
  { name: "24-responsive-tablet-listings.png", url: "/listings", viewport: tablet },
  { name: "25-responsive-mobile-listings.png", url: "/listings", viewport: mobile },
];

await rm(userDataDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "--disable-sync",
  "--disable-background-networking",
  "--remote-allow-origins=*",
  "--remote-debugging-address=127.0.0.1",
  "about:blank",
], { stdio: "ignore" });

try {
  for (let index = 0; index < 40; index += 1) {
    try {
      await httpJson("/json/version");
      break;
    } catch {
      await sleep(250);
    }
  }

  const target = await httpJson("/json/new?about:blank", { method: "PUT" });
  console.log(`debug target ${target.webSocketDebuggerUrl}`);
  const { close, send } = await connect(target.webSocketDebuggerUrl);
  await send("Page.enable");
  await send("Runtime.enable");

  for (const shot of shots) {
    await capture(send, shot);
    console.log(`captured ${shot.name}`);
  }

  close();

  const files = (await readdir(outputDir)).filter((file) => file.endsWith(".png")).sort();
  const report = [];
  for (const file of files) {
    const size = await pngSize(file);
    report.push({ file, ...size });
  }
  await writeFile(path.join(outputDir, "screenshot-report.json"), JSON.stringify(report, null, 2));
  console.table(report);
} finally {
  chrome.kill();
}
