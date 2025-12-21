import axiosInstance from '../core/axiosInstance';
import { extractResponseData, extractPaginatedData } from '../../utils/apiResponseHandler';

export interface VisitorRoom {
  s_no: number;
  room_no?: string | null;
}

export interface VisitorBed {
  s_no: number;
  bed_no?: string | null;
  bed_price?: string | null;
}

export interface VisitorLocation {
  s_no: number;
  name?: string | null;
}

export interface Visitor {
  s_no: number;
  pg_id?: number | null;
  visitor_name?: string;
  phone_no?: string;
  purpose?: string;
  visited_date?: string;
  visited_room_id?: number | null;
  visited_bed_id?: number | null;
  city_id?: number | null;
  state_id?: number | null;
  remarks?: string;
  convertedTo_tenant: boolean;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
  address?: string | null;
  rooms?: VisitorRoom | null;
  beds?: VisitorBed | null;
  city?: VisitorLocation | null;
  state?: VisitorLocation | null;
}

export interface CreateVisitorDto {
  visitor_name: string;
  phone_no: string;
  purpose?: string;
  visited_date?: string;
  visited_room_id?: number;
  visited_bed_id?: number;
  city_id?: number;
  state_id?: number;
  remarks?: string;
  convertedTo_tenant?: boolean;
}

export interface GetVisitorsParams {
  page?: number;
  limit?: number;
  search?: string;
  room_id?: number;
  converted_to_tenant?: boolean;
}

const visitorService = {
  async getAllVisitors(params: GetVisitorsParams = {}) {
    const response = await axiosInstance.get('/visitors', { params });
    return extractPaginatedData<Visitor>(response.data);
  },

  async getVisitorById(id: number): Promise<Visitor> {
    const response = await axiosInstance.get(`/visitors/${id}`);
    return extractResponseData<Visitor>(response.data);
  },

  async createVisitor(data: CreateVisitorDto) {
    const response = await axiosInstance.post('/visitors', data);
    return response.data;
  },

  async updateVisitor(id: number, data: Partial<CreateVisitorDto>) {
    const response = await axiosInstance.patch(`/visitors/${id}`, data);
    return response.data;
  },

  async deleteVisitor(id: number) {
    const response = await axiosInstance.delete(`/visitors/${id}`);
    return extractResponseData(response.data);
  },

  async getVisitorStats() {
    const response = await axiosInstance.get('/visitors/stats');
    return extractResponseData(response.data);
  },
};

export default visitorService;
