const canvas = document.getElementById("rain");
const ctx = canvas.getContext("2d");

let oled = false;
let quotes = [];
let mode = "all";
let speedMultiplier = 1.0;

const fontSize = 18;
const rowHeight = 22;
const columnWidth = 92;
const trailLength = 18;

let config = {};

let streams = [];

function fallbackQuotes() {
  return [
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
}

function quoteMap() {
  const list = quotes.length ? quotes : fallbackQuotes();
  return Object.fromEntries(list.map(q => [q.symbol, q]));
}

function activeQuotes() {
  const map = quoteMap();
  const modeKey = mode === "all" ? "4" : (mode === "space" ? "1" : (mode === "crypto" ? "2" : "3"));
  const tickers = config.modes[modeKey] || [];
  return tickers.map(s => map[s]).filter(Boolean);
}

function formatPrice(n) {
  if (n >= 1000) return Math.round(n).toLocaleString();
  return Number(n).toFixed(2);
}

function makeToken(q) {
  const arrow = q.changePercent >= 0 ? "▲" : "▼";
  const r = Math.random();

  if (r < 0.50) return q.symbol;
  if (r < 0.70) return `${q.symbol}${arrow}`;
  if (r < 0.86) return `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%`;
  return `$${formatPrice(q.price)}`;
}

function makeStream(x) {
  const list = activeQuotes();
  const q = list[Math.floor(Math.random() * list.length)] || fallbackQuotes()[0];

  return {
    x,
    y: -Math.random() * canvas.height,
    speed: 0.28 + Math.random() * 0.38,
    quote: q,
    tokens: Array.from({ length: trailLength }, () => makeToken(q)),
    tick: 0,
    tickEvery: 18 + Math.floor(Math.random() * 20)
  };
}

function resetStreams() {
  const count = Math.floor(canvas.width / columnWidth);
  streams = Array.from({ length: count }, (_, i) => makeStream(i * columnWidth + 8));
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  resetStreams();
}

window.addEventListener("resize", resize);
resize();

async function loadConfig() {
  try {
    const res = await fetch("/api/config");
    config = await res.json();
    console.log("Configuration loaded:", config);
  } catch (e) {
    console.error("Failed to load configuration, falling back to defaults.", e);
    // Fallback if config fails: mapping 1-4 to the local ones
    config = {
      modes: {
        "1": { name: "Space", tickers: ["RKLB", "LUNR", "ASTS", "PLTR"] },
        "2": { name: "Crypto", tickers: ["BTC", "ETH"] },
        "3": { name: "Index", tickers: ["SPY", "QQQ"] },
        "4": { name: "All", tickers: ["RKLB", "LUNR", "ASTS", "PLTR", "BTC", "ETH", "SPY", "QQQ"] }
      }
    };
  }
}

async function loadQuotes() {
  try {
    const res = await fetch("/api/quotes");
    const data = await res.json();
    quotes = data.quotes || [];
  } catch {
    quotes = fallbackQuotes();
  }
}

await loadConfig();
loadQuotes();
setInterval(loadQuotes, 60000);

function colorFor(change, alpha, head = false) {
  if (head) {
    if (change < 0) return `rgba(255,185,190,${alpha})`;
    return `rgba(210,255,225,${alpha})`;
  }

  if (change < 0) return `rgba(255,55,70,${alpha})`;
  return `rgba(0,220,90,${alpha})`;
}

function drawStream(s) {
  s.y += s.speed * speedMultiplier;
  s.tick++;

  if (s.tick >= s.tickEvery) {
    s.tick = 0;
    const list = activeQuotes();
    s.quote = list[Math.floor(Math.random() * list.length)] || s.quote;
    s.tokens.unshift(makeToken(s.quote));
    s.tokens.pop();
  }

  for (let i = 0; i < s.tokens.length; i++) {
    const y = s.y - i * rowHeight;
    if (y < -rowHeight || y > canvas.height + rowHeight) continue;

    const isHead = i === 0;
    const fade = 1 - i / s.tokens.length;
    const alpha = oled
      ? Math.max(0.04, fade * 0.45)
      : Math.max(0.06, fade * 0.78);

    ctx.fillStyle = colorFor(s.quote.changePercent, alpha, isHead);
    ctx.shadowBlur = isHead && !oled ? 8 : 0;
    ctx.shadowColor = colorFor(s.quote.changePercent, 0.9, isHead);
    ctx.fillText(s.tokens[i], s.x, y);
  }

  if (s.y - trailLength * rowHeight > canvas.height) {
    const replacement = makeStream(s.x);
    s.y = -Math.random() * canvas.height * 0.7;
    s.speed = replacement.speed;
    s.quote = replacement.quote;
    s.tokens = replacement.tokens;
    s.tickEvery = replacement.tickEvery;
  }
}

function drawHud() {
  const label = `OpenClaw Market Rain · ${mode.toUpperCase()} · Speed ${speedMultiplier.toFixed(1)}x · +/- Speed · 0 Reset · 1 Space · 2 Crypto · 3 Index · 4 All · F Fullscreen · O OLED`;
  const hud = document.getElementById("hud");
  if (hud) hud.textContent = label;
}

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = "top";

  for (const stream of streams) drawStream(stream);
  drawHud();

  requestAnimationFrame(draw);
}

draw();

document.addEventListener("keydown", async (e) => {
  const key = e.key.toLowerCase();

  if (key === "1") { mode = "space"; resetStreams(); }
  if (key === "2") { mode = "crypto"; resetStreams(); }
  if (key === "3") { mode = "index"; resetStreams(); }
  if (key === "4") { mode = "all"; resetStreams(); }

  if (key === "+" || key === "=") speedMultiplier = Math.min(4, speedMultiplier + 0.2);
  if (key === "-") speedMultiplier = Math.max(0.2, speedMultiplier - 0.2);
  if (key === "0") speedMultiplier = 1.0;

  if (key === "f") {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  }

  if (key === "o") {
    oled = !oled;
    document.body.classList.toggle("oled", oled);
  }
});
