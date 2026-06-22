const DEFAULT_SYMBOLS = ["NVDA", "BTC", "ETH", "RKLB", "LUNR", "ASTS", "PLTR", "SPY", "QQQ"];
const CACHE_TTL_MS = 30000;

const FALLBACK_QUOTES = [
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

const cache = new Map();

function normalizeSymbol(symbol) {
  return String(symbol || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.^-]/g, "")
    .slice(0, 16);
}

export function parseSymbols(input) {
  const raw = Array.isArray(input) ? input.join(",") : String(input || "");
  const symbols = raw
    .split(/[,\s]+/)
    .map(normalizeSymbol)
    .filter(Boolean);

  const unique = [...new Set(symbols)];
  return unique.length ? unique.slice(0, 20) : DEFAULT_SYMBOLS;
}

function fallbackQuoteFor(symbol) {
  return FALLBACK_QUOTES.find((q) => q.symbol === symbol);
}

function fallbackQuotesFor(symbols) {
  const found = symbols.map(fallbackQuoteFor).filter(Boolean);
  return found.length ? found : FALLBACK_QUOTES;
}

function stooqSymbol(symbol) {
  const s = normalizeSymbol(symbol);
  const cryptoMap = {
    BTC: "btcusd",
    ETH: "ethusd"
  };

  if (cryptoMap[s]) return cryptoMap[s];
  if (s.startsWith("^")) return s.toLowerCase();
  return `${s.toLowerCase()}.us`;
}

async function fetchFinnhubQuote(symbol, apiKey) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) throw new Error(`Finnhub ${symbol} HTTP ${res.status}`);

  const data = await res.json();
  const price = Number(data.c);
  const changePercent = Number(data.dp);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Finnhub ${symbol} missing price`);
  }

  return {
    symbol,
    price,
    changePercent: Number.isFinite(changePercent) ? changePercent : 0,
    source: "finnhub-live"
  };
}

async function fetchStooqQuote(symbol) {
  const stooq = stooqSymbol(symbol);
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooq)}&f=sd2t2ohlcv&h&e=json`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) throw new Error(`Stooq ${symbol} HTTP ${res.status}`);

  const data = await res.json();
  const row = Array.isArray(data)
    ? data[0]
    : Array.isArray(data?.symbols)
      ? data.symbols[0]
      : data;

  const close = Number(row?.close);
  const open = Number(row?.open);

  if (!Number.isFinite(close) || close <= 0) {
    throw new Error(`Stooq ${symbol} missing close`);
  }

  const changePercent = Number.isFinite(open) && open > 0
    ? ((close - open) / open) * 100
    : 0;

  return {
    symbol,
    price: close,
    changePercent,
    source: "stooq-delayed"
  };
}

async function quoteForSymbol(symbol, apiKey) {
  if (apiKey) {
    try {
      return await fetchFinnhubQuote(symbol, apiKey);
    } catch (err) {
      console.warn(`Finnhub failed for ${symbol}:`, err.message);
    }
  }

  try {
    return await fetchStooqQuote(symbol);
  } catch (err) {
    console.warn(`Stooq failed for ${symbol}:`, err.message);
  }

  const fallback = fallbackQuoteFor(symbol);
  if (fallback) return { ...fallback, source: "fallback-static" };

  return null;
}

function combinedSource(quotes) {
  const sources = [...new Set(quotes.map((q) => q.source || "fallback-static"))];
  return sources.length === 1 ? sources[0] : "mixed";
}

export async function getQuotes(symbolInput, env = process.env) {
  const symbols = parseSymbols(symbolInput);
  const apiKey = env.FINNHUB_API_KEY || "";
  const cacheKey = `${apiKey ? "finnhub" : "public"}:${symbols.join(",")}`;
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (cached && now - cached.time < CACHE_TTL_MS) {
    return {
      ...cached.payload,
      cached: true
    };
  }

  const quotes = [];

  for (const symbol of symbols) {
    const quote = await quoteForSymbol(symbol, apiKey);
    if (quote) quotes.push(quote);
  }

  const finalQuotes = quotes.length
    ? quotes
    : fallbackQuotesFor(symbols).map((q) => ({ ...q, source: "fallback-static" }));

  const payload = {
    status: "ok",
    source: combinedSource(finalQuotes),
    updatedAt: new Date().toISOString(),
    quoteCount: finalQuotes.length,
    symbols,
    cached: false,
    cacheTtlMs: CACHE_TTL_MS,
    quotes: finalQuotes.map(({ symbol, price, changePercent, source }) => ({
      symbol,
      price,
      changePercent,
      source
    }))
  };

  cache.set(cacheKey, { time: now, payload });
  return payload;
}
