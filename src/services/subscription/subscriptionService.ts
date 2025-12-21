import axiosInstance from '../core/axiosInstance';

export interface SubscriptionPlan {
  s_no: number;
  name: string;
  description: string;
  price: string;
  duration: number;
  currency: string;
  features: string[];
  is_active: boolean;
  max_pg_locations?: number | null;
  max_tenants?: number | null;
  max_users?: number | null;
}

export interface UserSubscription {
  s_no?: number;  // Backend uses s_no
  id?: number;    // Keep for compatibility
  user_id: number;
  plan_id: number;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  payment_status?: 'PAID' | 'PENDING' | 'FAILED';
  amount_paid?: number;
  plan?: SubscriptionPlan;
  subscription_plans?: SubscriptionPlan;  // Backend might use this
  created_at: string;
  updated_at: string;
  auto_renew?: boolean;
  organization_id?: number;
}

export interface SubscriptionStatus {
  has_active_subscription: boolean;
  subscription?: UserSubscription;
  days_remaining?: number;
  is_trial?: boolean;
}

export interface SubscriptionHistory {
  data: UserSubscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class SubscriptionService {
  /**
   * Get all active subscription plans
   */
  async getPlans(): Promise<{ success: boolean; data: SubscriptionPlan[] }> {
    const response = await axiosInstance.get('/subscription/plans');
    return response.data;
  }

  /**
   * Get current user's active subscription
   */
  async getCurrentSubscription(): Promise<{ success: boolean; data: UserSubscription | null }> {
    const response = await axiosInstance.get('/subscription/current');
    return response.data;
  }

  /**
   * Check if user has active subscription
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const response = await axiosInstance.get('/subscription/status');
    console.log('🔍 Service received response:', response.data);
    // API returns data directly, not wrapped in { data: ... }
    return response.data;
  }

  /**
   * Get subscription history
   */
  async getSubscriptionHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: SubscriptionHistory }> {
    const response = await axiosInstance.get('/subscription/history', { params });
    return response.data;
  }

  /**
   * Subscribe to a plan
   */
  async subscribeToPlan(planId: number): Promise<{ 
    success: boolean; 
    data: { 
      subscription: UserSubscription;
      payment_url: string;
      order_id: string;
    } 
  }> {
    const response = await axiosInstance.post('/subscription/subscribe', { plan_id: planId });
    return response.data;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: number): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.post(`/subscription/${subscriptionId}/cancel`);
    return response.data;
  }

  /**
   * Renew subscription
   */
  async renewSubscription(subscriptionId: number): Promise<{ 
    success: boolean; 
    data: { 
      subscription: UserSubscription;
      payment_url?: string;
    } 
  }> {
    const response = await axiosInstance.post(`/subscription/${subscriptionId}/renew`);
    return response.data;
  }
}

export default new SubscriptionService();
