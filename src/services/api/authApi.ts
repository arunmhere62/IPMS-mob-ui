import { baseApi } from './baseApi';
import type { User } from '../../types';

type ApiEnvelope<T> = {
  data?: T;
};

type CentralEnvelope<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
};

const unwrapCentralData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'success' in response && 'statusCode' in response) {
    return (response as any).data as T;
  }
  return response as T;
};

const unwrapApiOrCentralData = <T>(response: any): T => {
  const central = unwrapCentralData<T>(response);
  if (central && typeof central === 'object' && 'data' in (central as any)) {
    return ((central as any).data ?? central) as T;
  }
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as any).data as T;
  }
  return response as T;
};

export type SendOtpRequest = {
  phone: string;
};

export type SendOtpResponse = unknown;

export type VerifyOtpRequest = {
  phone: string;
  otp: string;
};

export type VerifyOtpResponse = {
  user: User;
  accessToken: string;
  refreshToken?: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken?: string;
};

type VerifyOtpRawResponse = {
  user: User;
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
};

export type ResendOtpRequest = {
  phone: string;
};

export type ResendOtpResponse = unknown;

export type SendSignupOtpRequest = {
  phone: string;
};

export type SendSignupOtpResponse = unknown;

export type VerifySignupOtpRequest = {
  phone: string;
  otp: string;
};

export type VerifySignupOtpResponse = unknown;

export type SignupRequest = {
  organizationName: string;
  name: string;
  pgName: string;
  phone?: string;
  rentCycleType?: string;
  rentCycleStart?: number | null;
  rentCycleEnd?: number | null;
};

export type SignupResponse = unknown;

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    sendOtp: build.mutation<SendOtpResponse, SendOtpRequest>({
      query: (body) => ({
        url: '/auth/send-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: CentralEnvelope<SendOtpResponse> | ApiEnvelope<SendOtpResponse> | any) => response,
    }),

    verifyOtp: build.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: (body) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: CentralEnvelope<VerifyOtpRawResponse> | ApiEnvelope<VerifyOtpRawResponse> | VerifyOtpRawResponse | any) => {
        const r = unwrapApiOrCentralData<VerifyOtpRawResponse>(response);
        return {
          user: (r as any).user,
          accessToken: (r as any).accessToken ?? (r as any).access_token,
          refreshToken: (r as any).refreshToken ?? (r as any).refresh_token,
        };
      },
    }),

    refreshToken: build.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
      transformResponse: (response: CentralEnvelope<any> | ApiEnvelope<any> | any) => {
        const r = unwrapApiOrCentralData<any>(response);
        return {
          accessToken: (r as any).accessToken ?? (r as any).access_token,
          refreshToken: (r as any).refreshToken ?? (r as any).refresh_token,
        };
      },
    }),

    logout: build.mutation<unknown, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      transformResponse: (response: CentralEnvelope<any> | ApiEnvelope<any> | any) => response,
    }),

    resendOtp: build.mutation<ResendOtpResponse, ResendOtpRequest>({
      query: (body) => ({
        url: '/auth/resend-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: CentralEnvelope<ResendOtpResponse> | ApiEnvelope<ResendOtpResponse> | any) => response,
    }),

    sendSignupOtp: build.mutation<SendSignupOtpResponse, SendSignupOtpRequest>({
      query: (body) => ({
        url: '/auth/send-signup-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: CentralEnvelope<SendSignupOtpResponse> | any) => unwrapCentralData<any>(response),
    }),

    verifySignupOtp: build.mutation<VerifySignupOtpResponse, VerifySignupOtpRequest>({
      query: (body) => ({
        url: '/auth/verify-signup-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: CentralEnvelope<VerifySignupOtpResponse> | any) => unwrapCentralData<any>(response),
    }),

    signup: build.mutation<SignupResponse, SignupRequest>({
      query: (body) => ({
        url: '/auth/signup',
        method: 'POST',
        body,
      }),
      transformResponse: (response: CentralEnvelope<SignupResponse> | any) => {
        const data = unwrapCentralData<any>(response);
        if (response && typeof response === 'object') {
          return {
            ...data,
            message: (response as any).message,
            success: (response as any).success,
            statusCode: (response as any).statusCode,
          };
        }
        return data;
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useSendSignupOtpMutation,
  useVerifySignupOtpMutation,
  useSignupMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
} = authApi;
