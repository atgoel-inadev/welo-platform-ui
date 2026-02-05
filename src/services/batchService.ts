import axios from 'axios';

const API_BASE = 'http://localhost:3004/api/v1';

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
  assignmentCounts: Record<string, number>;
  qualityScore?: number;
  averageTaskDuration?: number;
  completionRate: number;
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
  priority: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Batch Service API Client
 */
class BatchService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Create a new batch
   */
  async createBatch(dto: CreateBatchDto): Promise<Batch> {
    try {
      const response = await axios.post(
        `${API_BASE}/batches`,
        dto,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to create batch:', error);
      throw new Error(error.response?.data?.message || 'Failed to create batch');
    }
  }

  /**
   * Allocate files to a batch and create tasks
   */
  async allocateFiles(batchId: string, dto: AllocateFilesDto): Promise<Task[]> {
    try {
      const response = await axios.post(
        `${API_BASE}/batches/${batchId}/allocate-files`,
        dto,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to allocate files:', error);
      throw new Error(error.response?.data?.message || 'Failed to allocate files');
    }
  }

  /**
   * Get batch statistics
   */
  async getBatchStatistics(batchId: string): Promise<BatchStatistics> {
    try {
      const response = await axios.get(
        `${API_BASE}/batches/${batchId}/statistics`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get batch statistics:', error);
      throw new Error(error.response?.data?.message || 'Failed to get batch statistics');
    }
  }

  /**
   * List batches (optionally filtered by projectId)
   */
  async listBatches(projectId?: string): Promise<Batch[]> {
    try {
      const params = projectId ? { projectId } : {};
      const response = await axios.get(
        `${API_BASE}/batches`,
        { 
          headers: this.getAuthHeaders(),
          params 
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to list batches:', error);
      throw new Error(error.response?.data?.message || 'Failed to list batches');
    }
  }

  /**
   * Get a single batch by ID
   */
  async getBatch(batchId: string): Promise<Batch> {
    try {
      const response = await axios.get(
        `${API_BASE}/batches/${batchId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get batch:', error);
      throw new Error(error.response?.data?.message || 'Failed to get batch');
    }
  }

  /**
   * Update batch
   */
  async updateBatch(batchId: string, updates: Partial<CreateBatchDto>): Promise<Batch> {
    try {
      const response = await axios.patch(
        `${API_BASE}/batches/${batchId}`,
        updates,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to update batch:', error);
      throw new Error(error.response?.data?.message || 'Failed to update batch');
    }
  }

  /**
   * Complete a batch
   */
  async completeBatch(batchId: string): Promise<Batch> {
    try {
      const response = await axios.post(
        `${API_BASE}/batches/${batchId}/complete`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to complete batch:', error);
      throw new Error(error.response?.data?.message || 'Failed to complete batch');
    }
  }

  /**
   * Get tasks for a batch
   */
  async getBatchTasks(batchId: string): Promise<Task[]> {
    try {
      const response = await axios.get(
        `${API_BASE}/tasks`,
        { 
          headers: this.getAuthHeaders(),
          params: { batchId }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get batch tasks:', error);
      throw new Error(error.response?.data?.message || 'Failed to get batch tasks');
    }
  }

  /**
   * Manual task assignment
   */
  async assignTask(taskId: string, userId: string, workflowStage: string = 'annotation'): Promise<Task> {
    try {
      const response = await axios.post(
        `${API_BASE}/batches/assign-task`,
        { taskId, userId, workflowStage },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to assign task:', error);
      throw new Error(error.response?.data?.message || 'Failed to assign task');
    }
  }

  /**
   * Auto-assign unassigned tasks in a batch
   */
  async autoAssignTasks(
    batchId: string, 
    method: 'AUTO_ROUND_ROBIN' | 'AUTO_WORKLOAD_BASED' | 'AUTO_SKILL_BASED' = 'AUTO_ROUND_ROBIN'
  ): Promise<{ assignedCount: number; tasks: Task[] }> {
    try {
      const response = await axios.post(
        `${API_BASE}/batches/${batchId}/auto-assign`,
        { assignmentMethod: method },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to auto-assign tasks:', error);
      throw new Error(error.response?.data?.message || 'Failed to auto-assign tasks');
    }
  }

  /**
   * Reassign a task to a different user
   */
  async reassignTask(taskId: string, newUserId: string): Promise<Task> {
    try {
      const response = await axios.post(
        `${API_BASE}/batches/reassign-task`,
        { taskId, newUserId },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to reassign task:', error);
      throw new Error(error.response?.data?.message || 'Failed to reassign task');
    }
  }

  /**
   * Unassign a task
   */
  async unassignTask(taskId: string): Promise<Task> {
    try {
      const response = await axios.post(
        `${API_BASE}/batches/unassign-task`,
        { taskId },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to unassign task:', error);
      throw new Error(error.response?.data?.message || 'Failed to unassign task');
    }
  }
}

export const batchService = new BatchService();
