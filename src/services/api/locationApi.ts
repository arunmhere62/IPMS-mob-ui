import { baseApi } from './baseApi';

type ApiEnvelope<T> = {
  data?: T;
};

export type GetStatesParams = {
  countryCode?: string;
};

export type GetCitiesParams = {
  stateCode: string;
};


export interface State {
  s_no: number;
  name: string;
  iso_code: string;
}

export interface City {
  s_no: number;
  name: string;
  state_code?: string;
}

export interface LocationResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
}

export const locationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getStates: build.query<LocationResponse<State>, GetStatesParams | void>({
      query: (params) => ({
        url: '/location/states',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<LocationResponse<State>> | any) =>
        (response as any)?.data ?? response,
      providesTags: [{ type: 'States', id: 'LIST' }],
    }),

    getCities: build.query<LocationResponse<City>, GetCitiesParams>({
      query: (params) => ({
        url: '/location/cities',
        method: 'GET',
        params,
      }),
      transformResponse: (response: ApiEnvelope<LocationResponse<City>> | any) =>
        (response as any)?.data ?? response,
      providesTags: (_res, _err, arg) => [{ type: 'Cities', id: arg.stateCode }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetStatesQuery, useLazyGetStatesQuery, useGetCitiesQuery, useLazyGetCitiesQuery } = locationApi;
