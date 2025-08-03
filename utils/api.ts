import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.5:3001' // Development backend - Using local IP
  : 'https://your-production-backend.com'; // Production backend

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    if (__DEV__) {
      console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      console.log('✅ API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    console.error(
      '❌ API Error:',
      error.response?.status,
      error.response?.data || error.message
    );

    // Handle common error cases
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login
      console.log('🔒 Unauthorized access');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.log('🔥 Server error');
    }

    return Promise.reject(error);
  }
);

// API Service Class
export class ApiService {
  // Test connection to backend
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing connection to:', `${API_BASE_URL}/api/test`);
      console.log('🔍 Base URL:', apiClient.defaults.baseURL);
      const response = await apiClient.get('/test');
      return response.status === 200;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Test database connection
  static async testDatabase() {
    try {
      console.log('🔍 Testing database connection to:', `${API_BASE_URL}/api/test-db`);
      const response = await apiClient.get('/test-db');
      return response.data;
    } catch (error) {
      console.error('Database test failed:', error);
      throw error;
    }
  }

  // Programs API
  static async getPrograms() {
    try {
      const response = await apiClient.get('/programs');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch programs');
    }
  }

  static async getProgram(id: string) {
    try {
      const response = await apiClient.get(`/programs/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch program ${id}`);
    }
  }

  // User API (to be implemented)
  static async getUserProfile(userId: string) {
    try {
      const response = await apiClient.get(`/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch user profile');
    }
  }

  static async updateUserProfile(userId: string, profile: any) {
    try {
      const response = await apiClient.put(`/users/${userId}/profile`, profile);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update user profile');
    }
  }

  // Workout tracking API (to be implemented)
  static async logWorkout(userId: string, workoutData: any) {
    try {
      const response = await apiClient.post(
        `/users/${userId}/workouts`,
        workoutData
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to log workout');
    }
  }

  static async getWorkoutHistory(userId: string) {
    try {
      const response = await apiClient.get(`/users/${userId}/workouts`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch workout history');
    }
  }

  // Nutrition API (to be implemented)
  static async logFood(userId: string, foodData: any) {
    try {
      const response = await apiClient.post(
        `/users/${userId}/nutrition`,
        foodData
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to log food');
    }
  }

  static async getNutritionHistory(userId: string, date: string) {
    try {
      const response = await apiClient.get(
        `/users/${userId}/nutrition/${date}`
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch nutrition history');
    }
  }
}

export default ApiService;
