# Live Watchlist

A real-time crypto watchlist with a live candlestick chart, built with **React, TypeScript and WebSockets**.

**Live demo:** _add your Vercel link here_

## Features

- Live prices for a watchlist over a single combined WebSocket (Binance public market data, no API key)
- Price flash animation (green/red) on every tick, 24h change, high, low and volume
- Candlestick chart (TradingView Lightweight Charts): history over REST, last candle updated live over WebSocket
- Interval switcher: 1m, 5m, 15m, 1h, 1d
- Add symbols (validated against the Binance REST API) and remove them; watchlist persists in `localStorage`
- WebSocket wrapper with automatic reconnect (exponential backoff) and a live connection status indicator
- Responsive layout (desktop and mobile)
- Unit tests for parsing and formatting logic (Vitest)

## Tech stack

React 18 · TypeScript (strict) · Vite · lightweight-charts · Vitest

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit tests
npm run build    # type-check + production build
```

## Project structure

```
src/
  lib/
    socket.ts      reconnecting WebSocket wrapper
    binance.ts     URLs, REST calls, payload parsing (pure functions)
    format.ts      price / percent / volume formatting
  hooks/
    useTickers.ts  subscribes to live tickers, exposes state + connection status
    usePrevious.ts previous-render value (used for price flash direction)
  components/
    Watchlist.tsx  table, add/remove, memoized rows
    PriceChart.tsx candlestick chart: REST history + live kline stream
  App.tsx          layout, selected symbol, interval, persistence
```

## Key design decisions

- **One WebSocket for all watchlist symbols** (combined stream) instead of one per symbol, so adding a symbol resubscribes once.
- **Cleanup in effects**: sockets are closed, in-flight fetches aborted (`AbortController`) and the chart disposed when the symbol or interval changes, so there are no leaks or stale updates.
- **History first, then stream**: the chart loads candles over REST, then starts the kline socket, so live updates never arrive before the base data.
- **`React.memo` rows** so a tick for one symbol re-renders only that row's data path.
- **Parsing isolated in pure functions** and unit tested, since network payloads can be malformed.

## Notes

If `data-stream.binance.vision` is blocked on your network, switch `WS_BASE` / `REST_BASE` in `src/lib/binance.ts` to the standard Binance hosts (instructions in the file).

## Possible next steps

Order ticket UI, option-chain table with virtualized rows, price alerts, dark/light theme toggle, E2E tests with Playwright.
