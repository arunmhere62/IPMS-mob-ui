import { formatCurrency } from '../formatCurrency';

describe('formatCurrency', () => {
  it('formats a valid number as INR', () => {
    expect(formatCurrency(1000)).toBe('₹1,000.00');
  });

  it('handles string numbers', () => {
    expect(formatCurrency('500.50')).toBe('₹500.50');
  });

  it('returns N/A for null, undefined, empty string and NaN', () => {
    expect(formatCurrency(null)).toBe('N/A');
    expect(formatCurrency(undefined)).toBe('N/A');
    expect(formatCurrency('')).toBe('N/A');
    expect(formatCurrency('abc')).toBe('N/A');
  });
});
