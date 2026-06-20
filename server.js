import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 18891;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/config", (req, res) => {
  res.json({
    modes: {
      "1": ["RKLB", "LUNR", "ASTS"],
      "2": ["BTC", "ETH"],
      "3": ["NVDA", "PLTR", "SPY", "QQQ"],
      "4": ["NVDA", "BTC", "ETH", "RKLB", "LUNR", "ASTS", "PLTR", "SPY", "QQQ"]
    }
  });
});

app.get("/api/quotes", (req, res) => {
  res.json({
    updatedAt: new Date().toISOString(),
    quotes: [
      { symbol: "NVDA", price: 145.23, changePercent: 2.14 },
      { symbol: "BTC", price: 104250, changePercent: 1.32 },
      { symbol: "ETH", price: 3520, changePercent: -0.42 },
      { symbol: "RKLB", price: 22.18, changePercent: 3.01 },
      { symbol: "LUNR", price: 9.72, changePercent: -1.22 },
      { symbol: "ASTS", price: 31.64, changePercent: 4.88 },
      { symbol: "PLTR", price: 142.05, changePercent: 0.74 },
      { symbol: "SPY", price: 548.66, changePercent: 0.21 },
      { symbol: "QQQ", price: 481.91, changePercent: 0.35 }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`OpenClaw Market Rain running at http://localhost:${PORT}`);
});
