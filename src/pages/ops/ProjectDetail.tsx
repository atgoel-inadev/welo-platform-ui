import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Briefcase, Users, CheckCircle, Clock,
  FileText, Settings, BarChart3, PlayCircle, Upload,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchProjectById, fetchProjectStatistics } from '../../store/projectsSlice';
import { Button, Badge } from '../../components/common';

export const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentProject, statistics, loading, error } = useAppSelector((state) => state.projects);

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchProjectStatistics(id));
    }
  }, [dispatch, id]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'DRAFT': return 'warning';
      case 'COMPLETED': return 'info';
      case 'PAUSED': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={() => navigate('/ops/projects')} variant="primary">
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">Project not found</p>
        <Button onClick={() => navigate('/ops/projects')} variant="primary">
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button onClick={() => navigate('/ops/projects')} variant="ghost" icon={ArrowLeft} className="mb-4">
            Back to Projects
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{currentProject.name}</h1>
                <Badge variant={getStatusBadgeVariant(currentProject.status)}>
                  {currentProject.status}
                </Badge>
              </div>
              {currentProject.description && (
                <p className="text-gray-600 mt-1">{currentProject.description}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Link to={`/ops/projects/${id}/edit`}>
                <Button variant="primary" icon={Edit}>
                  Edit Project
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="text-blue-600" size={20} />
                </div>
                <span className="text-sm text-gray-600">Total Tasks</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_tasks}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{statistics.completed_tasks}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Clock className="text-yellow-600" size={20} />
                </div>
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{statistics.in_progress_tasks}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Users className="text-purple-600" size={20} />
                </div>
                <span className="text-sm text-gray-600">Active Annotators</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{statistics.active_annotators}</p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {statistics && statistics.total_tasks > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Overall Progress</h3>
              <span className="text-sm font-medium text-gray-700">
                {Math.round((statistics.completed_tasks / statistics.total_tasks) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${(statistics.completed_tasks / statistics.total_tasks) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{statistics.completed_tasks} completed</span>
              <span>{statistics.pending_review_tasks} pending review</span>
              <span>{statistics.in_progress_tasks} in progress</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Project Details</h2>
              </div>
            </div>
            <div className="p-6">
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Project Type</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {currentProject.project_type?.replace(/_/g, ' ') || 'N/A'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Customer</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {currentProject.customer?.name || 'N/A'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Quality Threshold</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {Math.round((currentProject.quality_threshold || 0.8) * 100)}%
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Created</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {currentProject.created_at ? new Date(currentProject.created_at).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Last Updated</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {currentProject.updated_at ? new Date(currentProject.updated_at).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
                {statistics && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Quality Score</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {statistics.quality_score > 0 ? `${Math.round(statistics.quality_score * 100)}%` : 'N/A'}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Workflow Configuration */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Workflow Configuration</h2>
              </div>
            </div>
            <div className="p-6">
              <dl className="space-y-4">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Queue Strategy</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {currentProject.workflow_config?.queue_strategy || 'FIFO'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Annotators per Task</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {currentProject.workflow_config?.annotators_per_task || 1}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Multi-annotator</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {currentProject.workflow_config?.enable_multi_annotator ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Consensus Threshold</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {Math.round((currentProject.workflow_config?.consensus_threshold || 0.8) * 100)}%
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Assignment Expiration</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {currentProject.workflow_config?.assignment_expiration_hours || 8} hours
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Max Tasks per Annotator</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {currentProject.workflow_config?.max_tasks_per_annotator || 10}
                  </dd>
                </div>
              </dl>

              {/* Review Levels */}
              {currentProject.workflow_config?.review_levels?.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Review Levels</h4>
                  <div className="space-y-2">
                    {currentProject.workflow_config.review_levels.map((level) => (
                      <div key={level.level} className="flex items-center justify-between bg-gray-50 rounded p-3">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            Level {level.level}: {level.name}
                          </span>
                          <p className="text-xs text-gray-500">
                            {level.reviewers_count} reviewer{level.reviewers_count !== 1 ? 's' : ''}
                            {level.auto_assign ? ' (auto-assign)' : ''}
                          </p>
                        </div>
                        <Badge variant={level.require_all_approvals ? 'warning' : 'default'}>
                          {level.require_all_approvals ? 'All must approve' : `${level.approval_threshold || 50}% threshold`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Annotation Questions */}
        {currentProject.annotation_questions?.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-6">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase size={20} className="text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Annotation Questions ({currentProject.annotation_questions.length})
                  </h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {currentProject.annotation_questions.map((q, index) => (
                  <div key={q.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                            Q{index + 1}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5">
                            {q.type}
                          </span>
                          {q.required && (
                            <span className="text-xs bg-red-100 text-red-700 rounded px-2 py-0.5">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">{q.label}</p>
                        {q.description && (
                          <p className="text-sm text-gray-500 mt-1">{q.description}</p>
                        )}
                      </div>
                    </div>
                    {q.options && q.options.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {q.options.map((opt) => (
                          <span
                            key={opt.value}
                            className="text-xs bg-gray-50 border rounded px-2 py-1 text-gray-700"
                          >
                            {opt.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6 flex flex-wrap gap-3">
            <Link to={`/ops/projects/${id}/edit`}>
              <Button variant="secondary" icon={Edit}>
                Edit Project
              </Button>
            </Link>
            <Link to={`/ops/projects/${id}/ui-builder`}>
              <Button variant="secondary" icon={Settings}>
                UI Builder
              </Button>
            </Link>
            <Link to={`/ops/projects/${id}/batch-upload`}>
              <Button variant="secondary" icon={Upload}>
                Upload Batch
              </Button>
            </Link>
            <Link to={`/ops/projects/${id}/demo`}>
              <Button variant="primary" icon={PlayCircle}>
                Demo Workflow
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
