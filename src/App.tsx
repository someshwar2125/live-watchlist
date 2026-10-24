import { useEffect, useState } from 'react';
import Watchlist from './components/Watchlist';
import PriceChart from './components/PriceChart';
import { useTickers } from './hooks/useTickers';
import { INTERVALS, type Interval } from './lib/binance';
import { prettySymbol } from './lib/format';

const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
const STORAGE_KEY = 'live-watchlist:symbols';

function loadSymbols(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) return parsed;
    }
  } catch {
    // fall through to defaults
  }
  return DEFAULT_SYMBOLS;
}

const STATUS_LABEL = {
  connecting: 'Connecting…',
  open: 'Live',
  reconnecting: 'Reconnecting…',
} as const;

export default function App() {
  const [symbols, setSymbols] = useState<string[]>(loadSymbols);
  const [selected, setSelected] = useState<string>(() => loadSymbols()[0] ?? 'BTCUSDT');
  const [interval, setInterval_] = useState<Interval>('1m');
  const { tickers, status } = useTickers(symbols);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
  }, [symbols]);

  const add = (symbol: string) => {
    setSymbols((prev) => [...prev, symbol]);
    setSelected(symbol);
  };

  const remove = (symbol: string) => {
    setSymbols((prev) => {
      const next = prev.filter((s) => s !== symbol);
      if (symbol === selected) setSelected(next[0] ?? '');
      return next;
    });
  };

  return (
    <div className="app">
      <header>
        <h1>Live Watchlist</h1>
        <span className={`status ${status}`}>
          <span className="dot" /> {STATUS_LABEL[status]}
        </span>
      </header>

      <main>
        <Watchlist
          symbols={symbols}
          tickers={tickers}
          selected={selected}
          onSelect={setSelected}
          onAdd={add}
          onRemove={remove}
        />

        <section className="panel">
          {selected ? (
            <>
              <div className="chart-head">
                <h2>{prettySymbol(selected)}</h2>
                <div className="tabs" role="tablist" aria-label="Chart interval">
                  {INTERVALS.map((i) => (
                    <button
                      key={i}
                      role="tab"
                      aria-selected={i === interval}
                      className={i === interval ? 'active' : ''}
                      onClick={() => setInterval_(i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <PriceChart symbol={selected} interval={interval} />
            </>
          ) : (
            <p className="muted">Select a symbol to see its chart.</p>
          )}
        </section>
      </main>

      <footer>Data: Binance public market data · Built with React, TypeScript, WebSockets</footer>
    </div>
  );
}
