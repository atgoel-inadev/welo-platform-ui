/**
 * Orval custom mutators — routes generated API calls through the existing
 * auth-aware ApiClient instances so every generated function automatically
 * carries the Bearer token and the 401-redirect interceptor.
 *
 * Each mutator corresponds to one backend service in orval.config.ts.
 */
import type { AxiosRequestConfig } from 'axios';
import {
  taskManagementApi,
  projectManagementApi,
  authApi,
  workflowEngineApi,
  annotationQaApi,
} from './apiClient';

export const taskServiceMutator = <T>(config: AxiosRequestConfig): Promise<T> =>
  taskManagementApi.request<T>(config);

export const projectServiceMutator = <T>(config: AxiosRequestConfig): Promise<T> =>
  projectManagementApi.request<T>(config);

export const authServiceMutator = <T>(config: AxiosRequestConfig): Promise<T> =>
  authApi.request<T>(config);

export const workflowServiceMutator = <T>(config: AxiosRequestConfig): Promise<T> =>
  workflowEngineApi.request<T>(config);

export const annotationQaServiceMutator = <T>(config: AxiosRequestConfig): Promise<T> =>
  annotationQaApi.request<T>(config);
