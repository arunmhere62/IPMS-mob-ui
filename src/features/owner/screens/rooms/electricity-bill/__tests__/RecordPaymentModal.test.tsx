import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecordPaymentModal } from '../RecordPaymentModal';

jest.mock('@/features/owner/api/electricityBillApi', () => ({
  useRecordElectricityBillPaymentMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

jest.mock('@/components/SlideBottomModal', () => ({
  SlideBottomModal: ({ children, visible }: any) => (visible ? <>{children}</> : null),
}));
jest.mock('@/components/DatePicker', () => ({
  DatePicker: () => null,
}));
jest.mock('@/components/OptionSelector', () => ({
  OptionSelector: () => null,
}));
jest.mock('@/utils/errorHandler', () => ({
  showErrorAlert: jest.fn(),
  showSuccessAlert: jest.fn(),
}));

describe('RecordPaymentModal', () => {
  const mockItem = {
    s_no: 1,
    electricity_bill_id: 1,
    tenant_id: 1,
    share_amount: 1000,
    share_percentage: 100,
    paid_amount: 500,
    status: 'PARTIAL' as const,
    allocation_basis: 'EQUAL' as const,
    billing_days: null,
    payment_date: null,
    payment_method: null,
    created_at: '2026-07-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
    tenants: { s_no: 1, tenant_id: 'T001', name: 'John Doe' },
  };

  const defaultProps = {
    visible: true,
    item: mockItem,
    billId: 1,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible with item', () => {
    const { getByText } = render(<RecordPaymentModal {...defaultProps} />);
    expect(getByText('Total Share')).toBeTruthy();
  });

  it('does not render when item is null', () => {
    const { queryByText } = render(<RecordPaymentModal {...defaultProps} item={null} />);
    expect(queryByText('John Doe')).toBeNull();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(<RecordPaymentModal {...defaultProps} visible={false} />);
    expect(queryByText('John Doe')).toBeNull();
  });
});
