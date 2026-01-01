import { baseApi } from './baseApi';
import type { PGLocation } from '../../types';

type ApiEnvelope<T> = {
  data?: T;
};

type BackendEnvelope<T> = {
  statusCode?: number;
  message?: string;
  success: boolean;
  timestamp?: string;
  data: T;
};

export type GetPGLocationsResponse = BackendEnvelope<PGLocation[]>;

export type PGLocationsMutationResponse = {
  success: boolean;
  data: any;
  message?: string;
};

export type GetPGLocationsParams = {
  _t?: number;
};

export type GetPGLocationDetailsResponse = {
  success: boolean;
  data: any;
  message?: string;
};

const unwrapCentralData = <T>(response: any): T => {
  if (response && typeof response === 'object' && 'success' in response && 'statusCode' in response) {
    return (response as any).data as T;
  }
  return response as T;
};

const normalizeEntityResponse = <T>(response: any): { success: boolean; data: T; message?: string } => {
  // If already in legacy shape {success,data,message}, keep it
  if (response && typeof response === 'object' && 'success' in response && 'data' in response && !('statusCode' in response)) {
    return response as any;
  }

  const unwrapped = unwrapCentralData<T>(response);
  return {
    success: (response as any)?.success ?? true,
    data: unwrapped,
    message: (response as any)?.message,
  };
};

export const pgLocationsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPGLocations: build.query<GetPGLocationsResponse, GetPGLocationsParams | void>({
      query: (params) => ({
        url: '/pg-locations',
        method: 'GET',
        params: params ?? undefined,
      }),
      keepUnusedDataFor: 300,
      transformResponse: (response: ApiEnvelope<GetPGLocationsResponse> | GetPGLocationsResponse | any) => {
        // Backend returns an envelope: { statusCode, success, message, timestamp, data: PGLocation[] }
        // Sometimes responses may already be nested under a `data` key due to upstream wrappers.
        const maybeNested = (response as ApiEnvelope<GetPGLocationsResponse>)?.data;
        const r = maybeNested ?? response;
        return r as GetPGLocationsResponse;
      },
      providesTags: (result) => {
        const items = (result as any)?.data || [];
        return [
          { type: 'PGLocations' as const, id: 'LIST' },
          ...items.map((l: PGLocation) => ({ type: 'PGLocation' as const, id: l.s_no })),
        ];
      },
    }),

    createPGLocation: build.mutation<PGLocationsMutationResponse, Partial<PGLocation>>({
      query: (body) => ({ url: '/pg-locations', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<PGLocationsMutationResponse> | any) => normalizeEntityResponse<any>(response),
      invalidatesTags: [{ type: 'PGLocations', id: 'LIST' }],
    }),

    updatePGLocation: build.mutation<PGLocationsMutationResponse, { id: number; data: Partial<PGLocation> }>({
      query: ({ id, data }) => ({ url: `/pg-locations/${id}`, method: 'PUT', body: data }),
      transformResponse: (response: ApiEnvelope<PGLocationsMutationResponse> | any) => normalizeEntityResponse<any>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'PGLocations', id: 'LIST' },
        { type: 'PGLocation', id: arg.id },
      ],
    }),

    deletePGLocation: build.mutation<PGLocationsMutationResponse, number>({
      query: (id) => ({ url: `/pg-locations/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiEnvelope<PGLocationsMutationResponse> | any) => normalizeEntityResponse<any>(response),
      invalidatesTags: (_res, _err, id) => [
        { type: 'PGLocations', id: 'LIST' },
        { type: 'PGLocation', id },
      ],
    }),

    getPGLocationDetails: build.query<GetPGLocationDetailsResponse, number>({
      query: (pgId) => ({ url: `/pg-locations/${pgId}/details`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<GetPGLocationDetailsResponse> | any) => normalizeEntityResponse<any>(response),
      providesTags: (_res, _err, pgId) => [{ type: 'PGLocationDetails' as const, id: pgId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPGLocationsQuery,
  useLazyGetPGLocationsQuery,
  useCreatePGLocationMutation,
  useUpdatePGLocationMutation,
  useDeletePGLocationMutation,
  useGetPGLocationDetailsQuery,
  useLazyGetPGLocationDetailsQuery,
} = pgLocationsApi;
