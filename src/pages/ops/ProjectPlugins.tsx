import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Zap } from 'lucide-react';
import { pluginService, Plugin } from '../../services/pluginService';
import { projectManagementApi } from '../../lib/apiClient';
import { PluginList } from '../../components/plugins/PluginList';
import { SecretManagerPanel } from '../../components/plugins/SecretManagerPanel';
import { PluginEditorModal } from '../../components/plugins/PluginEditorModal';
import { Button } from '../../components/common';

export const ProjectPlugins = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [questions, setQuestions] = useState<Array<{ id: string; question: string }>>([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [pluginsData, projectResp] = await Promise.all([
        pluginService.listPlugins(projectId),
        projectManagementApi.get<{ success: boolean; data: any }>(`/projects/${projectId}`),
      ]);
      setPlugins(pluginsData);
      const projectData = projectResp.data;
      setProjectName(projectData?.name ?? '');
      const qs = projectData?.configuration?.annotationQuestions ?? [];
      setQuestions(qs.map((q: any) => ({ id: q.id, question: q.question })));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditingPlugin(null);
    setEditorOpen(true);
  };

  const openEdit = (plugin: Plugin) => {
    setEditingPlugin(plugin);
    setEditorOpen(true);
  };

  const handleDelete = async (pluginId: string) => {
    if (confirmDeleteId !== pluginId) {
      setConfirmDeleteId(pluginId);
      return;
    }
    await pluginService.deletePlugin(projectId!, pluginId);
    setConfirmDeleteId(null);
    await load();
  };

  const handleDeploy = async (pluginId: string) => {
    await pluginService.deployPlugin(projectId!, pluginId);
    await load();
  };

  const handleToggle = async (pluginId: string, enabled: boolean) => {
    await pluginService.togglePlugin(projectId!, pluginId, enabled);
    await load();
  };

  const handleSaved = async (plugin: Plugin) => {
    // Keep modal open so user can continue to Test tab
    setEditingPlugin(plugin);
    await load();
  };

  const handleDeployed = async (_plugin: Plugin) => {
    setEditorOpen(false);
    await load();
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb / Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/ops/projects/${projectId}/edit`)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-3"
          >
            <ArrowLeft size={14} />
            Back to Edit Project
          </button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Link to="/ops/projects" className="hover:underline">Projects</Link>
                <span>/</span>
                <Link to={`/ops/projects/${projectId}`} className="hover:underline">{projectName}</Link>
                <span>/</span>
                <span className="text-gray-700 font-medium">Plugins</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Zap size={22} className="text-blue-600" />
                Plugin Management
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Configure validation plugins that fire when annotators answer questions.
              </p>
            </div>
            <Button onClick={openNew} variant="primary" icon={Plus}>
              New Plugin
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6 items-start">
          {/* Left: Plugin list (70%) */}
          <div className="flex-1 min-w-0">
            {/* Confirm delete banner */}
            {confirmDeleteId && (
              <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
                <span>Are you sure you want to delete this plugin? This cannot be undone.</span>
                <div className="flex gap-3 ml-4">
                  <button
                    onClick={() => handleDelete(confirmDeleteId)}
                    className="font-semibold text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-gray-600 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <PluginList
              plugins={plugins}
              onEdit={openEdit}
              onDelete={handleDelete}
              onDeploy={handleDeploy}
              onToggle={handleToggle}
              onNew={openNew}
            />
          </div>

          {/* Right: Secret manager (30%) */}
          <div className="w-80 flex-shrink-0">
            <SecretManagerPanel projectId={projectId!} />
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 space-y-2">
              <p className="font-semibold">How plugins work</p>
              <ul className="list-disc list-inside space-y-1 text-blue-600">
                <li>Plugins fire when annotators leave a question field</li>
                <li>API plugins call your endpoint with question & answer</li>
                <li>Script plugins run sandboxed JavaScript (3s max)</li>
                <li>Result: PASS, WARN, or FAIL — configurable behavior</li>
                <li>Secrets are AES-256 encrypted, never logged</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      <PluginEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={handleSaved}
        onDeployed={handleDeployed}
        projectId={projectId!}
        existing={editingPlugin}
        questions={questions}
      />
    </div>
  );
};
