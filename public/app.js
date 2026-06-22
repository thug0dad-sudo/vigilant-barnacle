const canvas = document.getElementById("rain");
const ctx = canvas.getContext("2d");

const VERSION = "1.5";
let oled = false;
let speedMultiplier = 1.0;
let quoteStatus = "local fallback";
let lastQuoteUpdate = null;

const QUOTE_RETRY_LIMIT = 3;
const QUOTE_RETRY_BASE_MS = 1200;
const QUOTE_FETCH_TIMEOUT_MS = 4500;

const fontSize = 18;
const rowHeight = 22;
const columnWidth = 92;
const trailLength = 22;

let quotes = [
  { symbol: "NVDA", price: 145.23, changePercent: 2.14 },
  { symbol: "BTC", price: 104250, changePercent: 1.32 },
  { symbol: "ETH", price: 3520, changePercent: -0.42 },
  { symbol: "RKLB", price: 22.18, changePercent: 3.01 },
  { symbol: "LUNR", price: 9.72, changePercent: -1.22 },
  { symbol: "ASTS", price: 31.64, changePercent: 4.88 },
  { symbol: "PLTR", price: 142.05, changePercent: 0.74 },
  { symbol: "SPY", price: 548.66, changePercent: 0.21 },
  { symbol: "QQQ", price: 481.91, changePercent: 0.35 }
];

let streams = [];

function formatPrice(n) {
  if (n >= 1000) return Math.round(n).toLocaleString();
  return Number(n).toFixed(2);
}

function randomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function makeToken(q) {
  const arrow = q.changePercent >= 0 ? "▲" : "▼";
  const r = Math.random();

  if (r < 0.48) return q.symbol;
  if (r < 0.68) return `${q.symbol}${arrow}`;
  if (r < 0.86) return `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%`;
  return `$${formatPrice(q.price)}`;
}

function makeStream(x) {
  const quote = randomQuote();

  return {
    x,
    y: -Math.random() * canvas.height,
    speed: 0.7 + Math.random() * 1.4,
    quote,
    tokens: Array.from({ length: trailLength }, () => makeToken(quote)),
    tick: 0,
    tickEvery: 8 + Math.floor(Math.random() * 14)
  };
}

function resetStreams() {
  const count = Math.max(8, Math.floor(window.innerWidth / columnWidth));
  streams = Array.from({ length: count }, (_, i) => makeStream(i * columnWidth + 8));
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  resetStreams();
}

function drawStream(stream) {
  stream.y += stream.speed * speedMultiplier;

  if (stream.y > canvas.height + trailLength * rowHeight) {
    Object.assign(stream, makeStream(stream.x));
    stream.y = -Math.random() * 300;
  }

  stream.tick++;
  if (stream.tick >= stream.tickEvery) {
    stream.tick = 0;
    stream.quote = randomQuote();
    stream.tokens.pop();
    stream.tokens.unshift(makeToken(stream.quote));
  }

  for (let i = 0; i < stream.tokens.length; i++) {
    const y = stream.y + i * rowHeight;
    if (y < -40 || y > canvas.height + 40) continue;

    const alpha = 1 - i / trailLength;
    const positive = stream.quote.changePercent >= 0;

    if (i === 0) {
      ctx.fillStyle = oled ? "rgba(255,255,255,0.95)" : "rgba(210,255,210,0.95)";
      ctx.shadowColor = positive ? "#00ff66" : "#ff3355";
      ctx.shadowBlur = 14;
    } else {
      ctx.fillStyle = positive
        ? `rgba(0,255,90,${alpha * 0.78})`
        : `rgba(255,50,90,${alpha * 0.68})`;
      ctx.shadowBlur = 0;
    }

    ctx.fillText(stream.tokens[i], stream.x, y);
  }

  ctx.shadowBlur = 0;
}

function quoteHudText() {
  if (!lastQuoteUpdate) return `Quotes ${quoteStatus}`;

  const updated = new Date(lastQuoteUpdate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  return `Quotes ${quoteStatus} ${updated}`;
}

function drawHud() {
  ctx.font = "14px monospace";
  ctx.fillStyle = "rgba(0,255,90,0.9)";
  ctx.fillText(
    `OpenClaw Market Rain · F Fullscreen · O OLED · + Faster · - Slower · 0 Reset · Speed ${speedMultiplier.toFixed(1)}x · ${quoteHudText()} · Version ${VERSION}`,
    14,
    canvas.height - 18
  );
}

function draw() {
  ctx.fillStyle = oled ? "rgba(0,0,0,0.34)" : "rgba(0,0,0,0.22)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = "top";

  for (const stream of streams) {
    drawStream(stream);
  }

  drawHud();
  requestAnimationFrame(draw);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchQuotesWithTimeout() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QUOTE_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch("/api/quotes", {
      cache: "no-store",
      signal: controller.signal
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function applyQuotePayload(data) {
  if (!data || !Array.isArray(data.quotes) || !data.quotes.length) {
    throw new Error("Invalid quote payload");
  }

  quotes = data.quotes;
  lastQuoteUpdate = data.updatedAt || new Date().toISOString();
  quoteStatus = data.source === "fallback-static" ? "static API" : "API ready";
}

async function loadQuotes(attempt = 1) {
  try {
    const data = await fetchQuotesWithTimeout();
    applyQuotePayload(data);
  } catch (err) {
    quoteStatus = attempt < QUOTE_RETRY_LIMIT
      ? `retrying ${attempt}/${QUOTE_RETRY_LIMIT}`
      : "local fallback";

    console.warn(`Quote load failed on attempt ${attempt}:`, err);

    if (attempt < QUOTE_RETRY_LIMIT) {
      const delay = QUOTE_RETRY_BASE_MS * 2 ** (attempt - 1);
      await sleep(delay);
      return loadQuotes(attempt + 1);
    }
  }
}

window.addEventListener("resize", resize);

window.addEventListener("keydown", (e) => {
  if (e.key === "f" || e.key === "F") {
    document.documentElement.requestFullscreen?.();
  }

  if (e.key === "o" || e.key === "O") {
    oled = !oled;
  }

  if (e.key === "+" || e.key === "=") {
    speedMultiplier = Math.min(5, speedMultiplier + 0.2);
  }

  if (e.key === "-" || e.key === "_") {
    speedMultiplier = Math.max(0.2, speedMultiplier - 0.2);
  }

  if (e.key === "0") {
    speedMultiplier = 1.0;
  }
});

resize();
loadQuotes();
setInterval(loadQuotes, 30000);
draw();
