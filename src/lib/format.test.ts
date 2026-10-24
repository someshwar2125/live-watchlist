import { describe, expect, it } from 'vitest';
import { formatPercent, formatPrice, formatVolume, prettySymbol } from './format';

describe('formatPrice', () => {
  it('uses 2 decimals for large prices', () => {
    expect(formatPrice(67123.456)).toBe('67,123.46');
  });
  it('uses more precision for small prices', () => {
    expect(formatPrice(0.123456789)).toBe('0.123457');
    expect(formatPrice(12.34567)).toBe('12.3457');
  });
  it('handles non-finite values', () => {
    expect(formatPrice(NaN)).toBe('-');
  });
});

describe('formatPercent', () => {
  it('adds a plus sign for gains', () => {
    expect(formatPercent(1.234)).toBe('+1.23%');
  });
  it('keeps the minus sign for losses', () => {
    expect(formatPercent(-0.4)).toBe('-0.40%');
  });
});

describe('formatVolume', () => {
  it('compacts large numbers', () => {
    expect(formatVolume(1_500)).toBe('1.50K');
    expect(formatVolume(2_340_000)).toBe('2.34M');
    expect(formatVolume(5_600_000_000)).toBe('5.60B');
  });
});

describe('prettySymbol', () => {
  it('inserts a slash before USDT', () => {
    expect(prettySymbol('BTCUSDT')).toBe('BTC/USDT');
  });
  it('leaves other symbols untouched', () => {
    expect(prettySymbol('ETHBTC')).toBe('ETHBTC');
  });
});
