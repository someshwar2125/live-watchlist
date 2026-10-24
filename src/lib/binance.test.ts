import { describe, expect, it } from 'vitest';
import {
  klineStreamUrl,
  parseKlineEvent,
  parseKlineRow,
  parseMiniTicker,
  tickerStreamUrl,
} from './binance';

describe('parseMiniTicker', () => {
  const payload = { e: '24hrMiniTicker', s: 'BTCUSDT', c: '110', o: '100', h: '115', l: '95', q: '5000000' };

  it('parses a valid payload and computes 24h change', () => {
    const t = parseMiniTicker(payload);
    expect(t).toMatchObject({ symbol: 'BTCUSDT', price: 110, open: 100, high: 115, low: 95 });
    expect(t?.changePct).toBeCloseTo(10);
  });

  it('returns null for malformed input', () => {
    expect(parseMiniTicker(null)).toBeNull();
    expect(parseMiniTicker({})).toBeNull();
    expect(parseMiniTicker({ ...payload, c: 'abc' })).toBeNull();
    expect(parseMiniTicker({ ...payload, o: '0' })).toBeNull();
  });
});

describe('kline parsing', () => {
  it('parses a REST kline row (ms -> seconds)', () => {
    const c = parseKlineRow([1_700_000_000_000, '1', '2', '0.5', '1.5', '100']);
    expect(c).toEqual({ time: 1_700_000_000, open: 1, high: 2, low: 0.5, close: 1.5 });
  });

  it('parses a websocket kline event', () => {
    const c = parseKlineEvent({ e: 'kline', k: { t: 1_700_000_060_000, o: '1', h: '2', l: '0.5', c: '1.8' } });
    expect(c).toEqual({ time: 1_700_000_060, open: 1, high: 2, low: 0.5, close: 1.8 });
  });

  it('rejects malformed kline events', () => {
    expect(parseKlineEvent({})).toBeNull();
    expect(parseKlineEvent({ k: { t: 'x', o: '1', h: '1', l: '1', c: '1' } })).toBeNull();
  });
});

describe('stream urls', () => {
  it('builds a combined ticker stream url', () => {
    const url = tickerStreamUrl(['BTCUSDT', 'ETHUSDT']);
    expect(url).toContain('/stream?streams=btcusdt@miniTicker/ethusdt@miniTicker');
  });
  it('builds a kline stream url', () => {
    expect(klineStreamUrl('BTCUSDT', '5m')).toMatch(/\/ws\/btcusdt@kline_5m$/);
  });
});
