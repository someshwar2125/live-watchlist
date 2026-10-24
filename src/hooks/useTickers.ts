import { useEffect, useState } from 'react';
import { parseMiniTicker, tickerStreamUrl, type Ticker } from '../lib/binance';
import { createSocket, type ConnectionStatus } from '../lib/socket';

/**
 * Subscribes to live 24h mini-tickers for the given symbols over one
 * combined WebSocket and keeps the latest ticker per symbol in state.
 */
export function useTickers(symbols: string[]) {
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  // Re-subscribe only when the *set* of symbols changes.
  const key = symbols.join(',');

  useEffect(() => {
    if (symbols.length === 0) return;

    const stop = createSocket(tickerStreamUrl(symbols), {
      onStatus: setStatus,
      onMessage: (msg) => {
        // Combined streams wrap the payload as { stream, data }
        const payload = (msg as { data?: unknown }).data ?? msg;
        const ticker = parseMiniTicker(payload);
        if (ticker) {
          setTickers((prev) => ({ ...prev, [ticker.symbol]: ticker }));
        }
      },
    });

    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { tickers, status };
}
