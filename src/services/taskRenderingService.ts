import { taskManagementApi } from '../lib/apiClient';

export interface AnnotationResponse {
  questionId: string;
  response: any;
}

export interface SaveAnnotationDto {
  responses: AnnotationResponse[];
  extraWidgetData?: Record<string, any>;
  timeSpent?: number;
}

export interface SaveReviewDto {
  decision: 'approved' | 'rejected' | 'needs_revision';
  comments?: string;
  qualityScore?: number;
  extraWidgetData?: Record<string, any>;
  timeSpent?: number;
}

export interface TaskRenderConfig {
  taskId: string;
  projectId: string;
  viewType: 'annotator' | 'reviewer';
  taskData: {
    id: string;
    name: string;
    description: string;
    fileUrls: string[];
    metadata: Record<string, any>;
    currentReviewLevel: number;
    status: string;
  };
  uiConfiguration: any;
  annotationQuestions: any[];
  previousAnnotations: any[] | null;
  annotationResponses: any[];
  extraWidgetData: Record<string, any>;
  reviewData: any[];
}

export interface AnnotationHistory {
  taskId: string;
  annotationResponses: any[];
  extraWidgetData: Record<string, any>;
  reviewData: any[];
  annotations: any[];
}

/**
 * Task Rendering Service
 * API client for task rendering endpoints
 */
export class TaskRenderingService {
  private static instance: TaskRenderingService;

  private constructor() {}

  static getInstance(): TaskRenderingService {
    if (!TaskRenderingService.instance) {
      TaskRenderingService.instance = new TaskRenderingService();
    }
    return TaskRenderingService.instance;
  }

  /**
   * Get task render configuration
   * Returns complete configuration for rendering task UI
   * 
   * @param taskId - Task ID
   * @param userId - User ID (temporary, should come from auth token)
   */
  async getTaskRenderConfig(taskId: string, userId: string): Promise<TaskRenderConfig> {
    try {
      const params = new URLSearchParams();
      params.append('userId', userId);
      const response = await taskManagementApi.get<TaskRenderConfig>(
        `/tasks/${taskId}/render-config?${params.toString()}`
      );
      return response;
    } catch (error: any) {
      console.error('Failed to get task render config:', error);
      throw error;
    }
  }

  /**
   * Save annotation response
   * Saves annotator responses to annotation questions + extra widget data
   * 
   * @param taskId - Task ID
   * @param userId - User ID (temporary)
   * @param data - Annotation data
   */
  async saveAnnotation(taskId: string, userId: string, data: SaveAnnotationDto): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.append('userId', userId);
      await taskManagementApi.post(
        `/tasks/${taskId}/annotation?${params.toString()}`,
        data
      );
    } catch (error: any) {
      console.error('Failed to save annotation:', error);
      throw error;
    }
  }

  /**
   * Save review decision
   * Saves reviewer decision + quality score + review widget data
   * 
   * @param taskId - Task ID
   * @param userId - User ID (temporary)
   * @param data - Review data
   */
  async saveReview(taskId: string, userId: string, data: SaveReviewDto): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.append('userId', userId);
      await taskManagementApi.post(
        `/tasks/${taskId}/review?${params.toString()}`,
        data
      );
    } catch (error: any) {
      console.error('Failed to save review:', error);
      throw error;
    }
  }

  /**
   * Get annotation history
   * Returns complete history of annotations and reviews for audit/tracking
   * 
   * @param taskId - Task ID
   */
  async getAnnotationHistory(taskId: string): Promise<AnnotationHistory> {
    try {
      const response = await taskManagementApi.get<AnnotationHistory>(
        `/tasks/${taskId}/annotation-history`
      );
      return response;
    } catch (error: any) {
      console.error('Failed to get annotation history:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const taskRenderingService = TaskRenderingService.getInstance();
