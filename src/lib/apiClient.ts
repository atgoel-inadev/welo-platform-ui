import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosError } from 'axios';

/**
 * Base API Client for Welo Platform Backend Services
 * Handles authentication, request/response interceptors, and error handling
 */
class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          
          // Handle 401 Unauthorized - token expired or invalid
          if (status === 401) {
            this.clearToken();
            // Redirect to login or trigger token refresh
            window.location.href = '/login';
          }

          // Handle other status codes
          const errorMessage = this.extractErrorMessage(error);
          return Promise.reject(new Error(errorMessage));
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Extract error message from API response
   */
  private extractErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as any;
      return data.message || data.error || 'An unexpected error occurred';
    }
    if (error.request) {
      return 'Network error - please check your connection';
    }
    return error.message || 'An unexpected error occurred';
  }

  /**
   * Set authentication token
   */
  public setToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Clear authentication token
   */
  public clearToken(): void {
    this.accessToken = null;
  }

  /**
   * GET request
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  public async post<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  public async patch<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  public async put<T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Service URLs from environment or defaults
const PROJECT_MANAGEMENT_URL = import.meta.env.VITE_PROJECT_MANAGEMENT_URL || 'http://localhost:3004/api/v1';
const TASK_MANAGEMENT_URL = import.meta.env.VITE_TASK_MANAGEMENT_URL || 'http://localhost:3003/api/v1';
const WORKFLOW_ENGINE_URL = import.meta.env.VITE_WORKFLOW_ENGINE_URL || 'http://localhost:3007/api/v1';
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3002/api/v1';

// Create API client instances for each service
export const projectManagementApi = new ApiClient(PROJECT_MANAGEMENT_URL);
export const taskManagementApi = new ApiClient(TASK_MANAGEMENT_URL);
export const workflowEngineApi = new ApiClient(WORKFLOW_ENGINE_URL);
export const authApi = new ApiClient(AUTH_SERVICE_URL + '/auth');

// Export the class for custom instances
export default ApiClient;
