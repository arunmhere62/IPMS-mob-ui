import { baseApi } from './baseApi';





export interface Bed {
  s_no: number;
  bed_no: string;
  room_id: number;
  pg_id?: number;
  is_occupied?: boolean;
  bed_price?: number | string;
  images?: any;
  created_at?: string;
  updated_at?: string;
  rooms?: {
    s_no: number;
    room_no: string;
    pg_locations?: {
      s_no: number;
      location_name: string;
    };
  };
  tenants?: Array<{
    s_no: number;
    name: string;
    phone_no: string;
    status: string;
  }>;
}

export interface CreateBedDto {
  room_id: number;
  bed_no: string;
  pg_id?: number;
  bed_price?: number;
  images?: any;
}

export interface GetBedsParams {
  page?: number;
  limit?: number;
  room_id?: number;
  search?: string;
  only_unoccupied?: boolean;
}

export interface GetBedsResponse {
  success: boolean;
  data: Bed[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  message?: string;
}

export interface BedResponse {
  success: boolean;
  data: Bed;
  message?: string;
}



export interface Room {
  s_no: number;
  room_id?: string;
  pg_id: number;
  room_no: string;
  images?: any;
  created_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
  pg_locations?: {
    s_no: number;
    location_name: string;
  };
  beds?: Array<{
    s_no: number;
    bed_no: string;
    bed_price?: number | string;
    is_occupied?: boolean;
  }>;
  total_beds?: number;
  occupied_beds?: number;
  available_beds?: number;
}

export interface CreateRoomDto {
  pg_id: number;
  room_no: string;
  images?: any;
}

export interface GetRoomsParams {
  page?: number;
  limit?: number;
  pg_id?: number;
  search?: string;
}

export interface GetRoomsResponse {
  success: boolean;
  data: Room[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface RoomResponse {
  success: boolean;
  message?: string;
  data: Room;
}

type ApiEnvelope<T> = {
  data?: T;
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

const normalizeListResponse = <T>(response: any): { success: boolean; data: T[]; pagination?: any; message?: string } => {
  const unwrapped = unwrapCentralData<any>(response);

  // New centralized envelope can return `data` as an array directly
  if (Array.isArray(unwrapped)) {
    return {
      success: (response as any)?.success ?? true,
      data: unwrapped as T[],
      message: (response as any)?.message,
    };
  }

  const extractItems = (v: any): T[] => {
    if (Array.isArray(v)) return v as T[];
    if (Array.isArray(v?.data)) return v.data as T[];
    if (Array.isArray(v?.data?.data)) return v.data.data as T[];
    if (Array.isArray(v?.data?.data?.data)) return v.data.data.data as T[];
    return [];
  };

  // Or it can return an object that already contains `data` (and optionally pagination)
  const items = extractItems(unwrapped?.data ?? unwrapped);
  return {
    success: (unwrapped as any)?.success ?? (response as any)?.success ?? true,
    data: items as T[],
    pagination: (unwrapped as any)?.pagination,
    message: (unwrapped as any)?.message ?? (response as any)?.message,
  };
};

export const roomsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Rooms
    getAllRooms: build.query<GetRoomsResponse, GetRoomsParams | void>({
      query: (params) => ({
        url: '/rooms',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<GetRoomsResponse> | any) => (response as any)?.data ?? response,
      providesTags: (result) => {
        const rooms = (result as any)?.data || [];
        return [
          { type: 'Rooms' as const, id: 'LIST' },
          ...rooms.map((r: Room) => ({ type: 'Room' as const, id: r.s_no })),
        ];
      },
    }),

    getRoomById: build.query<RoomResponse, number>({
      query: (id) => ({ url: `/rooms/${id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<RoomResponse> | any) => normalizeEntityResponse<Room>(response),
      providesTags: (_res, _err, id) => [{ type: 'Room' as const, id }],
    }),

    createRoom: build.mutation<RoomResponse, CreateRoomDto>({
      query: (body) => ({ url: '/rooms', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<RoomResponse> | any) => normalizeEntityResponse<Room>(response),
      invalidatesTags: [{ type: 'Rooms', id: 'LIST' }],
    }),

    updateRoom: build.mutation<RoomResponse, { id: number; data: Partial<CreateRoomDto> }>({
      query: ({ id, data }) => ({ url: `/rooms/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiEnvelope<RoomResponse> | any) => normalizeEntityResponse<Room>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Rooms', id: 'LIST' },
        { type: 'Room', id: arg.id },
      ],
    }),

    deleteRoom: build.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({ url: `/rooms/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, id) => [
        { type: 'Rooms', id: 'LIST' },
        { type: 'Room', id },
      ],
    }),

    // Beds
    getAllBeds: build.query<GetBedsResponse, GetBedsParams | void>({
      query: (params) => ({
        url: '/beds',
        method: 'GET',
        params: params || undefined,
      }),
      transformResponse: (response: ApiEnvelope<GetBedsResponse> | any) => normalizeListResponse<Bed>(response),
      providesTags: (result) => {
        const beds = (result as any)?.data || [];
        return [
          { type: 'Beds' as const, id: 'LIST' },
          ...beds.map((b: Bed) => ({ type: 'Bed' as const, id: b.s_no })),
        ];
      },
    }),

    getBedsByRoomId: build.query<GetBedsResponse, number>({
      query: (roomId) => ({ url: `/beds/room/${roomId}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<GetBedsResponse> | any) => normalizeListResponse<Bed>(response),
      providesTags: (_res, _err, roomId) => [{ type: 'Beds' as const, id: roomId }],
    }),

    getBedById: build.query<BedResponse, number>({
      query: (id) => ({ url: `/beds/${id}`, method: 'GET' }),
      transformResponse: (response: ApiEnvelope<BedResponse> | any) => normalizeEntityResponse<Bed>(response),
      providesTags: (_res, _err, id) => [{ type: 'Bed' as const, id }],
    }),

    createBed: build.mutation<BedResponse, CreateBedDto>({
      query: (body) => ({ url: '/beds', method: 'POST', body }),
      transformResponse: (response: ApiEnvelope<BedResponse> | any) => normalizeEntityResponse<Bed>(response),
      invalidatesTags: [{ type: 'Beds', id: 'LIST' }],
    }),

    updateBed: build.mutation<BedResponse, { id: number; data: Partial<CreateBedDto> }>({
      query: ({ id, data }) => ({ url: `/beds/${id}`, method: 'PATCH', body: data }),
      transformResponse: (response: ApiEnvelope<BedResponse> | any) => normalizeEntityResponse<Bed>(response),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Beds', id: 'LIST' },
        { type: 'Bed', id: arg.id },
      ],
    }),

    deleteBed: build.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({ url: `/beds/${id}`, method: 'DELETE' }),
      transformResponse: (response: ApiEnvelope<any> | any) => (response as any)?.data ?? response,
      invalidatesTags: (_res, _err, id) => [
        { type: 'Beds', id: 'LIST' },
        { type: 'Bed', id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllRoomsQuery,
  useLazyGetAllRoomsQuery,
  useGetRoomByIdQuery,
  useLazyGetRoomByIdQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useGetAllBedsQuery,
  useLazyGetAllBedsQuery,
  useGetBedsByRoomIdQuery,
  useLazyGetBedsByRoomIdQuery,
  useGetBedByIdQuery,
  useLazyGetBedByIdQuery,
  useCreateBedMutation,
  useUpdateBedMutation,
  useDeleteBedMutation,
} = roomsApi;
