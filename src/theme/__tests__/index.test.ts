import { Theme, Colors, Spacing, Typography, withOpacity } from '../index';

describe('Theme index', () => {
  it('exports Colors as Theme.colors', () => {
    expect(Theme.colors).toBe(Colors);
  });

  it('exports Spacing as Theme.spacing', () => {
    expect(Theme.spacing).toBe(Spacing);
  });

  it('exports Typography as Theme.typography', () => {
    expect(Theme.typography).toBe(Typography);
  });

  it('exports withOpacity as Theme.withOpacity', () => {
    expect(Theme.withOpacity).toBe(withOpacity);
  });

  it('Theme has colors with primary', () => {
    expect(Theme.colors.primary).toBeDefined();
  });

  it('Theme has spacing with sm', () => {
    expect(Theme.spacing.sm).toBeDefined();
  });

  it('Theme has typography with fontSize', () => {
    expect(Theme.typography.fontSize).toBeDefined();
  });

  it('withOpacity produces rgba string', () => {
    const result = Theme.withOpacity('#2563EB', 0.5);
    expect(result).toMatch(/^rgba\(/);
  });
});
