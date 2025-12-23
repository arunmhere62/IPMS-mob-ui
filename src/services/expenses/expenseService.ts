import axiosInstance from '../core/axiosInstance';

export enum PaymentMethod {
  GPAY = 'GPAY',
  PHONEPE = 'PHONEPE',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export interface CreateExpenseDto {
  expense_type: string;
  amount: number;
  paid_to: string;
  paid_date: string;
  payment_method: PaymentMethod;
  remarks?: string;
}

export interface UpdateExpenseDto {
  expense_type?: string;
  amount?: number;
  paid_to?: string;
  paid_date?: string;
  payment_method?: PaymentMethod;
  remarks?: string;
}

export interface Expense {
  s_no: number;
  pg_id: number;
  expense_type: string;
  amount: number;
  paid_to: string;
  paid_date: string;
  payment_method: PaymentMethod;
  remarks?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  pg_locations?: {
    location_name: string;
  };
}

const expenseService = {
  /**
   * Create a new expense
   */
  async createExpense(data: CreateExpenseDto): Promise<any> {
    const response = await axiosInstance.post('/expenses', data);
    return response.data;
  },

  /**
   * Get all expenses for a PG location
   */
  async getExpenses(
    page: number = 1,
    limit: number = 10,
    month?: number,
    year?: number,
  ): Promise<any> {
    const response = await axiosInstance.get('/expenses', {
      params: { page, limit, month, year },
    });
    return response.data;
  },

  /**
   * Get a single expense by ID
   */
  async getExpenseById(id: number): Promise<any> {
    const response = await axiosInstance.get(`/expenses/${id}`);
    return response.data;
  },

  /**
   * Update an expense
   */
  async updateExpense(id: number, data: UpdateExpenseDto): Promise<any> {
    const response = await axiosInstance.patch(`/expenses/${id}`, data);
    return response.data;
  },

  /**
   * Delete an expense (soft delete)
   */
  async deleteExpense(id: number): Promise<any> {
    const response = await axiosInstance.delete(`/expenses/${id}`);
    return response.data;
  },

  /**
   * Get expense statistics
   */
  async getExpenseStats(startDate?: string, endDate?: string): Promise<any> {
    const response = await axiosInstance.get('/expenses/stats', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

export default expenseService;
