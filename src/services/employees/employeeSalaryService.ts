import axiosInstance from '../core/axiosInstance';

export enum PaymentMethod {
  GPAY = 'GPAY',
  PHONEPE = 'PHONEPE',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export interface CreateEmployeeSalaryDto {
  user_id: number;
  salary_amount: number;
  month: string; // YYYY-MM-DD format
  paid_date?: string; // YYYY-MM-DD format
  payment_method?: PaymentMethod;
  remarks?: string;
}

export interface UpdateEmployeeSalaryDto {
  salary_amount?: number;
  paid_date?: string;
  payment_method?: PaymentMethod;
  remarks?: string;
}

export interface EmployeeSalary {
  s_no: number;
  user_id: number;
  pg_id: number;
  salary_amount: number;
  month: string;
  paid_date?: string;
  payment_method?: PaymentMethod;
  remarks?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  users?: {
    s_no: number;
    name: string;
    email?: string;
    phone?: string;
    role_id?: number;
  };
  pg_locations?: {
    s_no: number;
    location_name: string;
  };
}

const employeeSalaryService = {
  /**
   * Create a new employee salary record
   */
  async createSalary(data: CreateEmployeeSalaryDto): Promise<any> {
    const response = await axiosInstance.post('/employee-salary', data);
    return response.data;
  },

  /**
   * Get all salary records for a PG location
   */
  async getSalaries(
    page: number = 1,
    limit: number = 10,
    month?: number,
    year?: number,
  ): Promise<any> {
    const response = await axiosInstance.get('/employee-salary', {
      params: { page, limit, month, year },
    });
    return response.data;
  },

  /**
   * Get salary records for a specific employee
   */
  async getSalariesByEmployee(userId: number, page: number = 1, limit: number = 10): Promise<any> {
    const response = await axiosInstance.get(`/employee-salary/employee/${userId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get a single salary record by ID
   */
  async getSalaryById(id: number): Promise<any> {
    const response = await axiosInstance.get(`/employee-salary/${id}`);
    return response.data;
  },

  /**
   * Update a salary record
   */
  async updateSalary(id: number, data: UpdateEmployeeSalaryDto): Promise<any> {
    const response = await axiosInstance.patch(`/employee-salary/${id}`, data);
    return response.data;
  },

  /**
   * Delete a salary record (soft delete)
   */
  async deleteSalary(id: number): Promise<any> {
    const response = await axiosInstance.delete(`/employee-salary/${id}`);
    return response.data;
  },

  /**
   * Get salary statistics
   */
  async getSalaryStats(startMonth?: string, endMonth?: string): Promise<any> {
    const response = await axiosInstance.get('/employee-salary/stats', {
      params: { startMonth, endMonth },
    });
    return response.data;
  },
};

export default employeeSalaryService;
