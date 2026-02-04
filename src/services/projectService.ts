import { projectManagementApi } from '../lib/apiClient';
import { Project, Customer, ProjectStatus, CreateProjectInput, UpdateProjectInput } from '../types';

/**
 * API Response types matching backend structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ProjectQueryParams {
  customerId?: string;
  status?: ProjectStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateProjectDto {
  name: string;
  customerId: string;
  description?: string;
  projectType: string;
  createdBy: string;
  startDate?: Date;
  endDate?: Date;
  annotationSchema?: any;
  qualityThresholds?: any;
  workflowRules?: any;
  uiConfiguration?: any;
  supportedFileTypes?: string[];
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  configuration?: any;
}

/**
 * Project Management Service
 * Integrates with Project Management backend service (port 3004)
 */
export class ProjectService {
  /**
   * Fetch projects with pagination and filters
   */
  async fetchProjects(params: ProjectQueryParams = {}): Promise<PaginatedResponse<Project>> {
    const queryParams = new URLSearchParams();
    
    if (params.customerId) queryParams.append('customerId', params.customerId);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('pageSize', params.limit.toString());

    const url = `/projects?${queryParams.toString()}`;
    const response = await projectManagementApi.get<BackendResponse<Project[]>>(url);

    // Transform backend response to frontend format
    return {
      data: response.data,
      total: response.pagination?.totalItems || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.pageSize || 10,
    };
  }

  /**
   * Fetch a single project by ID
   */
  async fetchProjectById(projectId: string): Promise<Project> {
    const response = await projectManagementApi.get<BackendResponse<Project>>(`/projects/${projectId}`);
    return response.data;
  }

  /**
   * Create a new project
   */
  async createProject(input: CreateProjectInput, userId: string): Promise<Project> {
    // Transform frontend format to backend DTO
    const dto: CreateProjectDto = {
      name: input.name,
      customerId: input.customer_id,
      description: input.description,
      projectType: input.project_type,
      createdBy: userId,
      annotationSchema: input.annotation_questions,
      qualityThresholds: {
        qualityThreshold: input.quality_threshold,
      },
      workflowRules: input.workflow_config,
      uiConfiguration: {},
      supportedFileTypes: [],
    };

    const response = await projectManagementApi.post<BackendResponse<Project>>('/projects', dto);
    return response.data;
  }

  /**
   * Update an existing project
   */
  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    // Transform frontend format to backend DTO
    const dto: UpdateProjectDto = {
      name: input.name,
      description: input.description,
      status: input.status,
      configuration: {
        annotation_questions: input.annotation_questions,
        workflow_config: input.workflow_config,
        quality_threshold: input.quality_threshold,
      },
    };

    const response = await projectManagementApi.patch<BackendResponse<Project>>(`/projects/${id}`, dto);
    return response.data;
  }

  /**
   * Delete a project (soft delete)
   */
  async deleteProject(projectId: string): Promise<{ success: boolean }> {
    return projectManagementApi.delete<{ success: boolean }>(`/projects/${projectId}`);
  }

  /**
   * Clone a project
   */
  async cloneProject(projectId: string, newName: string, copyTasks: boolean = false): Promise<Project> {
    const response = await projectManagementApi.post<BackendResponse<Project>>(`/projects/${projectId}/clone`, {
      newName,
      copyTasks,
    });
    return response.data;
  }

  /**
   * Get project statistics
   */
  async getProjectStatistics(projectId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    queuedTasks: number;
    completionRate: number;
    averageQualityScore: number;
  }> {
    const response = await projectManagementApi.get<BackendResponse<{
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      queuedTasks: number;
      completionRate: number;
      averageQualityScore: number;
    }>>(`/projects/${projectId}/statistics`);
    return response.data;
  }

  /**
   * Fetch customers (workspaces)
   */
  async fetchCustomers(): Promise<Customer[]> {
    return projectManagementApi.get<Customer[]>('/customers');
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: { name: string; email: string; subscription?: string }): Promise<Customer> {
    return projectManagementApi.post<Customer>('/customers', data);
  }
}

// Export singleton instance
export const projectService = new ProjectService();
