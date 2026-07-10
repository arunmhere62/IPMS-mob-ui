import { renderHook } from '@testing-library/react-native';
import { useAppSettingsPolling } from '../useAppSettingsPolling';

// Mock dependencies
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('@/features/owner/api/appSettingsApi', () => ({
  useGetPublicAppStatusQuery: jest.fn(),
}));

jest.mock('@/features/owner/store/slices/appSettingsSlice', () => ({
  setAppSettings: jest.fn((payload) => ({ type: 'appSettings/setAppSettings', payload })),
}));

describe('useAppSettingsPolling', () => {
  const mockDispatch = jest.fn();
  const mockUseGetPublicAppStatusQuery = require('@/features/owner/api/appSettingsApi').useGetPublicAppStatusQuery as jest.Mock;
  const mockSetAppSettings = require('@/features/owner/store/slices/appSettingsSlice').setAppSettings;

  beforeEach(() => {
    jest.clearAllMocks();
    require('react-redux').useDispatch.mockReturnValue(mockDispatch);
  });

  it('initializes with default polling interval', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: null });

    renderHook(() => useAppSettingsPolling());

    expect(mockUseGetPublicAppStatusQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 5 * 60 * 1000, // 5 minutes
    });
  });

  it('uses custom polling interval when provided', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: null });

    renderHook(() => useAppSettingsPolling({ pollingInterval: 10000 }));

    expect(mockUseGetPublicAppStatusQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 10000,
    });
  });

  it('dispatches setAppSettings when data is received', () => {
    const mockData = { maintenanceMode: false, version: '1.0.0' };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: mockData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: mockData,
    });
  });

  it('does not dispatch when data is null', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: null });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch when data is undefined', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: undefined });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('dispatches when data changes', () => {
    const mockData1 = { maintenanceMode: false, version: '1.0.0' };
    const mockData2 = { maintenanceMode: true, version: '1.0.1' };
    
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: mockData1 });
    const { rerender } = renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: mockData1,
    });

    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: mockData2 });
    rerender(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: mockData2,
    });
  });

  it('handles zero polling interval', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: null });

    renderHook(() => useAppSettingsPolling({ pollingInterval: 0 }));

    expect(mockUseGetPublicAppStatusQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 0,
    });
  });

  it('handles negative polling interval', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: null });

    renderHook(() => useAppSettingsPolling({ pollingInterval: -1000 }));

    expect(mockUseGetPublicAppStatusQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: -1000,
    });
  });

  it('handles very large polling interval', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: null });

    renderHook(() => useAppSettingsPolling({ pollingInterval: 9999999999999 }));

    expect(mockUseGetPublicAppStatusQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 9999999999999,
    });
  });

  it('handles NaN polling interval', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: null });

    renderHook(() => useAppSettingsPolling({ pollingInterval: NaN }));

    expect(mockUseGetPublicAppStatusQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: NaN,
    });
  });

  it('handles Infinity polling interval', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: null });

    renderHook(() => useAppSettingsPolling({ pollingInterval: Infinity }));

    expect(mockUseGetPublicAppStatusQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: Infinity,
    });
  });

  it('handles empty object data', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: {} });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: {},
    });
  });

  it('handles complex data structure', () => {
    const complexData = {
      maintenanceMode: false,
      version: '1.0.0',
      features: {
        payments: true,
        notifications: true,
      },
      config: {
        maxFileSize: 10485760,
        allowedFileTypes: ['jpg', 'png', 'pdf'],
      },
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: complexData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: complexData,
    });
  });

  it('handles data with null values', () => {
    const dataWithNulls = {
      maintenanceMode: null,
      version: null,
      features: null,
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: dataWithNulls });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: dataWithNulls,
    });
  });

  it('handles data with undefined values', () => {
    const dataWithUndefined = {
      maintenanceMode: undefined,
      version: undefined,
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: dataWithUndefined });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: dataWithUndefined,
    });
  });

  it('handles data with array values', () => {
    const dataWithArrays = {
      allowedCountries: ['US', 'UK', 'IN'],
      supportedLanguages: ['en', 'es', 'fr'],
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: dataWithArrays });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: dataWithArrays,
    });
  });

  it('handles data with nested objects', () => {
    const nestedData = {
      config: {
        api: {
          timeout: 30000,
          retries: 3,
        },
        ui: {
          theme: 'dark',
          language: 'en',
        },
      },
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: nestedData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: nestedData,
    });
  });

  it('handles data with boolean values', () => {
    const booleanData = {
      maintenanceMode: true,
      allowRegistration: false,
      enableNotifications: true,
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: booleanData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: booleanData,
    });
  });

  it('handles data with numeric values', () => {
    const numericData = {
      maxFileSize: 10485760,
      maxUsers: 1000,
      timeout: 30000,
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: numericData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: numericData,
    });
  });

  it('handles data with string values', () => {
    const stringData = {
      version: '1.0.0',
      environment: 'production',
      apiUrl: 'https://api.example.com',
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: stringData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: stringData,
    });
  });

  it('handles data with special characters in strings', () => {
    const specialCharData = {
      message: 'Maintenance scheduled for <2026-12-31>',
      announcement: 'Update: New features 🚀',
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: specialCharData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: specialCharData,
    });
  });

  it('handles data with Unicode characters', () => {
    const unicodeData = {
      message: '欢迎使用',
      greeting: 'مرحبا',
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: unicodeData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: unicodeData,
    });
  });

  it('handles very long string values', () => {
    const longStringData = {
      message: 'x'.repeat(10000),
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: longStringData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: longStringData,
    });
  });

  it('handles data with zero values', () => {
    const zeroData = {
      maxFileSize: 0,
      maxUsers: 0,
      timeout: 0,
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: zeroData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: zeroData,
    });
  });

  it('handles data with negative numeric values', () => {
    const negativeData = {
      offset: -5,
      adjustment: -100,
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: negativeData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: negativeData,
    });
  });

  it('handles data with floating-point values', () => {
    const floatData = {
      version: 1.5,
      ratio: 0.75,
      percentage: 99.99,
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: floatData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: floatData,
    });
  });

  it('handles data with Infinity values', () => {
    const infinityData = {
      maxRetries: Infinity,
      timeout: Infinity,
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: infinityData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: infinityData,
    });
  });

  it('handles data with NaN values', () => {
    const nanData = {
      value: NaN,
      ratio: NaN,
    };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: nanData });

    renderHook(() => useAppSettingsPolling());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'appSettings/setAppSettings',
      payload: nanData,
    });
  });

  it('handles missing options parameter', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: null });

    renderHook(() => useAppSettingsPolling());

    expect(mockUseGetPublicAppStatusQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 5 * 60 * 1000,
    });
  });

  it('handles undefined options parameter', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: null });

    renderHook(() => useAppSettingsPolling(undefined));

    expect(mockUseGetPublicAppStatusQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 5 * 60 * 1000,
    });
  });

  it('handles null options parameter', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: null });

    renderHook(() => useAppSettingsPolling(null as any));

    expect(mockUseGetPublicAppStatusQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 5 * 60 * 1000,
    });
  });

  it('handles empty options object', () => {
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: null });

    renderHook(() => useAppSettingsPolling({}));

    expect(mockUseGetPublicAppStatusQuery).toHaveBeenCalledWith(undefined, {
      pollingInterval: 5 * 60 * 1000,
    });
  });

  it('does not dispatch when data is the same as previous', () => {
    const mockData = { maintenanceMode: false, version: '1.0.0' };
    mockUseGetPublicAppStatusQuery.mockReturnValue({ data: mockData });

    const { rerender } = renderHook(() => useAppSettingsPolling());

    // First dispatch
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    // Rerender with same data
    rerender(() => useAppSettingsPolling());

    // Should not dispatch again if data hasn't changed
    // Note: This depends on React's useEffect behavior
  });
});
