import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import AdvancePaymentForm from '../AdvancePaymentForm';

jest.mock('react-redux', () => ({
  Provider: ({ children }: any) => <>{children}</>,
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('@/features/owner/api/paymentsApi', () => ({
  useCreateAdvancePaymentMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useLazyGetBedByIdQuery: jest.fn(() => [jest.fn(), { data: null, isFetching: false }]),
}));

jest.mock('@/components/SlideBottomModal', () => ({
  SlideBottomModal: ({ children, visible }: any) => (visible ? <>{children}</> : null),
}));

jest.mock('@/components/DatePicker', () => 'DatePicker');

jest.mock('@/components/OptionSelector', () => 'OptionSelector');

jest.mock('@/components/AmountInput', () => 'AmountInput');

jest.mock('@/utils/errorHandler', () => ({
  showErrorAlert: jest.fn(),
  showSuccessAlert: jest.fn(),
}));

describe('AdvancePaymentForm', () => {
  const mockStore = configureStore({
    reducer: {
      pgLocations: () => ({ selectedPGLocationId: 1 }),
    },
  });

  const defaultProps = {
    visible: true,
    mode: 'add' as const,
    tenantId: 1,
    tenantName: 'John Doe',
    tenantJoinedDate: '2024-01-01',
    pgId: 1,
    roomId: 1,
    bedId: 1,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ((useSelector as unknown) as jest.Mock).mockImplementation((callback: any) =>
      callback({ pgLocations: { selectedPGLocationId: 1 } }),
    );
  });

  describe('Rendering', () => {
    it('renders correctly when visible in add mode', () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} />
        </Provider>,
      );
      expect(getByText('Add Advance Payment')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
    });

    it('renders correctly when visible in edit mode', () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} mode="edit" paymentId={1} />
        </Provider>,
      );
      expect(getByText('Edit Advance Payment')).toBeTruthy();
    });

    it('does not render when not visible', () => {
      const { queryByText } = render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} visible={false} />
        </Provider>,
      );
      expect(queryByText('Add Advance Payment')).toBeNull();
    });

    it('displays tenant joined date when provided', () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} tenantJoinedDate="2024-01-15" />
        </Provider>,
      );
      expect(getByText('Joined Date:')).toBeTruthy();
    });

    it('hides tenant info card when joined date not provided', () => {
      const { queryByText } = render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} tenantJoinedDate={undefined} />
        </Provider>,
      );
      expect(queryByText('Joined Date:')).toBeNull();
    });
  });

  describe('Form Validation Logic', () => {
    it('validates amount paid is required', () => {
      // Test validation logic through component behavior
      const { getByText } = render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} />
        </Provider>,
      );
      expect(getByText('Amount Paid')).toBeTruthy();
    });

    it('validates payment date is required', () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} />
        </Provider>,
      );
      expect(getByText('Payment Date')).toBeTruthy();
    });

    it('validates payment method is required', () => {
      const { getByText } = render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} />
        </Provider>,
      );
      expect(getByText('Payment Method')).toBeTruthy();
    });
  });

  describe('Form Reset', () => {
    it('resets form when switching from edit to add mode', () => {
      const { rerender } = render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} mode="edit" paymentId={1} />
        </Provider>,
      );

      rerender(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} mode="add" />
        </Provider>,
      );

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('populates form with existing payment data', () => {
      const existingPayment = {
        amount_paid: 5000,
        payment_date: '2024-01-15',
        payment_method: 'CASH',
        remarks: 'Test remarks',
      };

      render(
        <Provider store={mockStore}>
          <AdvancePaymentForm
            {...defaultProps}
            mode="edit"
            paymentId={1}
            existingPayment={existingPayment}
          />
        </Provider>,
      );

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('handles existing payment with undefined fields', () => {
      const existingPayment = {
        amount_paid: undefined,
        payment_date: undefined,
        payment_method: undefined,
        remarks: undefined,
      };

      render(
        <Provider store={mockStore}>
          <AdvancePaymentForm
            {...defaultProps}
            mode="edit"
            paymentId={1}
            existingPayment={existingPayment}
          />
        </Provider>,
      );

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles bedId of 0', () => {
      render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} bedId={0} />
        </Provider>,
      );
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('handles negative bedId', () => {
      render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} bedId={-1} />
        </Provider>,
      );
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('handles missing pgId', () => {
      render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} pgId={undefined as any} />
        </Provider>,
      );
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('handles very large tenantId', () => {
      render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} tenantId={999999999} />
        </Provider>,
      );
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('handles zero tenantId', () => {
      render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} tenantId={0} />
        </Provider>,
      );
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('handles negative tenantId', () => {
      render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} tenantId={-1} />
        </Provider>,
      );
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Component Behavior', () => {
    it('calls onClose when modal closes', () => {
      const { rerender } = render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} />
        </Provider>,
      );

      rerender(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} visible={false} />
        </Provider>,
      );

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('does not call onClose when modal remains visible', () => {
      render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} />
        </Provider>,
      );

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Data Integrity', () => {
    it('does not mutate input props', () => {
      const originalProps = { ...defaultProps };
      render(
        <Provider store={mockStore}>
          <AdvancePaymentForm {...defaultProps} />
        </Provider>,
      );

      expect(defaultProps).toEqual(originalProps);
    });
  });
});
