import { Spacing } from '../spacing';

describe('spacing', () => {
  it('has all spacing values', () => {
    expect(Spacing.xs).toBe(4);
    expect(Spacing.sm).toBe(8);
    expect(Spacing.md).toBe(16);
    expect(Spacing.lg).toBe(24);
    expect(Spacing.xl).toBe(32);
    expect(Spacing.xxl).toBe(48);
    expect(Spacing.xxxl).toBe(64);
  });

  it('has increasing spacing values', () => {
    expect(Spacing.xs).toBeLessThan(Spacing.sm);
    expect(Spacing.sm).toBeLessThan(Spacing.md);
    expect(Spacing.md).toBeLessThan(Spacing.lg);
    expect(Spacing.lg).toBeLessThan(Spacing.xl);
    expect(Spacing.xl).toBeLessThan(Spacing.xxl);
    expect(Spacing.xxl).toBeLessThan(Spacing.xxxl);
  });

  it('all values are numbers', () => {
    Object.values(Spacing).forEach(value => {
      expect(typeof value).toBe('number');
    });
  });

  it('all values are positive', () => {
    Object.values(Spacing).forEach(value => {
      expect(value).toBeGreaterThan(0);
    });
  });
});
