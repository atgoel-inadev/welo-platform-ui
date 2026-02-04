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
   * Get tasks assigned to current user
   */
  async getMyTasks(userId: string, status?: 'ASSIGNED' | 'IN_PROGRESS'): Promise<Assignment[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('assignedTo', userId);
    if (status) queryParams.append('status', status);

    const url = `/tasks?${queryParams.toString()}`;
    const response = await taskManagementApi.get<BackendResponse<Assignment[]>>(url);
    return response.data;
  }

  /**
   * Pull next available task from queue (FIFO)
   */
  async pullNextTask(dto: GetNextTaskDto): Promise<Task | null> {
    try {
      const response = await taskManagementApi.post<BackendResponse<Task>>('/tasks/next', dto);
      return response.data;
    } catch (error: any) {
      // Return null if no tasks available
      if (error.message?.includes('No available tasks')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get detailed task information
   */
  async getTaskDetails(taskId: string): Promise<Task> {
    const response = await taskManagementApi.get<BackendResponse<Task>>(`/tasks/${taskId}`);
    return response.data;
  }

  /**
   * Submit task with annotation data
   */
  async submitTask(taskId: string, dto: SubmitTaskDto): Promise<{ success: boolean; message: string }> {
    const response = await taskManagementApi.post<BackendResponse<any>>(`/tasks/${taskId}/submit`, dto);
    return {
      success: response.success,
      message: response.message || 'Task submitted successfully',
    };
  }

  /**
   * Update task status (skip, hold, etc.)
   */
  async updateTaskStatus(taskId: string, dto: UpdateTaskStatusDto): Promise<Task> {
    const response = await taskManagementApi.patch<BackendResponse<Task>>(`/tasks/${taskId}/status`, dto);
    return response.data;
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(taskId: string): Promise<TaskStatistics> {
    const response = await taskManagementApi.get<BackendResponse<TaskStatistics>>(`/tasks/${taskId}/statistics`);
    return response.data;
  }

  /**
   * List tasks with filters
   */
  async listTasks(filters: TaskFilterDto): Promise<PaginatedResponse<Task>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `/tasks?${queryParams.toString()}`;
    const response = await taskManagementApi.get<BackendResponse<Task[]>>(url);

    return {
      data: response.data,
      total: response.pagination?.totalItems || 0,
      page: response.pagination?.page || 1,
      limit: response.pagination?.pageSize || 10,
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
  async getFileSignedUrl(fileId: string): Promise<{ url: string; expiresAt: string }> {
    // TODO: Implement file service endpoint
    // For now, files are accessed directly via fileUrl in task
    throw new Error('File service not yet implemented - use task.fileUrl directly');
  }

  /**
   * Skip a task with a reason
   */
  async skipTask(taskId: string, reason: string): Promise<Task> {
    return this.updateTaskStatus(taskId, {
      status: 'SKIPPED',
      reason,
    });
  }

  /**
   * REVIEWER METHODS
   */

  /**
   * Get tasks for review (tasks with status PENDING_REVIEW or REVIEW_IN_PROGRESS)
   */
  async getTasksForReview(userId: string, filters?: Partial<TaskFilterDto>): Promise<Task[]> {
    const response = await taskManagementApi.get<BackendResponse<PaginatedResponse<Task>>>('/tasks', {
      params: {
        taskType: 'REVIEW',
        ...filters,
      },
    });
    return response.data.data;
  }

  /**
   * Get all annotations for a specific task (for comparison/consensus)
   */
  async getTaskAnnotations(taskId: string): Promise<TaskAnnotation[]> {
    const response = await taskManagementApi.get<BackendResponse<TaskAnnotation[]>>(
      `/tasks/${taskId}/annotations`
    );
    return response.data;
  }

  /**
   * Get consensus data for a task (agreement analysis between annotators)
   */
  async getTaskConsensus(taskId: string): Promise<ConsensusData> {
    const response = await taskManagementApi.get<BackendResponse<ConsensusData>>(
      `/tasks/${taskId}/consensus`
    );
    return response.data;
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
    const response = await taskManagementApi.get<BackendResponse<TaskStatistics>>(
      `/tasks/${taskId}/statistics`
    );
    return response.data;
  }
}

// Export singleton instance
export const taskService = new TaskService();
