export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    modes: {
      "1": ["RKLB", "LUNR", "ASTS"],
      "2": ["BTC", "ETH"],
      "3": ["NVDA", "PLTR", "SPY", "QQQ"],
      "4": ["NVDA", "BTC", "ETH", "RKLB", "LUNR", "ASTS", "PLTR", "SPY", "QQQ"]
    }
  });
}
