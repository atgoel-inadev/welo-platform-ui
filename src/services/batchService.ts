import { projectManagementApi, taskManagementApi } from '../lib/apiClient';

/**
 * Batch Service DTOs
 */
export interface CreateBatchDto {
  projectId: string;
  name: string;
  description?: string;
  priority?: number;
  dueDate?: string;
}

export interface FileAllocationDto {
  externalId: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  metadata?: Record<string, any>;
}

export interface AllocateFilesDto {
  files: FileAllocationDto[];
  autoAssign?: boolean;
  assignmentMethod?: 'AUTO_ROUND_ROBIN' | 'AUTO_WORKLOAD_BASED' | 'AUTO_SKILL_BASED';
  taskType?: string;
  priority?: number;
  dueDate?: string;
}

/**
 * Directory Scan DTO (for DEMO mode)
 */
export interface ScanDirectoryDto {
  directoryPath?: string; // Optional: defaults to {projectId}/{batchName}
  filePattern?: string; // e.g., "*.jpg", "*.mp4"
  taskType?: string;
  autoAssign?: boolean;
  assignmentMethod?: 'AUTO_ROUND_ROBIN' | 'AUTO_WORKLOAD_BASED' | 'AUTO_SKILL_BASED';
}

export interface ScanDirectoryResponse {
  tasks: Task[];
  scannedFiles: number;
  createdTasks: number;
  errors: string[];
}

export interface Batch {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  priority: number;
  totalTasks: number;
  completedTasks: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchStatistics {
  batchId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  queuedTasks: number;
  failedTasks: number;
  assignmentBreakdown: {
    manual: number;
    autoAssigned: number;
    unassigned: number;
  };
  qualityScore?: number;
  averageTaskDuration?: number;
  completionPercentage: number;
}

export interface Task {
  id: string;
  batchId: string;
  projectId: string;
  externalId: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  status: string;
  assignedTo?: string;
  workflowStage?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Batch Service API Client
 * Uses centralized apiClient instances for automatic token injection and error handling.
 * Batch CRUD and management endpoints are on project-management service (port 3004).
 * Task listing by batch uses task-management service (port 3003).
 */
class BatchService {
  /**
   * Create a new batch
   */
  async createBatch(dto: CreateBatchDto): Promise<Batch> {
    return projectManagementApi.post<Batch>('/batches', dto);
  }

  /**
   * Allocate files to a batch and create tasks
   */
  async allocateFiles(batchId: string, dto: AllocateFilesDto): Promise<Task[]> {
    return projectManagementApi.post<Task[]>(`/batches/${batchId}/allocate-files`, dto);
  }

  /**
   * Get batch statistics
   */
  async getBatchStatistics(batchId: string): Promise<BatchStatistics> {
    return projectManagementApi.get<BatchStatistics>(`/batches/${batchId}/statistics`);
  }

  /**
   * List batches (optionally filtered by projectId)
   */
  async listBatches(projectId?: string): Promise<Batch[]> {
    const params = projectId ? { params: { projectId } } : undefined;
    return projectManagementApi.get<Batch[]>('/batches', params);
  }

  /**
   * Get a single batch by ID
   */
  async getBatch(batchId: string): Promise<Batch> {
    return projectManagementApi.get<Batch>(`/batches/${batchId}`);
  }

  /**
   * Update batch
   */
  async updateBatch(batchId: string, updates: Partial<CreateBatchDto>): Promise<Batch> {
    return projectManagementApi.patch<Batch>(`/batches/${batchId}`, updates);
  }

  /**
   * Complete a batch
   */
  async completeBatch(batchId: string): Promise<Batch> {
    return projectManagementApi.post<Batch>(`/batches/${batchId}/complete`, {});
  }

  /**
   * Get tasks for a batch (from task-management service)
   */
  async getBatchTasks(batchId: string): Promise<Task[]> {
    const response = await taskManagementApi.get<{ tasks: Task[] }>('/tasks', {
      params: { batchId },
    });
    return response.tasks;
  }

  /**
   * Manual task assignment
   */
  async assignTask(taskId: string, userId: string, workflowStage: string = 'ANNOTATION'): Promise<Task> {
    return taskManagementApi.post<Task>(`/tasks/${taskId}/assign`, {
      userId,
      workflowStage,
    });
  }

  /**
   * Auto-assign unassigned tasks in a batch
   */
  async autoAssignTasks(
    batchId: string,
    method: 'AUTO_ROUND_ROBIN' | 'AUTO_WORKLOAD_BASED' | 'AUTO_SKILL_BASED' = 'AUTO_ROUND_ROBIN'
  ): Promise<{ assignedCount: number; tasks: Task[] }> {
    return projectManagementApi.post<{ assignedCount: number; tasks: Task[] }>(
      `/batches/${batchId}/auto-assign`,
      { assignmentMethod: method },
    );
  }

  /**
   * Reassign a task to a different user
   */
  async reassignTask(taskId: string, newUserId: string): Promise<{ task: Task; assignment: any }> {
    return taskManagementApi.post<{ task: Task; assignment: any }>(`/tasks/${taskId}/reassign`, {
      newUserId,
    });
  }

  /**
   * Unassign a task
   */
  async unassignTask(taskId: string): Promise<Task> {
    return taskManagementApi.post<Task>(`/tasks/${taskId}/unassign`, {});
  }

  /**
   * TACTICAL DEMO MODE: Scan directory and create tasks
   * Scans local directory mapped via Docker volume and creates tasks
   */
  async scanDirectory(
    batchId: string,
    options?: ScanDirectoryDto
  ): Promise<ScanDirectoryResponse> {
    return projectManagementApi.post<ScanDirectoryResponse>(
      `/batches/${batchId}/scan-directory`,
      options || {}
    );
  }
}

export const batchService = new BatchService();
