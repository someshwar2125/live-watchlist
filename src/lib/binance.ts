/**
 * Binance public market-data helpers.
 * Uses the market-data-only mirrors, which need no API key.
 * If these are blocked on your network, swap to:
 *   WS_BASE   = 'wss://stream.binance.com:9443'
 *   REST_BASE = 'https://api.binance.com'
 */
export const WS_BASE = 'wss://data-stream.binance.vision';
export const REST_BASE = 'https://data-api.binance.vision';

export interface Ticker {
  symbol: string; // e.g. "BTCUSDT"
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  changePct: number;
}

export interface Candle {
  time: number; // UTC seconds (lightweight-charts format)
  open: number;
  high: number;
  low: number;
  close: number;
}

export const INTERVALS = ['1m', '5m', '15m', '1h', '1d'] as const;
export type Interval = (typeof INTERVALS)[number];

type Rec = Record<string, unknown>;

const num = (v: unknown): number => Number(v);

/** Parse a 24h mini-ticker payload. Returns null if the payload is malformed. */
export function parseMiniTicker(data: unknown): Ticker | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Rec;
  if (typeof d.s !== 'string') return null;

  const price = num(d.c);
  const open = num(d.o);
  if (!Number.isFinite(price) || !Number.isFinite(open) || open === 0) return null;

  return {
    symbol: d.s,
    price,
    open,
    high: num(d.h),
    low: num(d.l),
    volume: num(d.q), // quote-asset volume (USDT)
    changePct: ((price - open) / open) * 100,
  };
}

/** Parse one row of the REST klines response into a Candle. */
export function parseKlineRow(row: unknown[]): Candle {
  return {
    time: Math.floor(Number(row[0]) / 1000),
    open: num(row[1]),
    high: num(row[2]),
    low: num(row[3]),
    close: num(row[4]),
  };
}

/** Parse a websocket kline event into a Candle. Returns null if malformed. */
export function parseKlineEvent(data: unknown): Candle | null {
  if (typeof data !== 'object' || data === null) return null;
  const k = (data as Rec).k;
  if (typeof k !== 'object' || k === null) return null;
  const kr = k as Rec;
  const candle: Candle = {
    time: Math.floor(num(kr.t) / 1000),
    open: num(kr.o),
    high: num(kr.h),
    low: num(kr.l),
    close: num(kr.c),
  };
  return Object.values(candle).every(Number.isFinite) ? candle : null;
}

export function tickerStreamUrl(symbols: string[]): string {
  const streams = symbols.map((s) => `${s.toLowerCase()}@miniTicker`).join('/');
  return `${WS_BASE}/stream?streams=${streams}`;
}

export function klineStreamUrl(symbol: string, interval: Interval): string {
  return `${WS_BASE}/ws/${symbol.toLowerCase()}@kline_${interval}`;
}

export async function fetchKlines(
  symbol: string,
  interval: Interval,
  signal?: AbortSignal,
  limit = 300,
): Promise<Candle[]> {
  const url = `${REST_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to load candles (${res.status})`);
  const rows = (await res.json()) as unknown[][];
  return rows.map(parseKlineRow);
}

/** Check that a symbol exists on Binance by asking for its latest price. */
export async function symbolExists(symbol: string): Promise<boolean> {
  const res = await fetch(`${REST_BASE}/api/v3/ticker/price?symbol=${symbol}`);
  return res.ok;
}
