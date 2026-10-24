import { memo, useState, type FormEvent } from 'react';
import type { Ticker } from '../lib/binance';
import { symbolExists } from '../lib/binance';
import { formatPercent, formatPrice, formatVolume, prettySymbol } from '../lib/format';
import { usePrevious } from '../hooks/usePrevious';

interface RowProps {
  symbol: string;
  ticker?: Ticker;
  selected: boolean;
  onSelect: (symbol: string) => void;
  onRemove: (symbol: string) => void;
}

const Row = memo(function Row({ symbol, ticker, selected, onSelect, onRemove }: RowProps) {
  const price = ticker?.price;
  const prev = usePrevious(price);
  const flash = price !== undefined && prev !== undefined && price !== prev
    ? price > prev ? 'flash-up' : 'flash-down'
    : '';
  const changeClass = ticker ? (ticker.changePct >= 0 ? 'up' : 'down') : '';

  return (
    <tr className={selected ? 'selected' : ''} onClick={() => onSelect(symbol)}>
      <td className="symbol">{prettySymbol(symbol)}</td>
      {/* key={price} restarts the CSS flash animation on every tick */}
      <td key={price} className={`num ${flash}`}>
        {ticker ? formatPrice(ticker.price) : '…'}
      </td>
      <td className={`num ${changeClass}`}>{ticker ? formatPercent(ticker.changePct) : ''}</td>
      <td className="num hide-sm">{ticker ? formatPrice(ticker.high) : ''}</td>
      <td className="num hide-sm">{ticker ? formatPrice(ticker.low) : ''}</td>
      <td className="num hide-sm">{ticker ? formatVolume(ticker.volume) : ''}</td>
      <td>
        <button
          className="icon-btn"
          aria-label={`Remove ${symbol}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(symbol);
          }}
        >
          ×
        </button>
      </td>
    </tr>
  );
});

interface Props {
  symbols: string[];
  tickers: Record<string, Ticker>;
  selected: string;
  onSelect: (symbol: string) => void;
  onAdd: (symbol: string) => void;
  onRemove: (symbol: string) => void;
}

export default function Watchlist({ symbols, tickers, selected, onSelect, onAdd, onRemove }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    let symbol = input.trim().toUpperCase().replace('/', '');
    if (!symbol) return;
    if (!symbol.endsWith('USDT')) symbol += 'USDT';

    if (symbols.includes(symbol)) {
      setError(`${prettySymbol(symbol)} is already in your watchlist`);
      return;
    }

    setChecking(true);
    setError('');
    try {
      if (await symbolExists(symbol)) {
        onAdd(symbol);
        setInput('');
      } else {
        setError(`${symbol} not found on Binance`);
      }
    } catch {
      setError('Network error, please try again');
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className="panel">
      <form className="add-form" onSubmit={submit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add symbol, e.g. SOL"
          aria-label="Add symbol"
        />
        <button type="submit" disabled={checking}>
          {checking ? 'Checking…' : 'Add'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th className="num">Price</th>
            <th className="num">24h</th>
            <th className="num hide-sm">High</th>
            <th className="num hide-sm">Low</th>
            <th className="num hide-sm">Volume</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {symbols.map((s) => (
            <Row
              key={s}
              symbol={s}
              ticker={tickers[s]}
              selected={s === selected}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          ))}
        </tbody>
      </table>
      {symbols.length === 0 && <p className="muted">Your watchlist is empty. Add a symbol above.</p>}
    </section>
  );
}
