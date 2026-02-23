import { projectManagementApi, taskManagementApi } from '../lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiPluginConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>;
  payload?: string;
  responseMapping: { resultPath: string; messagePath?: string };
  timeout: number;   // ms, 1000–15000
  retries: number;   // 0–3
}

export type PluginType = 'API' | 'SCRIPT';
export type PluginTrigger = 'ON_BLUR' | 'ON_SUBMIT';
export type PluginFailBehavior = 'HARD_BLOCK' | 'SOFT_WARN' | 'ADVISORY';
export type PluginResult = 'PASS' | 'WARN' | 'FAIL' | 'ERROR' | 'TIMEOUT';

export interface Plugin {
  id: string;
  name: string;
  description?: string;
  type: PluginType;
  enabled: boolean;
  trigger: PluginTrigger;
  onFailBehavior: PluginFailBehavior;
  questionBindings: string[];   // [] = applies to all questions
  isDraft: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  deployedAt?: string;
  apiConfig?: ApiPluginConfig;
  scriptCode?: string;
}

export interface PluginCreateDto {
  name: string;
  description?: string;
  type: PluginType;
  trigger?: PluginTrigger;
  onFailBehavior?: PluginFailBehavior;
  questionBindings?: string[];
  apiConfig?: ApiPluginConfig;
  scriptCode?: string;
}

export interface PluginUpdateDto extends Partial<PluginCreateDto> {}

export interface SecretListItem {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface PluginExecutePayload {
  pluginId: string;
  projectId: string;
  questionId: string;
  questionText: string;
  questionType: string;
  answerValue: any;
  taskContext?: Record<string, any>;
}

export interface PluginExecuteResult {
  result: PluginResult;
  message?: string;
  executionTimeMs: number;
  onFailBehavior: PluginFailBehavior;
}

// ─── Plugin CRUD (project-management service) ─────────────────────────────────

export const pluginService = {
  async listPlugins(projectId: string): Promise<Plugin[]> {
    const res = await projectManagementApi.get<{ success: boolean; data: { plugins: Plugin[] } }>(
      `/projects/${projectId}/plugins`,
    );
    return res.data.plugins;
  },

  async createPlugin(projectId: string, dto: PluginCreateDto): Promise<Plugin> {
    const res = await projectManagementApi.post<{ success: boolean; data: { plugin: Plugin } }>(
      `/projects/${projectId}/plugins`,
      dto,
    );
    return res.data.plugin;
  },

  async updatePlugin(projectId: string, pluginId: string, dto: PluginUpdateDto): Promise<Plugin> {
    const res = await projectManagementApi.patch<{ success: boolean; data: { plugin: Plugin } }>(
      `/projects/${projectId}/plugins/${pluginId}`,
      dto,
    );
    return res.data.plugin;
  },

  async deletePlugin(projectId: string, pluginId: string): Promise<void> {
    await projectManagementApi.delete(`/projects/${projectId}/plugins/${pluginId}`);
  },

  async deployPlugin(projectId: string, pluginId: string): Promise<Plugin> {
    const res = await projectManagementApi.post<{ success: boolean; data: { plugin: Plugin } }>(
      `/projects/${projectId}/plugins/${pluginId}/deploy`,
    );
    return res.data.plugin;
  },

  async togglePlugin(projectId: string, pluginId: string, enabled: boolean): Promise<Plugin> {
    const res = await projectManagementApi.post<{ success: boolean; data: { plugin: Plugin } }>(
      `/projects/${projectId}/plugins/${pluginId}/toggle`,
      { enabled },
    );
    return res.data.plugin;
  },

  // ─── Secrets ──────────────────────────────────────────────────────────────

  async listSecrets(projectId: string): Promise<SecretListItem[]> {
    const res = await projectManagementApi.get<{ success: boolean; data: { secrets: SecretListItem[] } }>(
      `/projects/${projectId}/secrets`,
    );
    return res.data.secrets;
  },

  async createSecret(
    projectId: string,
    dto: { name: string; value: string; description?: string },
  ): Promise<SecretListItem> {
    const res = await projectManagementApi.post<{ success: boolean; data: { secret: SecretListItem } }>(
      `/projects/${projectId}/secrets`,
      dto,
    );
    return res.data.secret;
  },

  async deleteSecret(projectId: string, name: string): Promise<void> {
    await projectManagementApi.delete(`/projects/${projectId}/secrets/${name}`);
  },

  // ─── Plugin Execution (task-management service) ───────────────────────────

  async executePlugin(taskId: string, payload: PluginExecutePayload): Promise<PluginExecuteResult> {
    return taskManagementApi.post<PluginExecuteResult>(
      `/tasks/${taskId}/plugins/execute`,
      payload,
    );
  },
};

export default pluginService;
