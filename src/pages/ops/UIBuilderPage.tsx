/**
 * UI Builder Page
 * Entry point for project managers to configure annotation UIs.
 * When no projectId in URL, shows a project selector first.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UIBuilder } from '../../components/uibuilder/UIBuilder';
import {
  ArrowLeft,
  AlertCircle,
  Search,
  FolderOpen,
  Layers,
  ChevronRight,
  Palette,
  X,
} from 'lucide-react';
import {
  createUIConfiguration,
  updateUIConfiguration,
  getUIConfiguration,
} from '../../services/uiConfigurationService';
import { projectService } from '../../services/projectService';
import type { Project } from '../../types';

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                    */
/* ──────────────────────────────────────────────────────────────────────────── */

function projectTypeToFileType(projectType: string): string {
  const map: Record<string, string> = {
    TEXT_ANNOTATION: 'TEXT',
    IMAGE_ANNOTATION: 'IMAGE',
    AUDIO_TRANSCRIPTION: 'AUDIO',
    VIDEO_ANNOTATION: 'VIDEO',
    DATA_LABELING: 'CSV',
    CONTENT_MODERATION: 'TEXT',
  };
  return map[projectType] || 'TEXT';
}

function projectTypeLabel(pt: string): string {
  const labels: Record<string, string> = {
    TEXT_ANNOTATION: 'Text Annotation',
    IMAGE_ANNOTATION: 'Image Annotation',
    AUDIO_TRANSCRIPTION: 'Audio Transcription',
    VIDEO_ANNOTATION: 'Video Annotation',
    DATA_LABELING: 'Data Labeling',
    CONTENT_MODERATION: 'Content Moderation',
  };
  return labels[pt] || pt;
}

function statusBadge(s: string) {
  switch (s) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    case 'DRAFT':
      return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    case 'PAUSED':
      return 'bg-slate-100 text-slate-600 ring-slate-500/20';
    case 'COMPLETED':
      return 'bg-sky-50 text-sky-700 ring-sky-600/20';
    default:
      return 'bg-gray-50 text-gray-600 ring-gray-500/20';
  }
}

function fileTypeIcon(pt: string) {
  const icons: Record<string, string> = {
    TEXT_ANNOTATION: 'Aa',
    IMAGE_ANNOTATION: '🖼',
    AUDIO_TRANSCRIPTION: '🎧',
    VIDEO_ANNOTATION: '🎬',
    DATA_LABELING: '📊',
    CONTENT_MODERATION: '🛡',
  };
  return icons[pt] || '📄';
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Project Selector                                                           */
/* ──────────────────────────────────────────────────────────────────────────── */

const ProjectSelector: React.FC<{ onSelect: (p: Project) => void }> = ({ onSelect }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const resp = await projectService.fetchProjects({ limit: 200 });
        setProjects(resp.data);
      } catch (err) {
        console.error('Failed to load projects', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-800 tracking-tight">UI Builder</span>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">UI Builder</h1>
          <p className="text-gray-600 mt-2">
            Select a project to design its annotation interface. File type is auto-detected from the project.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center">
            <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {search ? 'No projects match your search.' : 'No projects found. Create a project first.'}
            </p>
          </div>
        )}

        {/* Project cards */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelect(project)}
              >

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-lg select-none flex-shrink-0">
                      {fileTypeIcon(project.project_type)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      {project.description && (
                        <div className="text-sm text-gray-500">{project.description.substring(0, 60)}{project.description.length > 60 ? '...' : ''}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{projectTypeLabel(project.project_type)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusBadge(project.status)}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center gap-1 ml-auto">
                    Open Builder <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Main Page                                                                  */
/* ──────────────────────────────────────────────────────────────────────────── */

export const UIBuilderPage = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialConfig, setInitialConfig] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  const effectiveProjectId = projectId || selectedProject?.id;

  // When URL no longer has a projectId (user navigated back), clear local state
  useEffect(() => {
    if (!projectId) {
      setSelectedProject(null);
      setInitialConfig(null);
      setConfigLoaded(false);
      setError(null);
    }
  }, [projectId]);

  // Load project data when we have a projectId from URL but no selectedProject
  useEffect(() => {
    if (projectId && !selectedProject) {
      (async () => {
        try {
          const p = await projectService.fetchProjectById(projectId);
          setSelectedProject(p);
        } catch {
          // Non-blocking
        }
      })();
    }
  }, [projectId, selectedProject]);

  // Load existing UI config for the project
  useEffect(() => {
    if (effectiveProjectId) {
      (async () => {
        try {
          setLoading(true);
          const response = await getUIConfiguration(effectiveProjectId);
          setInitialConfig(response.configuration);
        } catch (err: any) {
          if (err.response?.status !== 404) {
            console.error('Failed to load configuration:', err);
            setError('Failed to load existing configuration');
          }
        } finally {
          setLoading(false);
          setConfigLoaded(true);
        }
      })();
    }
  }, [effectiveProjectId]);

  /* ── Show project selector if no project context ─────────────────────── */
  if (!effectiveProjectId) {
    return (
      <ProjectSelector
        onSelect={(p) => {
          setSelectedProject(p);
          navigate(`/ops/projects/${p.id}/ui-builder`);
        }}
      />
    );
  }

  /* ── Save handler ────────────────────────────────────────────────────── */
  const handleSave = async (configuration: any) => {
    try {
      setLoading(true);
      setError(null);

      const transformedConfiguration = {
        ...configuration,
        responseType: configuration.responseType || 'STRUCTURED',
        widgets: configuration.widgets.map((widget: any, index: number) => ({
          ...widget,
          position: widget.position || { x: 0, y: index * 100 },
          size: widget.size || { width: 400, height: 300 },
        })),
      };

      const configData = {
        name: configuration.name || `${selectedProject?.name || 'Project'} — Annotation Interface`,
        description: configuration.description || 'Dynamic UI configuration',
        configuration: transformedConfiguration,
      };

      try {
        await updateUIConfiguration(effectiveProjectId, configData);
      } catch (updateError: any) {
        if (updateError.response?.status === 404) {
          await createUIConfiguration(effectiveProjectId, configData);
        } else {
          throw updateError;
        }
      }
    } catch (err: any) {
      console.error('Failed to save UI configuration:', err);
      setError(err.response?.data?.message || 'Failed to save UI configuration');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading state ───────────────────────────────────────────────────── */
  if (loading && !configLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading UI configuration…</p>
        </div>
      </div>
    );
  }

  /* ── Derive file type from project ───────────────────────────────────── */
  const derivedFileType = selectedProject
    ? projectTypeToFileType(selectedProject.project_type)
    : initialConfig?.fileType || 'TEXT';

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Error toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 shadow-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">Save Error</p>
              <p className="text-xs text-red-600 mt-0.5 truncate">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-500 text-lg leading-none">×</button>
          </div>
        </div>
      )}

      {/* UI Builder */}
      <UIBuilder
        projectId={effectiveProjectId}
        projectName={selectedProject?.name}
        projectFileType={derivedFileType}
        initialConfiguration={initialConfig}
        onSave={handleSave}
        onCancel={() => navigate(-1)}
      />

      {/* Save indicator */}
      {loading && configLoaded && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg">
            <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-xs font-medium text-slate-700">Saving…</span>
          </div>
        </div>
      )}
    </div>
  );
};
