import { Colors, withOpacity } from '../colors';

describe('colors', () => {
  describe('Colors object', () => {
    it('has primary colors', () => {
      expect(Colors.primary).toBe('#2563EB');
      expect(Colors.primaryLight).toBe('#60A5FA');
      expect(Colors.primaryDark).toBe('#1D4ED8');
    });

    it('has secondary colors', () => {
      expect(Colors.secondary).toBe('#10B981');
      expect(Colors.secondaryLight).toBe('#34D399');
      expect(Colors.secondaryDark).toBe('#059669');
    });

    it('has status colors', () => {
      expect(Colors.danger).toBe('#EF4444');
      expect(Colors.warning).toBe('#F59E0B');
      expect(Colors.info).toBe('#2563EB');
    });

    it('has neutral colors', () => {
      expect(Colors.dark).toBe('#1F2937');
      expect(Colors.light).toBe('#F9FAFB');
      expect(Colors.canvas).toBe('#FFFFFF');
      expect(Colors.border).toBe('#E5E7EB');
    });

    it('has text colors', () => {
      expect(Colors.text.primary).toBe('#1F2937');
      expect(Colors.text.secondary).toBe('#4B5563');
      expect(Colors.text.tertiary).toBe('#6B7280');
      expect(Colors.text.inverse).toBe('#FFFFFF');
      expect(Colors.text.link).toBe('#2563EB');
    });

    it('has background colors', () => {
      expect(Colors.background.primary).toBe('#FFFFFF');
      expect(Colors.background.secondary).toBe('#F9FAFB');
      expect(Colors.background.tertiary).toBe('#F3F4F6');
      expect(Colors.background.blue).toBe('#2563EB');
    });

    it('has component specific colors', () => {
      expect(Colors.card.background).toBe('#FFFFFF');
      expect(Colors.button.primary).toBe('#2563EB');
      expect(Colors.input.background).toBe('#FFFFFF');
    });

    it('has shadows', () => {
      expect(Colors.shadows.small).toBeDefined();
      expect(Colors.shadows.medium).toBeDefined();
      expect(Colors.shadows.large).toBeDefined();
    });
  });

  describe('withOpacity', () => {
    it('converts hex to rgba with opacity', () => {
      const result = withOpacity('#2563EB', 0.5);
      expect(result).toBe('rgba(37, 99, 235, 0.5)');
    });

    it('handles white color', () => {
      const result = withOpacity('#FFFFFF', 0.8);
      expect(result).toBe('rgba(255, 255, 255, 0.8)');
    });

    it('handles black color', () => {
      const result = withOpacity('#000000', 0.3);
      expect(result).toBe('rgba(0, 0, 0, 0.3)');
    });

    it('handles full opacity', () => {
      const result = withOpacity('#2563EB', 1);
      expect(result).toBe('rgba(37, 99, 235, 1)');
    });

    it('handles zero opacity', () => {
      const result = withOpacity('#2563EB', 0);
      expect(result).toBe('rgba(37, 99, 235, 0)');
    });

    it('handles decimal opacity', () => {
      const result = withOpacity('#2563EB', 0.75);
      expect(result).toBe('rgba(37, 99, 235, 0.75)');
    });

    it('returns rgba format', () => {
      const result = withOpacity('#2563EB', 0.5);
      expect(result).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
    });
  });
});
