import { baseApi } from './baseApi';
import type { User } from '../../types';

type ApiEnvelope<T> = {
  data?: T;
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
  }),
  overrideExisting: false,
});

export const { useSendOtpMutation, useVerifyOtpMutation, useResendOtpMutation } = authApi;
