/** Format a price with sensible precision: big prices get 2 decimals, tiny ones get more. */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '-';
  let digits = 2;
  if (value < 1) digits = 6;
  else if (value < 100) digits = 4;
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Format a percentage with an explicit sign, e.g. +1.23% / -0.40%. */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/** Compact volume formatting: 1.2K, 3.4M, 5.6B. */
export function formatVolume(value: number): string {
  if (!Number.isFinite(value)) return '-';
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

/** "BTCUSDT" -> "BTC/USDT" for display. */
export function prettySymbol(symbol: string): string {
  return symbol.endsWith('USDT') ? `${symbol.slice(0, -4)}/USDT` : symbol;
}
