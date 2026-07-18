import { baseApi } from '../../owner/api/baseApi';

// Types for Tenant Portal Auth
export type TenantSendOtpRequest = {
  phone: string;
};

export type TenantSendOtpResponse = {
  success: boolean;
  message: string;
  data: {
    phone: string;
    expiresIn: number;
  };
};

export type TenantVerifyOtpRequest = {
  phone: string;
  otp: string;
};

export type TenantPG = {
  pg_id: number;
  location_name: string;
  address: string;
};

export type TenantUser = {
  tenant_id: number;
  name: string;
  phone: string;
  email: string | null;
  status: string;
};

// Central envelope from Interceptor
interface CentralEnvelope<T> {
  statusCode: number;
  message: string;
  success: boolean;
  timestamp: string;
  path: string;
  data: T;
}

// ResponseUtil wrapper
interface ResponseUtilWrapper<T> {
  success: boolean;
  message: string;
  data: T;
}

// Actual OTP response data
interface TenantVerifyOtpData {
  accessToken: string;
  refreshToken: string;
  tenant: {
    tenant_id: number;
    name: string;
    phone: string;
    email: string | null;
    status: string;
    organization_id: number | null;
    pg_id: number | null;
  };
  pg: {
    pg_id: number;
    location_name: string;
    address: string;
  } | null;
}

// Full response: CentralEnvelope -> ResponseUtilWrapper -> TenantVerifyOtpData
export type TenantVerifyOtpResponse = CentralEnvelope<ResponseUtilWrapper<TenantVerifyOtpData>>;;

export type TenantRefreshTokenRequest = {
  refreshToken: string;
};

export type TenantRefreshTokenResponse = {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
};

export type TenantLogoutResponse = {
  success: boolean;
  message: string;
  data: {
    message: string;
  };
};

// Unwrap helper for central envelope format
const unwrapCentralData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
    return (response as any).data as T;
  }
  return response as T;
};

export const tenantPortalAuthApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Send OTP to tenant phone
    tenantSendOtp: build.mutation<TenantSendOtpResponse, TenantSendOtpRequest>({
      query: (body) => ({
        url: '/tenant-auth/send-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => {
        return response;
      },
    }),

    // Verify OTP and login
    tenantVerifyOtp: build.mutation<TenantVerifyOtpResponse, TenantVerifyOtpRequest>({
      query: (body) => ({
        url: '/tenant-auth/verify-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => {
        return response;
      },
    }),

    // Refresh token
    tenantRefreshToken: build.mutation<TenantRefreshTokenResponse, TenantRefreshTokenRequest>({
      query: (body) => ({
        url: '/tenant-auth/refresh',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => {
        return response;
      },
    }),

    // Logout
    tenantLogout: build.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/tenant-auth/logout',
        method: 'POST',
      }),
      transformResponse: (response: any) => {
        return response;
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useTenantSendOtpMutation,
  useTenantVerifyOtpMutation,
  useTenantRefreshTokenMutation,
  useTenantLogoutMutation,
} = tenantPortalAuthApi;
