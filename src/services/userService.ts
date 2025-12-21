import axiosInstance from './core/axiosInstance';

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city_id?: number | null;
  state_id?: number | null;
  gender?: 'MALE' | 'FEMALE';
  profile_images?: any;
}

const userService = {
  /**
   * Get all users/employees for organization
   */
  async getUsers(): Promise<any> {
    const response = await axiosInstance.get('/auth/users');
    return response.data;
  },

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: number): Promise<any> {
    const response = await axiosInstance.get(`/auth/profile/${userId}`);
    return response.data;
  },

  /**
   * Update user profile (including profile image)
   */
  async updateUserProfile(userId: number, data: UpdateUserDto): Promise<any> {
    const response = await axiosInstance.patch(`/auth/profile/${userId}`, data);
    return response.data;
  },

  /**
   * Change password
   */
  async changePassword(userId: number, data: { currentPassword: string; newPassword: string }): Promise<any> {
    const response = await axiosInstance.post(`/auth/change-password/${userId}`, data);
    return response.data;
  },
};

export default userService;
