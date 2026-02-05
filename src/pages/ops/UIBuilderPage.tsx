/**
 * UI Builder Page
 * Main entry point for project managers to create dynamic UIs
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UIBuilder } from '../../components/uibuilder/UIBuilder';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { 
  createUIConfiguration, 
  updateUIConfiguration, 
  getUIConfiguration 
} from '../../services/uiConfigurationService';

export const UIBuilderPage = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialConfig, setInitialConfig] = useState<any>(null);

  // Load existing configuration if editing
  useEffect(() => {
    if (projectId && projectId !== 'new') {
      loadConfiguration();
    }
  }, [projectId]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await getUIConfiguration(projectId!);
      setInitialConfig(response.configuration);
    } catch (error: any) {
      // If no configuration exists yet, that's okay
      if (error.response?.status !== 404) {
        console.error('Failed to load configuration:', error);
        setError('Failed to load existing configuration');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (configuration: any) => {
    if (!projectId || projectId === 'new') {
      // No project selected - download JSON instead
      const json = JSON.stringify(configuration, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ui-configuration-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if configuration already exists
      const configData = {
        name: configuration.name || `UI Configuration for Project ${projectId}`,
        description: configuration.description || 'Dynamic UI configuration',
        configuration,
      };

      try {
        // Try to update first
        await updateUIConfiguration(projectId, configData);
      } catch (updateError: any) {
        // If update fails, try to create
        if (updateError.response?.status === 404) {
          await createUIConfiguration(projectId, configData);
        } else {
          throw updateError;
        }
      }

      // Navigate back to project edit page
      navigate(`/ops/projects/${projectId}/edit`);
    } catch (error: any) {
      console.error('Failed to save UI configuration:', error);
      setError(error.response?.data?.message || 'Failed to save UI configuration');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !initialConfig) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading UI configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">UI Builder</h1>
              <p className="text-sm text-gray-600 mt-1">
                {projectId && projectId !== 'new'
                  ? `Create dynamic annotation interface for project ${projectId}`
                  : 'Create dynamic annotation interface'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* UI Builder */}
      <div className="flex-1 overflow-hidden">
        <UIBuilder
          projectId={projectId || 'new'}
          initialConfiguration={initialConfig}
          onSave={handleSave}
        />
      </div>

      {/* Save Status */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium text-gray-900">Saving configuration...</span>
          </div>
        </div>
      )}
    </div>
  );
};
