import { ReceiptColors, receiptStyles } from '../receiptStyles';

describe('receiptStyles', () => {
  describe('ReceiptColors', () => {
    it('has background color', () => {
      expect(ReceiptColors.background).toBe('#FFFFFF');
    });

    it('has primary color', () => {
      expect(ReceiptColors.primary).toBe('#1F2937');
    });

    it('has secondary color', () => {
      expect(ReceiptColors.secondary).toBe('#F8FAFC');
    });

    it('has border color', () => {
      expect(ReceiptColors.border).toBe('#E2E8F0');
    });

    it('has textPrimary color', () => {
      expect(ReceiptColors.textPrimary).toBe('#111827');
    });

    it('has textSecondary color', () => {
      expect(ReceiptColors.textSecondary).toBe('#475569');
    });

    it('has textMuted color', () => {
      expect(ReceiptColors.textMuted).toBe('#64748B');
    });

    it('has accent color', () => {
      expect(ReceiptColors.accent).toBe('#0F4C81');
    });

    it('has success color', () => {
      expect(ReceiptColors.success).toBe('#15803D');
    });

    it('has danger color', () => {
      expect(ReceiptColors.danger).toBe('#B91C1C');
    });

    it('all colors are valid hex format', () => {
      const colors = Object.values(ReceiptColors);
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('receiptStyles StyleSheet', () => {
    it('has container style with width', () => {
      expect(receiptStyles.container).toBeDefined();
      expect(receiptStyles.container.width).toBe(600);
    });

    it('has header style', () => {
      expect(receiptStyles.header).toBeDefined();
      expect(receiptStyles.header.backgroundColor).toBe(ReceiptColors.primary);
    });

    it('has brandName style', () => {
      expect(receiptStyles.brandName).toBeDefined();
    });

    it('has title style', () => {
      expect(receiptStyles.title).toBeDefined();
    });

    it('has body style', () => {
      expect(receiptStyles.body).toBeDefined();
    });

    it('has metaRow style', () => {
      expect(receiptStyles.metaRow).toBeDefined();
    });

    it('has statusBadge style', () => {
      expect(receiptStyles.statusBadge).toBeDefined();
    });
  });
});
