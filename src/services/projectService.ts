import { projectManagementApi } from '../lib/apiClient';
import {
  Project,
  Customer,
  ProjectStatus,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectStatistics,
  AnnotationQuestion,
  WorkflowConfiguration,
  ReviewLevel,
} from '../types';

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
 * Maps a backend project (camelCase, nested configuration) to
 * frontend Project interface (snake_case, flat fields).
 */
function mapBackendProject(raw: any): Project {
  const config = raw.configuration || {};
  const qualityThresholds = config.qualityThresholds || {};
  const workflowConfig = config.workflowConfiguration || {};

  // Map annotation questions from backend to frontend format
  const annotationQuestions: AnnotationQuestion[] = (config.annotationQuestions || []).map(
    (q: any, index: number) => ({
      id: q.id || `q-${index}`,
      type: q.questionType || q.type || 'TEXT',
      label: q.question || q.label || '',
      description: q.description,
      required: q.required ?? false,
      order: q.order ?? index,
      depends_on: q.dependsOn || q.depends_on,
      show_when: q.showWhen || q.show_when,
      options: q.options?.map((o: any) => ({
        value: o.value,
        label: o.label,
        icon: o.icon,
      })),
      validation: q.validation
        ? {
            min: q.validation.min,
            max: q.validation.max,
            pattern: q.validation.pattern,
            custom_message: q.validation.customMessage || q.validation.custom_message,
          }
        : undefined,
    })
  );

  // Map review levels from backend to frontend format
  const reviewLevels: ReviewLevel[] = (workflowConfig.reviewLevels || []).map((rl: any) => ({
    level: rl.level,
    name: rl.name,
    reviewers_count: rl.reviewersCount ?? rl.reviewers_count ?? 1,
    require_all_approvals: rl.requireAllApprovals ?? rl.require_all_approvals ?? false,
    approval_threshold: rl.approvalThreshold ?? rl.approval_threshold,
    auto_assign: rl.autoAssign ?? rl.auto_assign ?? false,
    allowed_reviewers: rl.allowedReviewers ?? rl.allowed_reviewers,
  }));

  const workflowConfiguration: WorkflowConfiguration = {
    review_levels: reviewLevels,
    enable_multi_annotator: (workflowConfig.annotatorsPerTask || 1) > 1,
    annotators_per_task: workflowConfig.annotatorsPerTask || 1,
    consensus_threshold: workflowConfig.approvalCriteria?.consensusThreshold || 0.8,
    queue_strategy: workflowConfig.assignmentRules?.queueStrategy || 'FIFO',
    assignment_expiration_hours: workflowConfig.assignmentRules?.assignmentTimeout
      ? workflowConfig.assignmentRules.assignmentTimeout / 60
      : 8,
    max_tasks_per_annotator: workflowConfig.assignmentRules?.maxConcurrentAssignments || 10,
  };

  // Map customer if present
  const customer: Customer | undefined = raw.customer
    ? {
        id: raw.customer.id,
        name: raw.customer.name,
        email: raw.customer.email || '',
        subscription_tier: raw.customer.subscriptionTier || raw.customer.subscription_tier,
        created_at: raw.customer.createdAt || raw.customer.created_at || '',
        updated_at: raw.customer.updatedAt || raw.customer.updated_at || '',
      }
    : undefined;

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    customer_id: raw.customerId || raw.customer_id || '',
    project_type: raw.projectType || raw.project_type || 'TEXT_ANNOTATION',
    status: raw.status || 'DRAFT',
    annotation_questions: annotationQuestions,
    workflow_config: workflowConfiguration,
    quality_threshold: qualityThresholds.qualityThreshold ?? qualityThresholds.quality_threshold ?? 0.8,
    created_by: raw.createdBy || raw.created_by || '',
    created_at: raw.createdAt || raw.created_at || '',
    updated_at: raw.updatedAt || raw.updated_at || '',
    customer,
  };
}

/**
 * Maps frontend annotation questions back to backend format
 */
function mapAnnotationQuestionsToBackend(questions: AnnotationQuestion[]): any[] {
  return questions.map((q) => ({
    id: q.id,
    question: q.label,
    questionType: q.type,
    required: q.required,
    options: q.options?.map((o) => ({ id: o.value, label: o.label, value: o.value })),
    validation: q.validation
      ? {
          min: q.validation.min,
          max: q.validation.max,
          pattern: q.validation.pattern,
          minLength: q.validation.min,
          maxLength: q.validation.max,
        }
      : undefined,
    dependsOn: q.depends_on,
    showWhen: q.show_when,
  }));
}

/**
 * Maps frontend workflow config back to backend format
 */
function mapWorkflowConfigToBackend(wf: WorkflowConfiguration): any {
  return {
    annotatorsPerTask: wf.annotators_per_task,
    reviewLevels: wf.review_levels.map((rl) => ({
      level: rl.level,
      name: rl.name,
      reviewersCount: rl.reviewers_count,
      requireAllApprovals: rl.require_all_approvals,
      approvalThreshold: rl.approval_threshold,
      autoAssign: rl.auto_assign,
      allowedReviewers: rl.allowed_reviewers,
    })),
    approvalCriteria: {
      requireAllAnnotatorConsensus: wf.enable_multi_annotator,
      consensusThreshold: wf.consensus_threshold,
    },
    assignmentRules: {
      allowSelfAssignment: true,
      preventDuplicateAssignments: true,
      maxConcurrentAssignments: wf.max_tasks_per_annotator,
      assignmentTimeout: wf.assignment_expiration_hours * 60,
    },
  };
}

/**
 * Maps backend statistics to frontend format
 */
function mapBackendStatistics(raw: any): ProjectStatistics {
  return {
    total_tasks: raw.totalTasks ?? raw.total_tasks ?? 0,
    completed_tasks: raw.completedTasks ?? raw.completed_tasks ?? 0,
    in_progress_tasks: raw.inProgressTasks ?? raw.in_progress_tasks ?? 0,
    pending_review_tasks: raw.pendingReviewTasks ?? raw.queuedTasks ?? raw.pending_review_tasks ?? 0,
    average_completion_time: raw.averageCompletionTime ?? raw.average_completion_time ?? 0,
    quality_score: raw.averageQualityScore ?? raw.qualityScore ?? raw.quality_score ?? 0,
    active_annotators: raw.activeAnnotators ?? raw.active_annotators ?? 0,
  };
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
    const response = await projectManagementApi.get<BackendResponse<any[]>>(url);

    return {
      data: (response.data || []).map(mapBackendProject),
      total: response.pagination?.totalItems || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.pageSize || 10,
    };
  }

  /**
   * Fetch a single project by ID
   */
  async fetchProjectById(projectId: string): Promise<Project> {
    const response = await projectManagementApi.get<BackendResponse<any>>(`/projects/${projectId}`);
    return mapBackendProject(response.data);
  }

  /**
   * Create a new project
   */
  async createProject(input: CreateProjectInput, userId: string): Promise<Project> {
    const dto: CreateProjectDto = {
      name: input.name,
      customerId: input.customer_id,
      description: input.description,
      projectType: input.project_type,
      createdBy: userId,
      annotationSchema: input.annotation_questions
        ? mapAnnotationQuestionsToBackend(input.annotation_questions)
        : [],
      qualityThresholds: {
        qualityThreshold: input.quality_threshold ?? 0.8,
      },
      workflowRules: input.workflow_config
        ? mapWorkflowConfigToBackend(input.workflow_config)
        : {},
      uiConfiguration: {},
      supportedFileTypes: [],
    };

    const response = await projectManagementApi.post<BackendResponse<any>>('/projects', dto);
    return mapBackendProject(response.data);
  }

  /**
   * Update an existing project
   */
  async updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    const configuration: any = {};

    if (input.annotation_questions) {
      configuration.annotationQuestions = mapAnnotationQuestionsToBackend(input.annotation_questions);
    }
    if (input.workflow_config) {
      configuration.workflowConfiguration = mapWorkflowConfigToBackend(input.workflow_config);
    }
    if (input.quality_threshold !== undefined) {
      configuration.qualityThresholds = { qualityThreshold: input.quality_threshold };
    }

    const dto: UpdateProjectDto = {
      name: input.name,
      description: input.description,
      status: input.status,
      configuration: Object.keys(configuration).length > 0 ? configuration : undefined,
    };

    const response = await projectManagementApi.patch<BackendResponse<any>>(`/projects/${id}`, dto);
    return mapBackendProject(response.data);
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
    const response = await projectManagementApi.post<BackendResponse<any>>(`/projects/${projectId}/clone`, {
      newName,
      copyTasks,
    });
    return mapBackendProject(response.data);
  }

  /**
   * Get project statistics
   */
  async getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
    const response = await projectManagementApi.get<BackendResponse<any>>(`/projects/${projectId}/statistics`);
    return mapBackendStatistics(response.data);
  }

  /**
   * Fetch customers (workspaces)
   */
  async fetchCustomers(): Promise<Customer[]> {
    return projectManagementApi.get<Customer[]>('/customers');
  }

  /**
   * Get a single customer by ID
   */
  async getCustomer(id: string): Promise<Customer> {
    return projectManagementApi.get<Customer>(`/customers/${id}`);
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: { name: string; email: string; subscription?: string }): Promise<Customer> {
    return projectManagementApi.post<Customer>('/customers', data);
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, data: { name?: string; email?: string; subscription?: string }): Promise<Customer> {
    return projectManagementApi.patch<Customer>(`/customers/${id}`, data);
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<void> {
    return projectManagementApi.delete(`/customers/${id}`);
  }

  /**
   * Get project team members
   */
  async getProjectTeam(projectId: string): Promise<any[]> {
    const response = await projectManagementApi.get<BackendResponse<any[]>>(`/projects/${projectId}/team`);
    return response.data || [];
  }

  /**
   * Assign user to project
   */
  async assignUserToProject(data: {
    projectId: string;
    userId: string;
    role: string;
    quota?: number;
  }): Promise<any> {
    const { projectId, ...body } = data;
    const response = await projectManagementApi.post<BackendResponse<any>>(
      `/projects/${projectId}/team`,
      body,
    );
    return response.data;
  }

  /**
   * Update team member
   */
  async updateTeamMember(
    projectId: string,
    userId: string,
    data: { quota?: number; isActive?: boolean },
  ): Promise<any> {
    const response = await projectManagementApi.patch<BackendResponse<any>>(
      `/projects/${projectId}/team/${userId}`,
      data,
    );
    return response.data;
  }

  /**
   * Remove user from project
   */
  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    await projectManagementApi.delete(`/projects/${projectId}/team/${userId}`);
  }
}

// Export singleton instance
export const projectService = new ProjectService();
