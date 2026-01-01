import { baseApi } from './baseApi';

type CentralEnvelope<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T;
};

type ApiEnvelope<T> = {
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

export type LegalAcceptanceContext = 'SIGNUP' | 'LOGIN';

export type RequiredLegalDocument = {
  s_no: number;
  title?: string;
  name?: string;
  version?: string;
  url?: string;
  content_url?: string;
  required?: boolean;
};

export type RequiredLegalDocumentsStatusResponse = {
  required?: RequiredLegalDocument[];
  pending: RequiredLegalDocument[];
};

export type GetRequiredLegalDocumentsStatusRequest = {
  context: LegalAcceptanceContext;
  type?: string;
};

export type AcceptLegalDocumentRequest = {
  s_no: number;
  acceptance_context: LegalAcceptanceContext;
  user_id?: number;
};

export type AcceptLegalDocumentResponse = unknown;

export const legalDocumentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getRequiredLegalDocumentsStatus: build.query<RequiredLegalDocumentsStatusResponse, GetRequiredLegalDocumentsStatusRequest>({
      query: ({ context, type }) => ({
        url: '/legal-documents/required/status',
        method: 'GET',
        params: { context, type },
      }),
      transformResponse: (
        response:
          | CentralEnvelope<RequiredLegalDocumentsStatusResponse>
          | ApiEnvelope<RequiredLegalDocumentsStatusResponse>
          | RequiredLegalDocumentsStatusResponse
          | any
      ) => {
        const r = unwrapApiOrCentralData<any>(response);
        const rawRequired = (r?.required ?? r?.data?.required ?? []) as any[];
        const rawPending = (r?.pending ?? r?.data?.pending ?? []) as any[];

        const required = rawRequired
          .map((d) => {
            const rawSno = d?.s_no ?? d?.legal_document_id;
            const s_no = Number(rawSno);
            return {
              ...d,
              s_no,
            } as RequiredLegalDocument;
          })
          .filter((d) => Number.isFinite(d.s_no) && d.s_no > 0);

        const pending = rawPending
          .map((d) => {
            const rawSno = d?.s_no ?? d?.legal_document_id;
            const s_no = Number(rawSno);
            return {
              ...d,
              s_no,
            } as RequiredLegalDocument;
          })
          .filter((d) => Number.isFinite(d.s_no) && d.s_no > 0);

        return { required, pending };
      },
      providesTags: (_result, _error, arg) => [{ type: 'LegalRequiredStatus', id: arg.context }],
    }),

    acceptLegalDocument: build.mutation<AcceptLegalDocumentResponse, AcceptLegalDocumentRequest>({
      query: ({ s_no, acceptance_context, user_id }) => ({
        url: `/legal-documents/${s_no}/accept`,
        method: 'POST',
        body: { acceptance_context },
        headers:
          typeof user_id === 'number' && Number.isFinite(user_id) && user_id > 0
            ? { 'x-user-id': String(user_id) }
            : undefined,
      }),
      transformResponse: (response: CentralEnvelope<AcceptLegalDocumentResponse> | ApiEnvelope<AcceptLegalDocumentResponse> | any) =>
        unwrapApiOrCentralData<any>(response),
      invalidatesTags: (_result, _error, arg) => [{ type: 'LegalRequiredStatus', id: arg.acceptance_context }],
    }),
  }),
  overrideExisting: false,
});

export const { useLazyGetRequiredLegalDocumentsStatusQuery, useAcceptLegalDocumentMutation } = legalDocumentsApi;
