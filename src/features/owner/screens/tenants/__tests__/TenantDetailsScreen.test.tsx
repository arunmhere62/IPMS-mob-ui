import React from 'react';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { TenantDetailsScreen } from '../TenantDetailsScreen';

jest.mock('react-redux', () => ({
  Provider: ({ children }: any) => <>{children}</>,
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    setParams: jest.fn(),
    getState: () => ({ routes: [{ params: {} }], index: 0 }),
  }),
  useRoute: () => ({
    params: { tenantId: 1 },
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-navigation/native-stack', () => ({
  createStackNavigator: jest.fn(),
}));

jest.mock('@/features/owner/api/tenantsApi', () => ({
  useGetTenantByIdQuery: jest.fn(() => ({ data: null, isLoading: false, refetch: jest.fn() })),
  useLazyGetTenantsQuery: jest.fn(() => [jest.fn(), { data: null }]),
  useDeleteTenantMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useCheckoutTenantWithDateMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useUpdateTenantCheckoutDateMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useTransferTenantMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useUpdateTenantMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
}));

jest.mock('@/features/owner/api/paymentsApi', () => ({
  useCreateAdvancePaymentMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useUpdateAdvancePaymentMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useDeleteAdvancePaymentMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useCreateRefundPaymentMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useUpdateRefundPaymentMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useDeleteRefundPaymentMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useCreateTenantPaymentMutation: jest.fn(() => [jest.fn(), { isLoading: false }]),
  useLazyDetectPaymentGapsQuery: jest.fn(() => [jest.fn(), { data: null }]),
}));

jest.mock('@/features/owner/api/roomsApi', () => ({
  useGetAllBedsQuery: jest.fn(() => ({ data: null, isFetching: false })),
  useGetAllRoomsQuery: jest.fn(() => ({ data: null, isFetching: false })),
  useLazyGetBedByIdQuery: jest.fn(() => [jest.fn(), { data: null }]),
}));

jest.mock('@/features/owner/api/pgLocationsApi', () => ({
  useGetPGLocationsQuery: jest.fn(() => ({ data: null })),
  useGetPGLocationDetailsQuery: jest.fn(() => ({ data: null })),
}));

jest.mock('@/context/OnboardingTourContext', () => ({
  useOnboardingTour: jest.fn(() => ({ tourStep: null, endTour: jest.fn() })),
}));

jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: jest.fn(() => ({
    can: jest.fn(() => true),
  })),
}));

jest.mock('@/services/receipt/compactReceiptGenerator', () => ({
  CompactReceiptGenerator: {
    ReceiptComponent: jest.fn(),
    shareViaWhatsApp: jest.fn(),
    shareImage: jest.fn(),
  },
}));

jest.mock('@/utils/errorHandler', () => ({
  showErrorAlert: jest.fn(),
  showSuccessAlert: jest.fn(),
}));

jest.mock('../components', () => ({
  TenantHeader: () => null,
  PendingPaymentAlert: () => null,
  AccommodationDetails: () => null,
  PersonalInformation: () => null,
  ImageViewerModal: () => null,
  ReceiptViewModal: () => null,
}));

jest.mock('../RentPaymentForm', () => 'RentPaymentForm');
jest.mock('../AddRefundPaymentForm', () => 'AddRefundPaymentForm');
jest.mock('../CheckoutTenantForm', () => 'CheckoutTenantForm');
jest.mock('../AdvancePaymentForm', () => 'AdvancePaymentForm');
jest.mock('../../../../components/EditRefundPaymentForm', () => 'EditRefundPaymentForm');

describe('TenantDetailsScreen', () => {
  const mockStore = configureStore({
    reducer: {
      pgLocations: () => ({ selectedPGLocationId: 1 }),
      auth: () => ({ user: { id: 1 } }),
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    ((useSelector as unknown) as jest.Mock).mockImplementation((callback: any) =>
      callback({
        pgLocations: { selectedPGLocationId: 1 },
        auth: { user: { id: 1 } },
      }),
    );
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles null tenant data gracefully', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: null,
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles loading state', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: null,
        isLoading: true,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined selectedPGLocationId', () => {
      ((useSelector as unknown) as jest.Mock).mockImplementation((callback: any) =>
        callback({
          pgLocations: { selectedPGLocationId: undefined },
          auth: { user: { id: 1 } },
        }),
      );

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles null selectedPGLocationId', () => {
      ((useSelector as unknown) as jest.Mock).mockImplementation((callback: any) =>
        callback({
          pgLocations: { selectedPGLocationId: null },
          auth: { user: { id: 1 } },
        }),
      );

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles zero tenantId from route params', () => {
      const { useRoute } = require('@react-navigation/native');
      useRoute.mockReturnValue({ params: { tenantId: 0 } });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles negative tenantId from route params', () => {
      const { useRoute } = require('@react-navigation/native');
      useRoute.mockReturnValue({ params: { tenantId: -1 } });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles missing tenantId from route params', () => {
      const { useRoute } = require('@react-navigation/native');
      useRoute.mockReturnValue({ params: {} });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles very large tenantId', () => {
      const { useRoute } = require('@react-navigation/native');
      useRoute.mockReturnValue({ params: { tenantId: 999999999 } });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });
  });

  describe('API Error Handling', () => {
    it('handles tenant query error', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error('API Error'),
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles payment gaps detection error', () => {
      const { useLazyDetectPaymentGapsQuery } = require('@/features/owner/api/paymentsApi');
      useLazyDetectPaymentGapsQuery.mockReturnValue([
        jest.fn().mockRejectedValue(new Error('API Error')),
        { data: null },
      ]);

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles PG locations query error', () => {
      const { useGetPGLocationsQuery } = require('@/features/owner/api/pgLocationsApi');
      useGetPGLocationsQuery.mockReturnValue({
        data: null,
        isError: true,
        error: new Error('API Error'),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles rooms query error during transfer', () => {
      const { useGetAllRoomsQuery } = require('@/features/owner/api/roomsApi');
      useGetAllRoomsQuery.mockReturnValue({
        data: null,
        isFetching: false,
        isError: true,
        error: new Error('API Error'),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles beds query error during transfer', () => {
      const { useGetAllBedsQuery } = require('@/features/owner/api/roomsApi');
      useGetAllBedsQuery.mockReturnValue({
        data: null,
        isFetching: false,
        isError: true,
        error: new Error('API Error'),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });
  });

  describe('Data Integrity', () => {
    it('does not crash with malformed tenant data', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: null,
          phone_no: undefined,
          check_in_date: 'invalid-date',
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles tenant with empty allocations array', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          tenant_allocations: [],
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles tenant with null allocations', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          tenant_allocations: null,
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles tenant with undefined allocations', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          tenant_allocations: undefined,
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });
  });

  describe('Permission Handling', () => {
    it('handles permission denied scenarios', () => {
      const { usePermissions } = require('@/hooks/usePermissions');
      usePermissions.mockReturnValue({
        can: jest.fn(() => false),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles permission check errors', () => {
      const { usePermissions } = require('@/hooks/usePermissions');
      usePermissions.mockReturnValue({
        can: jest.fn(() => {
          throw new Error('Permission check failed');
        }),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });
  });

  describe('Navigation Handling', () => {
    it('handles navigation state with null routes', () => {
      const { useNavigation } = require('@react-navigation/native');
      useNavigation.mockReturnValue({
        navigate: jest.fn(),
        goBack: jest.fn(),
        addListener: jest.fn(() => jest.fn()),
        setParams: jest.fn(),
        getState: () => ({ routes: null, index: 0 }),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles navigation state with undefined routes', () => {
      const { useNavigation } = require('@react-navigation/native');
      useNavigation.mockReturnValue({
        navigate: jest.fn(),
        goBack: jest.fn(),
        addListener: jest.fn(() => jest.fn()),
        setParams: jest.fn(),
        getState: () => ({ routes: undefined, index: 0 }),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles navigation with negative index', () => {
      const { useNavigation } = require('@react-navigation/native');
      useNavigation.mockReturnValue({
        navigate: jest.fn(),
        goBack: jest.fn(),
        addListener: jest.fn(() => jest.fn()),
        setParams: jest.fn(),
        getState: () => ({ routes: [{}], index: -1 }),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });
  });

  describe('Transfer Difference Handling', () => {
    it('handles transfer difference cycle with null values', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          transfer_difference_due_cycle: null,
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles transfer difference cycle with undefined values', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          transfer_difference_due_cycle: undefined,
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles transfer difference cycle with zero remaining due', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          transfer_difference_due_cycle: {
            remainingDue: 0,
            due: 0,
            cycle_id: 1,
          },
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles transfer difference cycle with negative values', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          transfer_difference_due_cycle: {
            remainingDue: -100,
            due: -50,
            cycle_id: 1,
          },
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles transfer difference cycle with very large values', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          transfer_difference_due_cycle: {
            remainingDue: 999999999,
            due: 999999999,
            cycle_id: 999999,
          },
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });
  });

  describe('Receipt Generation', () => {
    it('handles receipt generation with null tenant data', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: null,
          phone_no: null,
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles receipt generation with undefined PG details', () => {
      const { useGetPGLocationDetailsQuery } = require('@/features/owner/api/pgLocationsApi');
      useGetPGLocationDetailsQuery.mockReturnValue({
        data: undefined,
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles receipt generation with null PG details', () => {
      const { useGetPGLocationDetailsQuery } = require('@/features/owner/api/pgLocationsApi');
      useGetPGLocationDetailsQuery.mockReturnValue({
        data: null,
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    it('handles unmount gracefully', () => {
      const { unmount } = render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      );

      expect(() => unmount()).not.toThrow();
    });

    it('handles rapid remounting', () => {
      const { unmount, rerender } = render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      );

      expect(() => {
        rerender(
          <Provider store={mockStore}>
            <TenantDetailsScreen />
          </Provider>,
        );
        unmount();
      }).not.toThrow();
    });
  });

  describe('Date Handling', () => {
    it('handles invalid date strings in tenant data', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          check_in_date: 'not-a-date',
          check_out_date: 'also-not-a-date',
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles null date values in tenant data', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          check_in_date: null,
          check_out_date: null,
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles leap year dates in tenant data', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          check_in_date: '2024-02-29',
          check_out_date: '2024-03-01',
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });
  });

  describe('Payment Data Handling', () => {
    it('handles empty payments array', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          payments: [],
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles null payments array', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          payments: null,
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });

    it('handles payments with missing cycle data', () => {
      const { useGetTenantByIdQuery } = require('@/features/owner/api/tenantsApi');
      useGetTenantByIdQuery.mockReturnValue({
        data: {
          s_no: 1,
          name: 'Test Tenant',
          payments: [
            {
              s_no: 1,
              amount_paid: 1000,
              tenant_rent_cycles: null,
            },
          ],
        },
        isLoading: false,
        refetch: jest.fn(),
      });

      expect(() => render(
        <Provider store={mockStore}>
          <TenantDetailsScreen />
        </Provider>,
      )).not.toThrow();
    });
  });
});
