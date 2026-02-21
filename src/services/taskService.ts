import { taskManagementApi } from '../lib/apiClient';
import { TaskStatus } from '../types';

/**
 * Backend API Response Types
 */
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Task Interfaces
 */
export interface Task {
  id: string;
  batchId: string;
  projectId: string;
  workflowId: string;
  externalId: string;
  taskType: 'ANNOTATION' | 'REVIEW' | 'VALIDATION';
  status: TaskStatus;
  priority: number;
  dueDate?: string;
  fileType?: 'CSV' | 'TXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'JSON' | 'HTML' | 'MARKDOWN';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMetadata?: any;
  dataPayload: {
    sourceData: any;
    references?: any[];
    context?: any;
  };
  estimatedDuration?: number;
  actualDuration?: number;
  requiresConsensus: boolean;
  totalAssignmentsRequired: number;
  completedAssignments: number;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  taskId: string;
  userId: string;
  workflowStage: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'RELEASED';
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
  assignmentMethod: 'MANUAL' | 'AUTOMATIC' | 'CLAIMED';
  task?: Task;
}

export interface AnnotationResponse {
  questionId: string;
  response: any;
  timeSpent?: number;
  confidenceScore?: number;
}

export interface TaskStatistics {
  taskId: string;
  totalAnnotations: number;
  completedAnnotations: number;
  averageConfidenceScore: number;
  averageTimeSpent: number;
  consensusScore?: number;
  consensusReached: boolean;
  currentReviewLevel: number;
  reviewsApproved: number;
  reviewsRejected: number;
  qualityScore?: number;
}

/**
 * DTOs for API requests
 */
export interface GetNextTaskDto {
  userId: string;
  queueId?: string;
  taskType?: string;
  projectId?: string;
}

export interface SubmitTaskDto {
  assignmentId: string;
  annotationData: any;
  confidenceScore?: number;
  timeSpent?: number;
  responses?: AnnotationResponse[];
}

export interface UpdateTaskStatusDto {
  status: TaskStatus;
  reason?: string;
  metadata?: any;
}

export interface TaskFilterDto {
  batchId?: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: number;
  assignedTo?: string;
  taskType?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Review-specific interfaces
 */
export interface TaskAnnotation {
  id: string;
  taskId: string;
  assignmentId: string;
  userId: string;
  userName?: string;
  annotationData: any;
  responses: AnnotationResponse[];
  timeSpent: number;
  confidenceScore?: number;
  submittedAt: string;
  reviewStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  reviewFeedback?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ReviewSubmitDto {
  annotationId: string;
  decision: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
  feedback?: string;
  qualityScore?: number;
  tags?: string[];
}

export interface ConsensusData {
  taskId: string;
  totalAnnotations: number;
  requiredAnnotations: number;
  consensusReached: boolean;
  consensusScore: number;
  agreedResponses: Record<string, any>;
  disagreedResponses: Record<string, any[]>;
  annotationComparison: {
    annotationId: string;
    userId: string;
    responses: Record<string, any>;
    agreement: number;
  }[];
}

/**
 * Task Service
 * Integrates with Task Management backend service (port 3003)
 */
export class TaskService {
  /**
   * Get tasks assigned to current user.
   * Backend listTasks returns { tasks, total, page, pageSize } — not a { success, data } envelope.
   * Tasks are wrapped as Assignment-shaped objects so TaskQueue can render them.
   */
  async getMyTasks(userId: string, status?: 'ASSIGNED' | 'IN_PROGRESS'): Promise<Assignment[]> {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);

    const url = `/tasks?${queryParams.toString()}`;
    const response = await taskManagementApi.get<{ tasks: Task[]; total: number; page: number; pageSize: number }>(url);
    const tasks: Task[] = response.tasks || [];

    // Wrap each task as an Assignment so TaskQueue can iterate over assignment.task
    return tasks.map((task) => ({
      id: task.id,
      taskId: task.id,
      userId,
      workflowStage: 'ANNOTATION',
      status: 'ASSIGNED' as const,
      assignedAt: task.createdAt,
      expiresAt: new Date(Date.now() + 28_800_000).toISOString(),
      assignmentMethod: 'AUTOMATIC' as const,
      task,
    }));
  }

  /**
   * Pull next available task from queue (FIFO).
   * Backend returns the raw Task entity directly (not wrapped in { success, data }).
   * On no tasks: returns { message, task: null }.
   */
  async pullNextTask(dto: GetNextTaskDto): Promise<Task | null> {
    try {
      const response = await taskManagementApi.post<Task | { message: string; task: null }>('/tasks/next', dto);
      if (!response || (response as any).task === null || (response as any).message === 'No available tasks') {
        return null;
      }
      return response as Task;
    } catch (error: any) {
      if (error.message?.includes('No available tasks')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get detailed task information.
   * Backend returns the raw Task entity directly.
   */
  async getTaskDetails(taskId: string): Promise<Task> {
    const response = await taskManagementApi.get<Task>(`/tasks/${taskId}`);
    return response;
  }

  /**
   * Submit task with annotation data
   */
  async submitTask(taskId: string, dto: SubmitTaskDto): Promise<{ success: boolean; message: string }> {
    const response = await taskManagementApi.post<any>(`/tasks/${taskId}/submit`, dto);
    return {
      success: true,
      message: (response as any)?.message || 'Task submitted successfully',
    };
  }

  /**
   * Update task status (skip, hold, etc.)
   * Backend returns the raw Task entity directly.
   */
  async updateTaskStatus(taskId: string, dto: UpdateTaskStatusDto): Promise<Task> {
    const response = await taskManagementApi.patch<Task>(`/tasks/${taskId}/status`, dto);
    return response;
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(taskId: string): Promise<TaskStatistics> {
    const response = await taskManagementApi.get<TaskStatistics>(`/tasks/${taskId}/statistics`);
    return response;
  }

  /**
   * List tasks with filters.
   * Backend returns { tasks, total, page, pageSize } — not a { success, data } envelope.
   */
  async listTasks(filters: TaskFilterDto): Promise<PaginatedResponse<Task>> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `/tasks?${queryParams.toString()}`;
    const response = await taskManagementApi.get<{ tasks: Task[]; total: number; page: number; pageSize: number }>(url);

    return {
      data: response.tasks || [],
      total: response.total || 0,
      page: response.page || 1,
      limit: response.pageSize || 10,
    };
  }

  /**
   * Assign task to user
   */
  async assignTask(taskId: string, userId: string, workflowStage?: string): Promise<Assignment> {
    const response = await taskManagementApi.post<BackendResponse<Assignment>>(`/tasks/${taskId}/assign`, {
      userId,
      workflowStage,
    });
    return response.data;
  }

  /**
   * Get signed URL for file download
   */
  async getFileSignedUrl(_fileId: string): Promise<{ url: string; expiresAt: string }> {
    // TODO: Implement file service endpoint
    // For now, files are accessed directly via fileUrl in task
    throw new Error('File service not yet implemented - use task.fileUrl directly');
  }

  /**
   * Skip a task with a reason
   */
  async skipTask(taskId: string, reason: string): Promise<Task> {
    return this.updateTaskStatus(taskId, {
      status: TaskStatus.SKIPPED,
      reason,
    });
  }

  /**
   * REVIEWER METHODS
   */

  /**
   * Get tasks for review — tasks that have been annotated (status = SUBMITTED).
   * Backend returns { tasks, total, page, pageSize } — not a { success, data } envelope.
   * The taskType filter is intentionally NOT used because all tasks are ANNOTATION type;
   * instead we filter by status SUBMITTED (annotation done, awaiting review).
   */
  async getTasksForReview(_userId: string, filters?: Partial<TaskFilterDto>): Promise<Task[]> {
    const params: Record<string, any> = {
      status: filters?.status || 'SUBMITTED',
    };
    if (filters?.projectId) params.projectId = filters.projectId;
    if (filters?.batchId) params.batchId = filters.batchId;
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;

    const response = await taskManagementApi.get<{ tasks: Task[]; total: number }>('/tasks', { params });
    return response.tasks || [];
  }

  /**
   * Get all annotations for a specific task (for comparison/consensus).
   * Backend returns array directly.
   */
  async getTaskAnnotations(taskId: string): Promise<TaskAnnotation[]> {
    const response = await taskManagementApi.get<TaskAnnotation[]>(
      `/tasks/${taskId}/annotations`
    );
    return Array.isArray(response) ? response : [];
  }

  /**
   * Get consensus data for a task (agreement analysis between annotators)
   */
  async getTaskConsensus(taskId: string): Promise<ConsensusData> {
    const response = await taskManagementApi.get<ConsensusData>(
      `/tasks/${taskId}/consensus`
    );
    return response;
  }

  /**
   * Submit review decision for an annotation
   */
  async submitReview(taskId: string, dto: ReviewSubmitDto): Promise<void> {
    await taskManagementApi.post(`/tasks/${taskId}/review`, dto);
  }

  /**
   * Approve an annotation
   */
  async approveAnnotation(
    taskId: string,
    annotationId: string,
    feedback?: string,
    qualityScore?: number
  ): Promise<void> {
    return this.submitReview(taskId, {
      annotationId,
      decision: 'APPROVED',
      feedback,
      qualityScore,
    });
  }

  /**
   * Reject an annotation
   */
  async rejectAnnotation(
    taskId: string,
    annotationId: string,
    feedback: string,
    qualityScore?: number
  ): Promise<void> {
    return this.submitReview(taskId, {
      annotationId,
      decision: 'REJECTED',
      feedback,
      qualityScore,
    });
  }

  /**
   * Request revision for an annotation
   */
  async requestRevision(
    taskId: string,
    annotationId: string,
    feedback: string
  ): Promise<void> {
    return this.submitReview(taskId, {
      annotationId,
      decision: 'NEEDS_REVISION',
      feedback,
    });
  }

  /**
   * Get task statistics including quality metrics
   */
  async getTaskQualityMetrics(taskId: string): Promise<TaskStatistics> {
    const response = await taskManagementApi.get<TaskStatistics>(
      `/tasks/${taskId}/statistics`
    );
    return response;
  }
}

// Export singleton instance
export const taskService = new TaskService();
