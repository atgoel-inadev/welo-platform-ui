import { workflowEngineApi } from '../lib/apiClient';
import { Workflow, WorkflowStatus } from '../types/workflow';

/**
 * API Response types matching backend structure
 */
export interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Workflow DTOs matching backend expectations
 */
export interface CreateWorkflowDto {
  name: string;
  description?: string;
  projectId?: string;
  xstateDefinition: any;
  stateSchema?: any;
  eventSchema?: any[];
  visualizationConfig?: any;
  isTemplate?: boolean;
  parentWorkflowId?: string;
  metadata?: any;
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  xstateDefinition?: any;
  stateSchema?: any;
  eventSchema?: any[];
  status?: WorkflowStatus;
  visualizationConfig?: any;
  metadata?: any;
}

export interface WorkflowFilterParams {
  projectId?: string;
  status?: WorkflowStatus;
  isTemplate?: boolean;
}

export interface SimulateWorkflowDto {
  initialContext: any;
  events: Array<{ type: string; payload?: any }>;
}

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  visualizationUrl?: string;
}

/**
 * Workflow Service - Integrates with Workflow Engine (port 3007)
 * All methods use Backend API exclusively
 */
class WorkflowService {
  /**
   * Fetch all workflows with optional filters
   * Backend: GET /workflows?projectId=&status=&isTemplate=
   */
  async fetchWorkflows(filters?: WorkflowFilterParams): Promise<Workflow[]> {
    const params = new URLSearchParams();
    
    if (filters?.projectId) {
      params.append('projectId', filters.projectId);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.isTemplate !== undefined) {
      params.append('isTemplate', String(filters.isTemplate));
    }

    const queryString = params.toString();
    const url = queryString ? `/workflows?${queryString}` : '/workflows';
    
    const response = await workflowEngineApi.get<BackendResponse<Workflow[]>>(url);
    return response.data;
  }

  /**
   * Fetch single workflow by ID
   * Backend: GET /workflows/:id
   */
  async fetchWorkflowById(workflowId: string): Promise<Workflow> {
    const response = await workflowEngineApi.get<BackendResponse<Workflow>>(`/workflows/${workflowId}`);
    return response.data;
  }

  /**
   * Create a new workflow
   * Backend: POST /workflows
   */
  async createWorkflow(input: CreateWorkflowDto): Promise<Workflow> {
    const response = await workflowEngineApi.post<BackendResponse<Workflow>>('/workflows', input);
    return response.data;
  }

  /**
   * Update an existing workflow
   * Backend: PATCH /workflows/:id
   */
  async updateWorkflow(workflowId: string, input: UpdateWorkflowDto): Promise<Workflow> {
    const response = await workflowEngineApi.patch<BackendResponse<Workflow>>(
      `/workflows/${workflowId}`,
      input
    );
    return response.data;
  }

  /**
   * Delete a workflow
   * Backend: DELETE /workflows/:id
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    await workflowEngineApi.delete(`/workflows/${workflowId}`);
  }

  /**
   * Validate workflow definition
   * Backend: POST /workflows/:id/validate
   */
  async validateWorkflow(workflowId: string): Promise<WorkflowValidationResult> {
    const response = await workflowEngineApi.post<BackendResponse<WorkflowValidationResult>>(
      `/workflows/${workflowId}/validate`
    );
    return response.data;
  }

  /**
   * Simulate workflow execution
   * Backend: POST /workflows/:id/simulate
   */
  async simulateWorkflow(workflowId: string, simulation: SimulateWorkflowDto): Promise<any> {
    const response = await workflowEngineApi.post<BackendResponse<any>>(
      `/workflows/${workflowId}/simulate`,
      simulation
    );
    return response.data;
  }

  /**
   * Get workflow visualization config
   * Backend: GET /workflows/:id/visualization
   */
  async getWorkflowVisualization(workflowId: string): Promise<{
    workflowId: string;
    visualizationConfig: any;
    xstateDefinition: any;
    message: string;
  }> {
    const response = await workflowEngineApi.get<BackendResponse<any>>(
      `/workflows/${workflowId}/visualization`
    );
    return response.data;
  }

  /**
   * Publish a workflow (change status to active)
   * Note: Backend has POST /workflows/:id/publish endpoint
   * This is a convenience method using update
   */
  async publishWorkflow(workflowId: string): Promise<Workflow> {
    return this.updateWorkflow(workflowId, { status: 'active' });
  }

  /**
   * Archive a workflow (change status to archived)
   */
  async archiveWorkflow(workflowId: string): Promise<Workflow> {
    return this.updateWorkflow(workflowId, { status: 'archived' });
  }

  /**
   * Clone/duplicate a workflow
   * Creates a new workflow based on existing one
   */
  async cloneWorkflow(
    workflowId: string,
    newName: string,
    newProjectId?: string
  ): Promise<Workflow> {
    // First fetch the original workflow
    const original = await this.fetchWorkflowById(workflowId);

    // Create new workflow with cloned data
    const cloneDto: CreateWorkflowDto = {
      name: newName,
      description: `Cloned from: ${original.name}`,
      projectId: newProjectId || original.project_id,
      xstateDefinition: original.flow_data, // Assuming flow_data maps to xstateDefinition
      metadata: {
        ...original,
        clonedFrom: workflowId,
        clonedAt: new Date().toISOString(),
      },
    };

    return this.createWorkflow(cloneDto);
  }
}

// Export singleton instance
export const workflowService = new WorkflowService();
export default workflowService;
