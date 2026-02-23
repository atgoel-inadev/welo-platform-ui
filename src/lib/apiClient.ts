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
            // Clear stored tokens so checkSession won't retry with stale credentials
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            // Redirect to login only if not already there (prevents infinite reload loop)
            const path = window.location.pathname;
            if (path !== '/login' && path !== '/signup') {
              window.location.href = '/login';
            }
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

  /**
   * Generic request — used by orval-generated clients via custom mutator.
   * Routes any AxiosRequestConfig through this instance's auth interceptors.
   */
  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }
}

// Service URLs from environment — must be set in .env or Docker build args
const PROJECT_MANAGEMENT_URL = import.meta.env.VITE_PROJECT_MANAGEMENT_URL;
const TASK_MANAGEMENT_URL = import.meta.env.VITE_TASK_MANAGEMENT_URL;
const WORKFLOW_ENGINE_URL = import.meta.env.VITE_WORKFLOW_ENGINE_URL;
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL;
const ANNOTATION_QA_URL = import.meta.env.VITE_ANNOTATION_QA_URL;

if (!PROJECT_MANAGEMENT_URL || !TASK_MANAGEMENT_URL || !WORKFLOW_ENGINE_URL || !AUTH_SERVICE_URL || !ANNOTATION_QA_URL) {
  console.error('Missing required VITE_* environment variables. Check your .env file or Docker build args.');
}

// Create API client instances for each service
export const projectManagementApi = new ApiClient(PROJECT_MANAGEMENT_URL);
export const taskManagementApi = new ApiClient(TASK_MANAGEMENT_URL);
export const workflowEngineApi = new ApiClient(WORKFLOW_ENGINE_URL);
export const authApi = new ApiClient(AUTH_SERVICE_URL + '/auth');
export const annotationQaApi = new ApiClient(ANNOTATION_QA_URL);

// Export the class for custom instances
export default ApiClient;
