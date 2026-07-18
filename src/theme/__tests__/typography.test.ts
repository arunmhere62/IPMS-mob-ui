import Typography from '../typography';

describe('Typography', () => {
  describe('fontSize', () => {
    it('has xs size', () => {
      expect(Typography.fontSize.xs).toBe(12);
    });

    it('has sm size', () => {
      expect(Typography.fontSize.sm).toBe(14);
    });

    it('has base size', () => {
      expect(Typography.fontSize.base).toBe(16);
    });

    it('has lg size', () => {
      expect(Typography.fontSize.lg).toBe(18);
    });

    it('has xl size', () => {
      expect(Typography.fontSize.xl).toBe(20);
    });

    it('has 2xl size', () => {
      expect(Typography.fontSize['2xl']).toBe(24);
    });

    it('has 3xl size', () => {
      expect(Typography.fontSize['3xl']).toBe(30);
    });

    it('has 4xl size', () => {
      expect(Typography.fontSize['4xl']).toBe(36);
    });

    it('font sizes are in ascending order', () => {
      const sizes = [
        Typography.fontSize.xs,
        Typography.fontSize.sm,
        Typography.fontSize.base,
        Typography.fontSize.lg,
        Typography.fontSize.xl,
        Typography.fontSize['2xl'],
        Typography.fontSize['3xl'],
        Typography.fontSize['4xl'],
      ];
      for (let i = 1; i < sizes.length; i++) {
        expect(sizes[i]).toBeGreaterThan(sizes[i - 1]);
      }
    });
  });

  describe('fontWeight', () => {
    it('has normal weight', () => {
      expect(Typography.fontWeight.normal).toBe('400');
    });

    it('has medium weight', () => {
      expect(Typography.fontWeight.medium).toBe('500');
    });

    it('has semibold weight', () => {
      expect(Typography.fontWeight.semibold).toBe('600');
    });

    it('has bold weight', () => {
      expect(Typography.fontWeight.bold).toBe('700');
    });
  });

  describe('lineHeight', () => {
    it('has tight line height', () => {
      expect(Typography.lineHeight.tight).toBe(1.2);
    });

    it('has normal line height', () => {
      expect(Typography.lineHeight.normal).toBe(1.5);
    });

    it('has relaxed line height', () => {
      expect(Typography.lineHeight.relaxed).toBe(1.75);
    });

    it('line heights are in ascending order', () => {
      expect(Typography.lineHeight.tight).toBeLessThan(Typography.lineHeight.normal);
      expect(Typography.lineHeight.normal).toBeLessThan(Typography.lineHeight.relaxed);
    });
  });
});
