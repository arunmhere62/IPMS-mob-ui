import { baseApi } from './baseApi';

type ApiEnvelope<T> = {
  data?: T;
};

export interface Country {
  s_no: number;
  name: string;
  iso_code: string;
}

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
    getCountries: build.query<LocationResponse<Country>, void>({
      query: () => ({
        url: '/location/countries',
        method: 'GET',
      }),
      transformResponse: (response: ApiEnvelope<any> | any): LocationResponse<Country> => {
        const payload = (response as any)?.data ?? response;
        const extracted = payload?.data ?? payload;
        const extractItems = (v: any) => {
          if (Array.isArray(v)) return v;
          if (Array.isArray(v?.data)) return v.data;
          if (Array.isArray(v?.data?.data)) return v.data.data;
          if (Array.isArray(v?.data?.data?.data)) return v.data.data.data;
          return [];
        };
        const items = extractItems(extracted);
        return {
          success: Boolean((response as any)?.success ?? payload?.success ?? true),
          data: Array.isArray(items) ? items : [],
          message: (response as any)?.message ?? payload?.message,
        };
      },
      providesTags: [{ type: 'Countries', id: 'LIST' } as any],
    }),

    getStates: build.query<LocationResponse<State>, GetStatesParams | void>({
      query: (params) => ({
        url: '/location/states',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<any> | any): LocationResponse<State> => {
        const payload = (response as any)?.data ?? response;
        const extracted = payload?.data ?? payload;
        const extractItems = (v: any) => {
          if (Array.isArray(v)) return v;
          if (Array.isArray(v?.data)) return v.data;
          if (Array.isArray(v?.data?.data)) return v.data.data;
          if (Array.isArray(v?.data?.data?.data)) return v.data.data.data;
          return [];
        };
        const items = extractItems(extracted);
        return {
          success: Boolean((response as any)?.success ?? payload?.success ?? true),
          data: Array.isArray(items) ? items : [],
          message: (response as any)?.message ?? payload?.message,
        };
      },
      providesTags: [{ type: 'States', id: 'LIST' }],
    }),

    getCities: build.query<LocationResponse<City>, GetCitiesParams>({
      query: (params) => ({
        url: '/location/cities',
        method: 'GET',
        params,
      }),
      transformResponse: (response: ApiEnvelope<any> | any): LocationResponse<City> => {
        const payload = (response as any)?.data ?? response;
        const extracted = payload?.data ?? payload;
        const extractItems = (v: any) => {
          if (Array.isArray(v)) return v;
          if (Array.isArray(v?.data)) return v.data;
          if (Array.isArray(v?.data?.data)) return v.data.data;
          if (Array.isArray(v?.data?.data?.data)) return v.data.data.data;
          return [];
        };
        const items = extractItems(extracted);
        return {
          success: Boolean((response as any)?.success ?? payload?.success ?? true),
          data: Array.isArray(items) ? items : [],
          message: (response as any)?.message ?? payload?.message,
        };
      },
      providesTags: (_res, _err, arg) => [{ type: 'Cities', id: arg.stateCode }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetCountriesQuery,
  useLazyGetCountriesQuery,
  useGetStatesQuery,
  useLazyGetStatesQuery,
  useGetCitiesQuery,
  useLazyGetCitiesQuery,
} = locationApi;
