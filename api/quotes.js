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

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    status: "ok",
    source: "fallback-static",
    updatedAt: new Date().toISOString(),
    quoteCount: FALLBACK_QUOTES.length,
    quotes: FALLBACK_QUOTES
  });
}
