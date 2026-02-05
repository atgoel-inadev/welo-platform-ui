/**
 * UI Configuration API Service
 * Handles all API calls for UI configuration management
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface UIConfiguration {
  id?: string;
  version?: string;
  name: string;
  description?: string;
  fileType: 'TEXT' | 'MARKDOWN' | 'HTML' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'CSV' | 'PDF';
  responseType: 'TEXT' | 'SINGLE_SELECT' | 'MULTI_SELECT' | 'RATING' | 'BOOLEAN' | 'NUMBER' | 'DATE' | 'STRUCTURED';
  widgets: Array<any>;
  layout?: any;
  styles?: any;
  behaviors?: any;
  metadata?: any;
}

export interface UIConfigurationVersion {
  version: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  totalWidgets: number;
}

export interface UIConfigurationResponse {
  id: string;
  version: string;
  name: string;
  description?: string;
  configuration: UIConfiguration;
  projectId: string;
  createdBy: string;
  createdAt: string;
  metadata?: {
    totalWidgets: number;
    fileType: string;
    responseType: string;
    pipelineModes: string[];
  };
}

/**
 * Create or update UI configuration for a project
 */
export const createUIConfiguration = async (
  projectId: string,
  config: {
    name?: string;
    description?: string;
    configuration: UIConfiguration;
  }
): Promise<UIConfigurationResponse> => {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/projects/${projectId}/ui-configurations`,
    config
  );
  return response.data;
};

/**
 * Get current UI configuration for a project
 */
export const getUIConfiguration = async (projectId: string): Promise<UIConfigurationResponse> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/projects/${projectId}/ui-configurations`
  );
  return response.data;
};

/**
 * Update UI configuration
 */
export const updateUIConfiguration = async (
  projectId: string,
  config: {
    name?: string;
    description?: string;
    configuration: UIConfiguration;
  }
): Promise<UIConfigurationResponse> => {
  const response = await axios.put(
    `${API_BASE_URL}/api/v1/projects/${projectId}/ui-configurations`,
    config
  );
  return response.data;
};

/**
 * Get all versions of UI configuration
 */
export const getUIConfigurationVersions = async (
  projectId: string
): Promise<UIConfigurationVersion[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/projects/${projectId}/ui-configurations/versions`
  );
  return response.data;
};

/**
 * Get specific version of UI configuration
 */
export const getUIConfigurationVersion = async (
  projectId: string,
  version: string
): Promise<UIConfigurationResponse> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/projects/${projectId}/ui-configurations/versions/${version}`
  );
  return response.data;
};

/**
 * Rollback to specific version
 */
export const rollbackUIConfiguration = async (
  projectId: string,
  version: string
): Promise<UIConfigurationResponse> => {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/projects/${projectId}/ui-configurations/versions/${version}/rollback`
  );
  return response.data;
};

/**
 * Delete UI configuration
 */
export const deleteUIConfiguration = async (projectId: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/v1/projects/${projectId}/ui-configurations`);
};

/**
 * Export UI configuration as JSON
 */
export const exportUIConfiguration = (config: UIConfiguration): string => {
  return JSON.stringify(config, null, 2);
};

/**
 * Import UI configuration from JSON
 */
export const importUIConfiguration = (jsonString: string): UIConfiguration => {
  try {
    const config = JSON.parse(jsonString);
    // Basic validation
    if (!config.fileType || !config.responseType || !config.widgets) {
      throw new Error('Invalid UI configuration format');
    }
    return config;
  } catch (error) {
    throw new Error(`Failed to import configuration: ${error.message}`);
  }
};
