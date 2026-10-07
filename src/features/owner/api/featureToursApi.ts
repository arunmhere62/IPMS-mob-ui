import { baseApi } from './baseApi';
import { extractResponseData } from '../../../utils/apiResponseHandler';

export type FeatureTourAudience = 'ALL' | 'OWNER' | 'CARETAKER' | 'TENANT' | 'NEW_USER';
export type FeatureTourProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';

export interface FeatureTourProgress {
  s_no: number | null;
  tour_id: number;
  tour_version: number;
  status: FeatureTourProgressStatus;
  current_step: number;
  started_at: string | null;
  completed_at: string | null;
  dismissed_at: string | null;
  dismissed_step: number | null;
  updated_at: string | null;
}

export interface FeatureTour {
  s_no: number;
  tour_key: string;
  display_name: string;
  description: string | null;
  current_version: number;
  target_audience: FeatureTourAudience;
  trigger_screen: string | null;
  total_steps: number;
  sort_order: number;
  progress: FeatureTourProgress;
}

const unwrapResponse = <T>(response: unknown): T =>
  extractResponseData<T>(response);

export const featureToursApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAvailableFeatureTours: build.query<FeatureTour[], void>({
      query: () => ({ url: '/feature-tours', method: 'GET' }),
      transformResponse: (response: unknown) => unwrapResponse<FeatureTour[]>(response),
      providesTags: ['FeatureTours'],
    }),
    startFeatureTour: build.mutation<FeatureTourProgress, string>({
      query: (tourKey) => ({ url: `/feature-tours/${encodeURIComponent(tourKey)}/start`, method: 'POST' }),
      transformResponse: (response: unknown) => unwrapResponse<FeatureTourProgress>(response),
      invalidatesTags: ['FeatureTours'],
    }),
    updateFeatureTourProgress: build.mutation<FeatureTourProgress, { tourKey: string; current_step: number }>({
      query: ({ tourKey, current_step }) => ({
        url: `/feature-tours/${encodeURIComponent(tourKey)}/progress`,
        method: 'PATCH',
        body: { current_step },
      }),
      transformResponse: (response: unknown) => unwrapResponse<FeatureTourProgress>(response),
      invalidatesTags: ['FeatureTours'],
    }),
    completeFeatureTour: build.mutation<FeatureTourProgress, string>({
      query: (tourKey) => ({ url: `/feature-tours/${encodeURIComponent(tourKey)}/complete`, method: 'POST' }),
      transformResponse: (response: unknown) => unwrapResponse<FeatureTourProgress>(response),
      invalidatesTags: ['FeatureTours'],
    }),
    dismissFeatureTour: build.mutation<FeatureTourProgress, string>({
      query: (tourKey) => ({ url: `/feature-tours/${encodeURIComponent(tourKey)}/dismiss`, method: 'POST' }),
      transformResponse: (response: unknown) => unwrapResponse<FeatureTourProgress>(response),
      invalidatesTags: ['FeatureTours'],
    }),
  }),
});

export const {
  useGetAvailableFeatureToursQuery,
  useStartFeatureTourMutation,
  useUpdateFeatureTourProgressMutation,
  useCompleteFeatureTourMutation,
  useDismissFeatureTourMutation,
} = featureToursApi;
