import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 18891;

// Force public directory usage
app.use("/" , express.static(path.join(__dirname, "public")));

app.get("/api/quotes", (req, res) => {
  console.log("Quote API Access");
  res.json({
    updatedAt: new Date().toISOString(),
    quotes: [
      ["NVDA",145.23,2.14],["BTC",104250,1.32],["ETH",3520,-0.42],
      ["RKLB",22.18,3.01],["LUNR",9.72,-1.22],["ASTS",31.64,4.88],
      ["PLTR",142.05,0.74],["SPY",548.66,0.21],["QQQ",481.91,0.35]
    ].map(([symbol,price,changePercent]) => ({symbol,price,changePercent}))
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Serving files from: ${path.join(__dirname, "public")}`);
});
