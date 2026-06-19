# OpenClaw Market Rain — Project State

## Canonical location

`/Users/testenv/AIProjects/market-rain`

Do not use these stale placeholders:

- `/Users/testenv/.openclaw/workspace/openclaw-market-rain`
- `/Users/testenv/.openclaw/workspace/market-rain`
- `/Users/testenv/.openclaw/workspace/~/AIProjects/market-rain`

## Run and verify

```sh
cd /Users/testenv/AIProjects/market-rain
npm start
```

Open `http://127.0.0.1:18891`.

Quick checks:

```sh
node --check server.js
curl -fsS http://127.0.0.1:18891/api/quotes
curl -fsS http://127.0.0.1:18891/ >/dev/null
```

## Verified working state

- Express serves `public/` on port `18891`.
- The canvas renders vertical green/red market streams.
- Stream heads are bright with fading trails.
- Tokens mix symbols, arrows, prices, and percentage changes.
- Keys: `1` Space, `2` Crypto, `3` Index, `4` All.
- `+`/`-` adjusts speed; `0` resets speed.
- `F` toggles fullscreen; `O` toggles OLED mode.
- HUD displays the active mode and shortcuts.
- Browser verification completed at 1280×720 with no console errors.

## Known gaps / next work

1. `/api/quotes` returns mocked values from `server.js`; live market data is not implemented.
2. `config.json` exists but is not consumed by the server or browser. Watchlists remain duplicated in `public/app.js`.
3. Add an API such as `/api/config`, load watchlists dynamically, and validate malformed configuration.
4. Choose and document a live quote provider, including symbol mapping for BTC/ETH and rate-limit/error handling.
5. Preserve fallback quotes so the screensaver still works offline.
6. Add tests for `/api/quotes`, `/api/config`, and keyboard mode switching.

## Handoff rules

- Inspect files and command output before reporting success.
- Use the canonical path above for every command.
- Keep port `18891`.
- Make one focused change per commit and include verification in the commit message or changelog.
- Do not claim a commit exists until `git log -1 --oneline` confirms it.

