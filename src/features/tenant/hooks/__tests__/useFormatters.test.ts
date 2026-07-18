import { useFormatters } from '../useFormatters';

describe('useFormatters', () => {
  const { formatDate, formatAmount } = useFormatters();

  describe('formatDate', () => {
    it('formats a valid date string', () => {
      const result = formatDate('2026-01-15');
      expect(result).toMatch(/15.*Jan.*2026/);
    });

    it('returns N/A for null', () => {
      expect(formatDate(null)).toBe('N/A');
    });

    it('returns N/A for undefined', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('returns N/A for empty string', () => {
      expect(formatDate('')).toBe('N/A');
    });
  });

  describe('formatAmount', () => {
    it('formats a valid number', () => {
      expect(formatAmount(5000)).toBe('₹5,000');
    });

    it('formats a valid string number', () => {
      expect(formatAmount('5000')).toBe('₹5,000');
    });

    it('formats large numbers with Indian grouping', () => {
      expect(formatAmount(100000)).toBe('₹1,00,000');
    });

    it('formats decimal numbers', () => {
      expect(formatAmount(5000.5)).toBe('₹5,000.5');
    });

    it('returns N/A for null', () => {
      expect(formatAmount(null)).toBe('N/A');
    });

    it('returns N/A for undefined', () => {
      expect(formatAmount(undefined)).toBe('N/A');
    });

    it('returns N/A for empty string', () => {
      expect(formatAmount('')).toBe('N/A');
    });

    it('formats zero', () => {
      expect(formatAmount(0)).toBe('₹0');
    });
  });
});
