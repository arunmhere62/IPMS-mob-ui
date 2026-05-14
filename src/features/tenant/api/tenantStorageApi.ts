import { tenantBaseApi } from './tenantBaseApi';
import { getS3Config } from '../../../config/aws.config';

const s3Config = getS3Config();
const bucketName = s3Config.bucketName;

export interface TenantUploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export const tenantStorageApi = tenantBaseApi.injectEndpoints({
  endpoints: (build) => ({
    tenantUploadToS3: build.mutation<TenantUploadResult, { file: string; folder?: string; fileName?: string }>({
      query: ({ file, folder = 'tickets/attachments', fileName }) => {
        const name = fileName ?? `ticket_${Date.now()}.jpg`;
        const key = `${folder}/${name}`;

        let fileData = file;
        let contentType = 'image/jpeg';
        if (file.startsWith('data:')) {
          const matches = file.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            contentType = matches[1];
            fileData = matches[2];
          } else {
            fileData = file.replace(/^data:.*,/, '');
          }
        }

        return {
          url: '/s3/upload',
          method: 'POST',
          body: { key, contentType, fileData, isPublic: true, bucket: bucketName },
        };
      },
      transformResponse: (response: any): TenantUploadResult => {
        const payload = response?.data ?? response;
        if (payload?.success) return { success: true, url: payload.url, key: payload.key };
        return { success: false, error: payload?.error || payload?.message || 'Upload failed' };
      },
    }),
  }),
  overrideExisting: false,
});

export const { useTenantUploadToS3Mutation } = tenantStorageApi;
