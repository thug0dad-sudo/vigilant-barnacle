import { getQuotes } from "../lib/quoteService.js";

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    const url = new URL(req.url, "https://market-rain.vercel.app");
    const symbols = url.searchParams.get("symbols") || "";
    const payload = await getQuotes(symbols, process.env);
    res.status(200).json(payload);
  } catch (err) {
    console.error("Quote API failed:", err);
    res.status(500).json({
      status: "error",
      source: "error",
      updatedAt: new Date().toISOString(),
      quoteCount: 0,
      quotes: [],
      error: "quote_api_failed"
    });
  }
}
