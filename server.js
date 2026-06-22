import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getQuotes } from "./lib/quoteService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 18891;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/config", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({
    modes: {
      "1": ["RKLB", "LUNR", "ASTS"],
      "2": ["BTC", "ETH"],
      "3": ["NVDA", "PLTR", "SPY", "QQQ"],
      "4": ["NVDA", "BTC", "ETH", "RKLB", "LUNR", "ASTS", "PLTR", "SPY", "QQQ"]
    }
  });
});

app.get("/api/quotes", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json(await getQuotes(req.query.symbols || "", process.env));
  } catch (err) {
    console.error("Quote endpoint failed:", err);
    res.status(500).json({
      status: "error",
      source: "error",
      updatedAt: new Date().toISOString(),
      quoteCount: 0,
      quotes: [],
      error: "quote_endpoint_failed"
    });
  }
});

app.listen(PORT, () => {
  console.log(`OpenClaw Market Rain running at http://localhost:${PORT}`);
});
