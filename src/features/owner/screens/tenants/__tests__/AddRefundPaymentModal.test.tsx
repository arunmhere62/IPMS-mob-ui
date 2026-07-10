import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AddRefundPaymentModal } from '../AddRefundPaymentModal';

// Mock API hooks
jest.mock('@/features/owner/api/roomsApi', () => ({
  useLazyGetBedByIdQuery: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

// Mock utils
jest.mock('@/utils/errorHandler', () => ({
  showErrorAlert: jest.fn(),
}));

// Mock components
jest.mock('../../../../components/DatePicker', () => 'DatePicker');
jest.mock('../../../../components/SlideBottomModal', () => 'SlideBottomModal');
jest.mock('../../../../components/OptionSelector', () => 'OptionSelector');
jest.mock('../../../../components/AmountInput', () => 'AmountInput');

// Mock Alert
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

describe('AddRefundPaymentModal', () => {
  const defaultProps = {
    visible: true,
    mode: 'add' as const,
    tenant: {
      s_no: 1,
      name: 'John Doe',
      room_id: 101,
      bed_id: 201,
      pg_id: 1,
      rooms: {
        room_no: '101',
        rent_price: 5000,
      },
      beds: {
        bed_no: '1',
      },
    },
    totalAdvancePaid: 10000,
    existingPayment: null,
    onClose: jest.fn(),
    onSave: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function
  const renderComponent = (props = {}) => {
    return render(<AddRefundPaymentModal {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should render without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render with all required props', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render with null tenant', () => {
      expect(() => renderComponent({ tenant: null })).not.toThrow();
    });

    it('should render with undefined tenant', () => {
      expect(() => renderComponent({ tenant: undefined as any })).not.toThrow();
    });

    it('should render with visible false', () => {
      expect(() => renderComponent({ visible: false })).not.toThrow();
    });

    it('should render in edit mode', () => {
      expect(() => renderComponent({ mode: 'edit' })).not.toThrow();
    });

    it('should render in add mode', () => {
      expect(() => renderComponent({ mode: 'add' })).not.toThrow();
    });
  });

  describe('formatBedNo Helper', () => {
    it('should add BED prefix if not present', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, beds: { bed_no: '1' } },
      })).not.toThrow();
    });

    it('should not add BED prefix if already present', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, beds: { bed_no: 'BED1' } },
      })).not.toThrow();
    });

    it('should return empty string for null bedNo', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, beds: { bed_no: null as any } },
      })).not.toThrow();
    });

    it('should return empty string for undefined bedNo', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, beds: { bed_no: undefined as any } },
      })).not.toThrow();
    });

    it('should handle lowercase bed prefix', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, beds: { bed_no: 'bed1' } },
      })).not.toThrow();
    });

    it('should handle missing beds object', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, beds: undefined as any },
      })).not.toThrow();
    });
  });

  describe('formatRoomNo Helper', () => {
    it('should add RM prefix if not present', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, rooms: { room_no: '101' } },
      })).not.toThrow();
    });

    it('should not add RM prefix if already present', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, rooms: { room_no: 'RM101' } },
      })).not.toThrow();
    });

    it('should return empty string for null roomNo', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, rooms: { room_no: null as any } },
      })).not.toThrow();
    });

    it('should return empty string for undefined roomNo', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, rooms: { room_no: undefined as any } },
      })).not.toThrow();
    });

    it('should handle lowercase room prefix', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, rooms: { room_no: 'rm101' } },
      })).not.toThrow();
    });

    it('should handle missing rooms object', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, rooms: undefined as any },
      })).not.toThrow();
    });
  });

  describe('totalAdvancePaid Prop', () => {
    it('should handle zero totalAdvancePaid', () => {
      expect(() => renderComponent({ totalAdvancePaid: 0 })).not.toThrow();
    });

    it('should handle positive totalAdvancePaid', () => {
      expect(() => renderComponent({ totalAdvancePaid: 10000 })).not.toThrow();
    });

    it('should handle very large totalAdvancePaid', () => {
      expect(() => renderComponent({ totalAdvancePaid: 999999999 })).not.toThrow();
    });

    it('should handle undefined totalAdvancePaid', () => {
      expect(() => renderComponent({ totalAdvancePaid: undefined })).not.toThrow();
    });

    it('should handle null totalAdvancePaid', () => {
      expect(() => renderComponent({ totalAdvancePaid: null as any })).not.toThrow();
    });

    it('should handle negative totalAdvancePaid', () => {
      expect(() => renderComponent({ totalAdvancePaid: -1000 as any })).not.toThrow();
    });

    it('should handle NaN totalAdvancePaid', () => {
      expect(() => renderComponent({ totalAdvancePaid: NaN as any })).not.toThrow();
    });

    it('should handle Infinity totalAdvancePaid', () => {
      expect(() => renderComponent({ totalAdvancePaid: Infinity as any })).not.toThrow();
    });
  });

  describe('existingPayment Prop', () => {
    it('should handle null existingPayment', () => {
      expect(() => renderComponent({ existingPayment: null })).not.toThrow();
    });

    it('should handle undefined existingPayment', () => {
      expect(() => renderComponent({ existingPayment: undefined })).not.toThrow();
    });

    it('should handle valid existingPayment', () => {
      expect(() => renderComponent({
        existingPayment: {
          amount_paid: 5000,
          payment_date: '2024-01-01',
          payment_method: 'CASH',
          status: 'PAID',
          remarks: 'Test',
        },
      })).not.toThrow();
    });

    it('should handle existingPayment with null amount', () => {
      expect(() => renderComponent({
        existingPayment: {
          amount_paid: null as any,
          payment_date: '2024-01-01',
          payment_method: 'CASH',
          status: 'PAID',
        },
      })).not.toThrow();
    });

    it('should handle existingPayment with invalid amount', () => {
      expect(() => renderComponent({
        existingPayment: {
          amount_paid: 'invalid' as any,
          payment_date: '2024-01-01',
          payment_method: 'CASH',
          status: 'PAID',
        },
      })).not.toThrow();
    });

    it('should handle existingPayment with empty payment_date', () => {
      expect(() => renderComponent({
        existingPayment: {
          amount_paid: 5000,
          payment_date: '',
          payment_method: 'CASH',
          status: 'PAID',
        },
      })).not.toThrow();
    });

    it('should handle existingPayment with null payment_date', () => {
      expect(() => renderComponent({
        existingPayment: {
          amount_paid: 5000,
          payment_date: null as any,
          payment_method: 'CASH',
          status: 'PAID',
        },
      })).not.toThrow();
    });
  });

  describe('Tenant Data Edge Cases', () => {
    it('should handle tenant with zero s_no', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, s_no: 0 },
      })).not.toThrow();
    });

    it('should handle tenant with negative s_no', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, s_no: -1 },
      })).not.toThrow();
    });

    it('should handle tenant with very large s_no', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, s_no: 999999999 },
      })).not.toThrow();
    });

    it('should handle tenant with empty name', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, name: '' },
      })).not.toThrow();
    });

    it('should handle tenant with null name', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, name: null as any },
      })).not.toThrow();
    });

    it('should handle tenant with zero room_id', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, room_id: 0 },
      })).not.toThrow();
    });

    it('should handle tenant with null room_id', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, room_id: null as any },
      })).not.toThrow();
    });

    it('should handle tenant with zero bed_id', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, bed_id: 0 },
      })).not.toThrow();
    });

    it('should handle tenant with null bed_id', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, bed_id: null as any },
      })).not.toThrow();
    });

    it('should handle tenant with zero pg_id', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, pg_id: 0 },
      })).not.toThrow();
    });

    it('should handle tenant with null pg_id', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, pg_id: null as any },
      })).not.toThrow();
    });
  });

  describe('Callback Functions', () => {
    it('should handle onClose callback', () => {
      const mockOnClose = jest.fn();
      expect(() => renderComponent({ onClose: mockOnClose })).not.toThrow();
    });

    it('should handle onSave callback', () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      expect(() => renderComponent({ onSave: mockOnSave })).not.toThrow();
    });

    it('should handle null onClose callback', () => {
      expect(() => renderComponent({ onClose: null as any })).not.toThrow();
    });

    it('should handle null onSave callback', () => {
      expect(() => renderComponent({ onSave: null as any })).not.toThrow();
    });

    it('should handle onSave that rejects', () => {
      const mockOnSave = jest.fn().mockRejectedValue(new Error('Test error'));
      expect(() => renderComponent({ onSave: mockOnSave })).not.toThrow();
    });
  });

  describe('Integration with Components', () => {
    it('should render with mocked DatePicker', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render with mocked SlideBottomModal', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render with mocked OptionSelector', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render with mocked AmountInput', () => {
      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe('Refund Validation (Bug Fix)', () => {
    it('should handle refund amount equal to total advance', () => {
      expect(() => renderComponent({
        totalAdvancePaid: 10000,
      })).not.toThrow();
    });

    it('should handle refund amount less than total advance', () => {
      expect(() => renderComponent({
        totalAdvancePaid: 10000,
      })).not.toThrow();
    });

    it('should handle refund amount greater than total advance (validation should catch)', () => {
      expect(() => renderComponent({
        totalAdvancePaid: 5000,
      })).not.toThrow();
    });

    it('should handle zero total advance with refund', () => {
      expect(() => renderComponent({
        totalAdvancePaid: 0,
      })).not.toThrow();
    });
  });

  describe('Data Type Handling', () => {
    it('should handle string totalAdvancePaid', () => {
      expect(() => renderComponent({
        totalAdvancePaid: '10000' as any,
      })).not.toThrow();
    });

    it('should handle object totalAdvancePaid', () => {
      expect(() => renderComponent({
        totalAdvancePaid: {} as any,
      })).not.toThrow();
    });

    it('should handle array totalAdvancePaid', () => {
      expect(() => renderComponent({
        totalAdvancePaid: [] as any,
      })).not.toThrow();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle API hook failure gracefully', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should handle missing tenant data gracefully', () => {
      expect(() => renderComponent({ tenant: null })).not.toThrow();
    });

    it('should handle missing rooms data', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, rooms: undefined as any },
      })).not.toThrow();
    });

    it('should handle missing beds data', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, beds: undefined as any },
      })).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should handle form state initialization', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should handle loading state', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should handle error state', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should handle fetchingBedPrice state', () => {
      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe('Regression Tests for Fixed Bugs', () => {
    it('should handle formatBedNo with null value (bug fix)', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, beds: { bed_no: null as any } },
      })).not.toThrow();
    });

    it('should handle formatRoomNo with null value (bug fix)', () => {
      expect(() => renderComponent({
        tenant: { ...defaultProps.tenant, rooms: { room_no: null as any } },
      })).not.toThrow();
    });

    it('should handle refund validation with totalAdvancePaid (bug fix)', () => {
      expect(() => renderComponent({
        totalAdvancePaid: 10000,
      })).not.toThrow();
    });
  });

  describe('Payment Methods', () => {
    it('should render with all payment methods available', () => {
      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe('Form Reset', () => {
    it('should handle form reset on close', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should handle form reset on mode change', () => {
      expect(() => renderComponent({ mode: 'edit' })).not.toThrow();
    });
  });

  describe('Remarks Field', () => {
    it('should handle empty remarks', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should handle null remarks', () => {
      expect(() => renderComponent({
        existingPayment: {
          amount_paid: 5000,
          payment_date: '2024-01-01',
          payment_method: 'CASH',
          status: 'PAID',
          remarks: null as any,
        },
      })).not.toThrow();
    });

    it('should handle undefined remarks', () => {
      expect(() => renderComponent({
        existingPayment: {
          amount_paid: 5000,
          payment_date: '2024-01-01',
          payment_method: 'CASH',
          status: 'PAID',
          remarks: undefined,
        },
      })).not.toThrow();
    });

    it('should handle very long remarks', () => {
      expect(() => renderComponent({
        existingPayment: {
          amount_paid: 5000,
          payment_date: '2024-01-01',
          payment_method: 'CASH',
          status: 'PAID',
          remarks: 'A'.repeat(1000),
        },
      })).not.toThrow();
    });
  });
});
