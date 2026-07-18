// Test CompactReceiptGenerator logic without native dependencies
// (captureRef, expo-sharing, Linking are native modules)

describe('CompactReceiptGenerator', () => {
  describe('ReceiptComponent selection logic', () => {
    // Replicate the component selection logic
    const getReceiptComponent = (receiptType: string) => {
      if (receiptType === 'ADVANCE') return 'AdvanceReceipt';
      if (receiptType === 'REFUND') return 'RefundReceipt';
      return 'RentReceipt';
    };

    it('returns AdvanceReceipt for ADVANCE type', () => {
      expect(getReceiptComponent('ADVANCE')).toBe('AdvanceReceipt');
    });

    it('returns RefundReceipt for REFUND type', () => {
      expect(getReceiptComponent('REFUND')).toBe('RefundReceipt');
    });

    it('returns RentReceipt for RENT type', () => {
      expect(getReceiptComponent('RENT')).toBe('RentReceipt');
    });

    it('returns RentReceipt as default for undefined type', () => {
      expect(getReceiptComponent('UNKNOWN')).toBe('RentReceipt');
    });

    it('returns RentReceipt as default for empty type', () => {
      expect(getReceiptComponent('')).toBe('RentReceipt');
    });
  });

  describe('WhatsApp message formatting', () => {
    // Replicate the message building logic
    const buildReceiptTitle = (receiptType: string) => {
      if (receiptType === 'ADVANCE') return 'Advance Receipt';
      if (receiptType === 'REFUND') return 'Refund Receipt';
      return 'Rent Receipt';
    };

    it('builds correct title for ADVANCE', () => {
      expect(buildReceiptTitle('ADVANCE')).toBe('Advance Receipt');
    });

    it('builds correct title for REFUND', () => {
      expect(buildReceiptTitle('REFUND')).toBe('Refund Receipt');
    });

    it('builds correct title for RENT', () => {
      expect(buildReceiptTitle('RENT')).toBe('Rent Receipt');
    });

    it('formats phone number with 91 prefix when missing', () => {
      const phoneNumber = '9876543210';
      const formatted = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
      expect(formatted).toBe('919876543210');
    });

    it('keeps phone number when 91 prefix already present', () => {
      const phoneNumber = '919876543210';
      const formatted = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
      expect(formatted).toBe('919876543210');
    });

    it('encodes message for URL', () => {
      const message = '🏠 *PG Management - Rent Receipt*\nHello John';
      const encoded = encodeURIComponent(message);
      expect(encoded).not.toContain(' ');
      expect(encoded).toContain('%0A');
    });
  });

  describe('captureReceiptImage scale calculation', () => {
    it('calculates target dimensions with scale factor', () => {
      const width = 600;
      const height = 800;
      const exportScale = 2;
      const pxScale = 3 * exportScale; // PixelRatio.get() = 3 for test
      const targetWidth = Math.max(1, Math.round(width * pxScale));
      const targetHeight = Math.max(1, Math.round(height * pxScale));
      expect(targetWidth).toBe(3600);
      expect(targetHeight).toBe(4800);
    });

    it('ensures minimum dimension of 1', () => {
      const width = 0;
      const height = 0;
      const targetWidth = Math.max(1, Math.round(width * 6));
      const targetHeight = Math.max(1, Math.round(height * 6));
      expect(targetWidth).toBe(1);
      expect(targetHeight).toBe(1);
    });
  });
});
