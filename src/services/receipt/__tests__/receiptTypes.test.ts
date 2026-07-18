import type { ReceiptType, ReceiptCity, ReceiptState, ReceiptPgDetails, ReceiptData } from '../receiptTypes';

describe('receiptTypes', () => {
  describe('ReceiptType', () => {
    it('accepts valid receipt types', () => {
      const rent: ReceiptType = 'RENT';
      const advance: ReceiptType = 'ADVANCE';
      const refund: ReceiptType = 'REFUND';

      expect(rent).toBe('RENT');
      expect(advance).toBe('ADVANCE');
      expect(refund).toBe('REFUND');
    });
  });

  describe('ReceiptCity', () => {
    it('accepts city with all fields', () => {
      const city: ReceiptCity = {
        s_no: 1,
        name: 'Mumbai',
      };

      expect(city.s_no).toBe(1);
      expect(city.name).toBe('Mumbai');
    });

    it('accepts city with partial fields', () => {
      const city: ReceiptCity = {
        name: 'Delhi',
      };

      expect(city.name).toBe('Delhi');
      expect(city.s_no).toBeUndefined();
    });

    it('accepts empty city', () => {
      const city: ReceiptCity = {};

      expect(Object.keys(city)).toHaveLength(0);
    });
  });

  describe('ReceiptState', () => {
    it('accepts state with all fields', () => {
      const state: ReceiptState = {
        s_no: 1,
        name: 'Maharashtra',
      };

      expect(state.s_no).toBe(1);
      expect(state.name).toBe('Maharashtra');
    });

    it('accepts state with partial fields', () => {
      const state: ReceiptState = {
        name: 'Karnataka',
      };

      expect(state.name).toBe('Karnataka');
      expect(state.s_no).toBeUndefined();
    });
  });

  describe('ReceiptPgDetails', () => {
    it('accepts PG details with all fields', () => {
      const pgDetails: ReceiptPgDetails = {
        pgId: 1,
        pgName: 'Happy PG',
        address: '123 Main Street',
        pincode: '400001',
        city: { s_no: 1, name: 'Mumbai' },
        state: { s_no: 1, name: 'Maharashtra' },
      };

      expect(pgDetails.pgId).toBe(1);
      expect(pgDetails.pgName).toBe('Happy PG');
      expect(pgDetails.address).toBe('123 Main Street');
      expect(pgDetails.pincode).toBe('400001');
      expect(pgDetails.city?.name).toBe('Mumbai');
      expect(pgDetails.state?.name).toBe('Maharashtra');
    });

    it('accepts PG details with partial fields', () => {
      const pgDetails: ReceiptPgDetails = {
        pgName: 'Comfort PG',
      };

      expect(pgDetails.pgName).toBe('Comfort PG');
      expect(pgDetails.pgId).toBeUndefined();
    });
  });

  describe('ReceiptData', () => {
    it('accepts complete receipt data', () => {
      const receiptData: ReceiptData = {
        receiptNumber: 'REC-001',
        paymentDate: new Date('2024-01-15'),
        tenantName: 'John Doe',
        tenantPhone: '9876543210',
        pgName: 'Happy PG',
        roomNumber: '101',
        bedNumber: 'A1',
        rentPeriod: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        actualRent: 10000,
        amountPaid: 10000,
        paymentMethod: 'CASH',
        remarks: 'Full payment',
        receiptType: 'RENT',
      };

      expect(receiptData.receiptNumber).toBe('REC-001');
      expect(receiptData.tenantName).toBe('John Doe');
      expect(receiptData.actualRent).toBe(10000);
      expect(receiptData.receiptType).toBe('RENT');
    });

    it('accepts receipt data without optional fields', () => {
      const receiptData: ReceiptData = {
        receiptNumber: 'REC-002',
        paymentDate: new Date('2024-02-15'),
        tenantName: 'Jane Smith',
        tenantPhone: '9876543211',
        pgName: 'Comfort PG',
        roomNumber: '102',
        bedNumber: 'B1',
        rentPeriod: {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-02-28'),
        },
        actualRent: 8000,
        amountPaid: 8000,
        paymentMethod: 'UPI',
      };

      expect(receiptData.receiptNumber).toBe('REC-002');
      expect(receiptData.remarks).toBeUndefined();
      expect(receiptData.receiptType).toBeUndefined();
    });

    it('accepts different receipt types', () => {
      const rentReceipt: ReceiptData = {
        receiptNumber: 'REC-003',
        paymentDate: new Date('2024-03-15'),
        tenantName: 'Bob Johnson',
        tenantPhone: '9876543212',
        pgName: 'Luxury PG',
        roomNumber: '201',
        bedNumber: 'C1',
        rentPeriod: {
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-03-31'),
        },
        actualRent: 15000,
        amountPaid: 15000,
        paymentMethod: 'BANK_TRANSFER',
        receiptType: 'RENT',
      };

      const advanceReceipt: ReceiptData = {
        ...rentReceipt,
        receiptNumber: 'REC-004',
        receiptType: 'ADVANCE',
      };

      const refundReceipt: ReceiptData = {
        ...rentReceipt,
        receiptNumber: 'REC-005',
        receiptType: 'REFUND',
      };

      expect(rentReceipt.receiptType).toBe('RENT');
      expect(advanceReceipt.receiptType).toBe('ADVANCE');
      expect(refundReceipt.receiptType).toBe('REFUND');
    });
  });
});
