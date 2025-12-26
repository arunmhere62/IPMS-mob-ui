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
  email: string;
  password: string;
  pgName: string;
  pgAddress: string;
  stateId: number;
  cityId: number;
  phone?: string;
  pgPincode?: string;
  rentCycleType?: string;
  rentCycleStart?: number | null;
  rentCycleEnd?: number | null;
  pgType?: string;
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
      transformResponse: (response: ApiEnvelope<SendOtpResponse> | SendOtpResponse) =>
        (response as ApiEnvelope<SendOtpResponse>)?.data ?? response,
    }),

    verifyOtp: build.mutation<VerifyOtpResponse, VerifyOtpRequest>({
      query: (body) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiEnvelope<VerifyOtpRawResponse> | VerifyOtpRawResponse | any) => {
        const r = (response as ApiEnvelope<VerifyOtpRawResponse>)?.data ?? (response as VerifyOtpRawResponse);
        return {
          user: r.user,
          accessToken: (r as any).accessToken ?? r.access_token,
          refreshToken: (r as any).refreshToken ?? r.refresh_token,
        };
      },
    }),

    resendOtp: build.mutation<ResendOtpResponse, ResendOtpRequest>({
      query: (body) => ({
        url: '/auth/resend-otp',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiEnvelope<ResendOtpResponse> | ResendOtpResponse) =>
        (response as ApiEnvelope<ResendOtpResponse>)?.data ?? response,
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
      transformResponse: (response: CentralEnvelope<SignupResponse> | any) => unwrapCentralData<any>(response),
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
} = authApi;
