import { baseApi } from './baseApi';
import { getS3Config } from '../../config/aws.config';

export interface UploadOptions {
  folder?: string;
  fileName?: string;
  contentType?: string;
  isPublic?: boolean;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

const s3Config = getS3Config();
const bucketName = s3Config.bucketName;

type ApiEnvelope<T> = {
  data?: T;
};

export type UploadToS3Request = {
  file: string;
  options?: UploadOptions;
};

export type DeleteFromS3Request = {
  key: string;
};

export type DeleteMultipleFromS3Request = {
  keys: string[];
};

export type FileExistsRequest = {
  key: string;
};

export type FileExistsResponse = {
  exists: boolean;
};

export const storageApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    uploadToS3: build.mutation<UploadResult, UploadToS3Request>({
      query: ({ file, options }) => {
        const folder = options?.folder ?? 'uploads';
        const fileName = options?.fileName ?? `file_${Date.now()}`;
        const contentType = options?.contentType ?? 'application/octet-stream';
        const isPublic = options?.isPublic ?? true;

        const key = folder ? `${folder}/${fileName}` : fileName;

        let fileData = file;
        let actualContentType = contentType;
        if (typeof file === 'string' && file.startsWith('data:')) {
          const matches = file.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            actualContentType = matches[1];
            fileData = matches[2];
          } else {
            fileData = file.replace(/^data:.*,/, '');
          }
        } else if (typeof file === 'string') {
          fileData = file;
        }

        return {
          url: '/s3/upload',
          method: 'POST',
          body: {
            key,
            contentType: actualContentType,
            fileData,
            isPublic,
            bucket: bucketName,
          },
        };
      },
      transformResponse: (response: ApiEnvelope<any> | any): UploadResult => {
        const payload = (response as any)?.data ?? response;
        if (payload?.success) {
          return { success: true, url: payload.url, key: payload.key };
        }
        return { success: false, error: payload?.error || payload?.message || 'Upload failed' };
      },
      invalidatesTags: [{ type: 'S3Objects' as const, id: 'LIST' }],
    }),

    deleteFromS3: build.mutation<DeleteResult, DeleteFromS3Request>({
      query: ({ key }) => ({
        url: '/s3/delete',
        method: 'DELETE',
        body: { key, bucket: bucketName },
      }),
      transformResponse: (response: ApiEnvelope<any> | any): DeleteResult => {
        const payload = (response as any)?.data ?? response;
        if (payload?.success) return { success: true };
        return { success: false, error: payload?.error || payload?.message || 'Delete failed' };
      },
      invalidatesTags: (_res, _err, arg) => [
        { type: 'S3Objects' as const, id: 'LIST' },
        { type: 'S3Object' as const, id: arg.key },
      ],
    }),

    deleteMultipleFromS3: build.mutation<DeleteResult, DeleteMultipleFromS3Request>({
      query: ({ keys }) => ({
        url: '/s3/delete-multiple',
        method: 'DELETE',
        body: { keys, bucket: bucketName },
      }),
      transformResponse: (response: ApiEnvelope<any> | any): DeleteResult => {
        const payload = (response as any)?.data ?? response;
        if (payload?.success) return { success: true };
        return { success: false, error: payload?.error || payload?.message || 'Bulk delete failed' };
      },
      invalidatesTags: [{ type: 'S3Objects' as const, id: 'LIST' }],
    }),

    fileExistsInS3: build.query<FileExistsResponse, FileExistsRequest>({
      query: ({ key }) => ({
        url: '/s3/exists',
        method: 'GET',
        params: { key, bucket: bucketName },
      }),
      transformResponse: (response: ApiEnvelope<any> | any): FileExistsResponse => {
        const payload = (response as any)?.data ?? response;
        return { exists: Boolean(payload?.exists) };
      },
      providesTags: (_res, _err, arg) => [{ type: 'S3Object' as const, id: arg.key }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useUploadToS3Mutation,
  useDeleteFromS3Mutation,
  useDeleteMultipleFromS3Mutation,
  useFileExistsInS3Query,
  useLazyFileExistsInS3Query,
} = storageApi;
