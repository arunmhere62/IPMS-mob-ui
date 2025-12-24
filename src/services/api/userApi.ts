import { baseApi } from './baseApi';
import type { User } from '../../types';
import type { UpdateUserDto } from '../userService';

type ApiEnvelope<T> = {
  data?: T;
};

export type UsersListResponse = {
  success: boolean;
  data: User[];
};

export type UserProfileResponse = {
  success: boolean;
  data: User;
  message?: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResponse = {
  success: boolean;
  message?: string;
};

export const userApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getUsers: build.query<UsersListResponse, void>({
      query: () => ({ url: '/auth/users', method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any): UsersListResponse => {
        const payload = (response as any)?.data ?? response;
        const extracted = payload?.data ?? payload;
        const items = Array.isArray(extracted) ? extracted : extracted?.data;
        return {
          success: Boolean((response as any)?.success ?? true),
          data: Array.isArray(items) ? items : [],
        };
      },
      providesTags: (result) => {
        const users = result?.data || [];
        return [
          { type: 'Users' as const, id: 'LIST' },
          ...users.map((u) => ({ type: 'User' as const, id: u.s_no })),
        ];
      },
    }),

    getUserProfile: build.query<UserProfileResponse, number>({
      query: (userId) => ({ url: `/auth/profile/${userId}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      providesTags: (_res, _err, userId) => [{ type: 'User' as const, id: userId }],
    }),

    updateUserProfile: build.mutation<UserProfileResponse, { userId: number; data: UpdateUserDto }>({
      query: ({ userId, data }) => ({ url: `/auth/profile/${userId}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Users' as const, id: 'LIST' },
        { type: 'User' as const, id: arg.userId },
      ],
    }),

    changePassword: build.mutation<ChangePasswordResponse, { userId: number; data: ChangePasswordRequest }>({
      query: ({ userId, data }) => ({ url: `/auth/change-password/${userId}`, method: 'POST', body: data }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUsersQuery,
  useLazyGetUsersQuery,
  useGetUserProfileQuery,
  useLazyGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useChangePasswordMutation,
} = userApi;
