import { useEffect, useRef, useState } from 'react';
import { createChart, type UTCTimestamp } from 'lightweight-charts';
import {
  fetchKlines,
  klineStreamUrl,
  parseKlineEvent,
  type Candle,
  type Interval,
} from '../lib/binance';
import { createSocket } from '../lib/socket';

interface Props {
  symbol: string;
  interval: Interval;
}

const toPoint = (c: Candle) => ({ ...c, time: c.time as UTCTimestamp });

/**
 * Candlestick chart: loads history over REST, then keeps the last
 * candle updating from the kline WebSocket stream.
 */
export default function PriceChart({ symbol, interval }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setLoading(true);
    setError('');

    const chart = createChart(el, {
      autoSize: true,
      layout: { background: { color: 'transparent' }, textColor: '#9aa4b2' },
      grid: { vertLines: { color: '#1f2630' }, horzLines: { color: '#1f2630' } },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#2a3340' },
      rightPriceScale: { borderColor: '#2a3340' },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const controller = new AbortController();
    let stopSocket: (() => void) | undefined;
    let cancelled = false;

    fetchKlines(symbol, interval, controller.signal)
      .then((candles) => {
        if (cancelled) return;
        series.setData(candles.map(toPoint));
        chart.timeScale().fitContent();
        setLoading(false);

        // Start streaming only after history is in place.
        stopSocket = createSocket(klineStreamUrl(symbol, interval), {
          onMessage: (msg) => {
            const candle = parseKlineEvent(msg);
            if (candle) series.update(toPoint(candle));
          },
        });
      })
      .catch((err: unknown) => {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        setError(err instanceof Error ? err.message : 'Failed to load chart');
        setLoading(false);
      });

    // Cleanup runs when symbol/interval changes or the component unmounts.
    return () => {
      cancelled = true;
      controller.abort();
      stopSocket?.();
      chart.remove();
    };
  }, [symbol, interval]);

  return (
    <div className="chart-wrap">
      <div ref={containerRef} className="chart" />
      {loading && <div className="overlay">Loading chart…</div>}
      {error && <div className="overlay error">{error}</div>}
    </div>
  );
}
