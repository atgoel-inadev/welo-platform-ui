import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, Clock, FileText, Package, Filter, AlertCircle,
  CheckCircle, Flag, Search, RefreshCw, Users
} from 'lucide-react';
import { taskService, Task } from '../../services/taskService';
import { Button } from '../../components/common/Button';
import { useAppSelector } from '../../hooks/useRedux';
import { batchService, Batch, BatchStatistics } from '../../services/batchService';
import { projectService } from '../../services/projectService';
import { Project } from '../../types';

export const ReviewQueue = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const userId = user?.id;

  // Batch and project context
  const [batches, setBatches] = useState<Record<string, Batch>>({});
  const [batchStats, setBatchStats] = useState<Record<string, BatchStatistics>>({});
  const [projects, setProjects] = useState<Record<string, Project>>({});

  // Filters
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Actions
  const [reportingTask, setReportingTask] = useState<string | null>(null);
  const [issueDescription, setIssueDescription] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, selectedStatus]);

  const loadData = async () => {
    if (!userId) return;

    try {
      setError(null);
      setLoading(true);

      // Load tasks
      const statusFilter = 
        selectedStatus === 'pending' ? 'PENDING_REVIEW' :
        selectedStatus === 'in_review' ? 'IN_PROGRESS' :
        undefined;

      const tasksData = await taskService.getTasksForReview(userId, {
        status: statusFilter as any,
      });
      setTasks(tasksData);

      // Load batch and project context
      const projectsResponse = await projectService.fetchProjects({ status: 'ACTIVE' });
      const projectsMap: Record<string, Project> = {};
      (projectsResponse.data || []).forEach((project: Project) => {
        projectsMap[project.id] = project;
      });
      setProjects(projectsMap);

      // Get unique batch IDs
      const batchIds = Array.from(new Set(tasksData.map(t => t.batchId).filter(Boolean)));

      // Load batch details
      const batchPromises = batchIds.map(id => 
        batchService.getBatch(id!).catch(() => null)
      );
      const statsPromises = batchIds.map(id => 
        batchService.getBatchStatistics(id!).catch(() => null)
      );

      const [batchesData, statsData] = await Promise.all([
        Promise.all(batchPromises),
        Promise.all(statsPromises)
      ]);

      const batchesMap: Record<string, Batch> = {};
      const statsMap: Record<string, BatchStatistics> = {};

      batchesData.forEach((batch, index) => {
        if (batch) {
          batchesMap[batch.id] = batch;
          if (statsData[index]) {
            statsMap[batch.id] = statsData[index];
          }
        }
      });

      setBatches(batchesMap);
      setBatchStats(statsMap);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.response?.data?.message || 'Failed to load review tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewTask = (taskId: string) => {
    navigate(`/review/task/${taskId}`);
  };

  const handleReportIssue = async (taskId: string) => {
    if (!issueDescription.trim()) {
      alert('Please describe the issue');
      return;
    }

    try {
      // TODO: Implement report issue API call
      console.log('Report issue:', taskId, issueDescription);
      setReportingTask(null);
      setIssueDescription('');
      alert('Issue reported successfully!');
    } catch (error) {
      console.error('Failed to report issue:', error);
      alert('Failed to report issue');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Batch filter
    if (selectedBatch && task.batchId !== selectedBatch) return false;

    // Project filter
    if (selectedProject && task.projectId !== selectedProject) return false;

    // Priority filter
    if (selectedPriority) {
      const priority = parseInt(selectedPriority);
      if (priority === 10 && task.priority < 8) return false;
      if (priority === 5 && (task.priority < 5 || task.priority >= 8)) return false;
      if (priority === 1 && task.priority >= 5) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.fileName?.toLowerCase().includes(query) ||
        task.id.toLowerCase().includes(query) ||
        task.externalId?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const uniqueBatches = Array.from(new Set(tasks.map(t => t.batchId).filter(Boolean)));
  const uniqueProjects = Array.from(new Set(tasks.map(t => t.projectId).filter(Boolean)));

  const getBatchProgress = (batchId: string): number => {
    const stats = batchStats[batchId];
    if (!stats || stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  };

  const getPriorityLabel = (priority: number): string => {
    if (priority >= 8) return 'High';
    if (priority >= 5) return 'Medium';
    return 'Low';
  };

  const getPriorityColor = (priority: number): string => {
    if (priority >= 8) return 'bg-red-100 text-red-800';
    if (priority >= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
            <p className="text-gray-600 mt-1">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} available • {filteredTasks.length} shown
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadData}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Status Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setSelectedStatus('in_review')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus === 'in_review'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            In Review
          </button>
        </div>

        {/* Advanced Filters */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Batches</option>
              {uniqueBatches.map((batchId) => (
                <option key={batchId} value={batchId}>
                  {batches[batchId!]?.name || `Batch ${batchId!.slice(0, 8)}`}
                </option>
              ))}
            </select>

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Projects</option>
              {uniqueProjects.map((projectId) => (
                <option key={projectId} value={projectId}>
                  {projects[projectId!]?.name || `Project ${projectId!.slice(0, 8)}`}
                </option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="10">High (8-10)</option>
              <option value="5">Medium (5-7)</option>
              <option value="1">Low (1-4)</option>
            </select>
          </div>

          {(selectedBatch || selectedProject || selectedPriority || searchQuery) && (
            <button
              onClick={() => {
                setSelectedBatch('');
                setSelectedProject('');
                setSelectedPriority('');
                setSearchQuery('');
              }}
              className="mt-4 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const batch = batches[task.batchId];
            const batchProgress = getBatchProgress(task.batchId);
            const project = projects[task.projectId];
            const completedCount = task.completedAssignments || 0;
            const requiredCount = task.totalAssignmentsRequired || 1;

            return (
              <div
                key={task.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        Task #{task.id.slice(0, 8)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        task.status === 'PENDING_REVIEW'
                          ? 'bg-yellow-100 text-yellow-700'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status.replace(/_/g, ' ')}
                      </span>
                      {task.fileType && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                          {task.fileType}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)} Priority
                      </span>
                    </div>

                    {/* Batch Context */}
                    <div className="bg-purple-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-purple-600 mr-2" />
                          <span className="text-sm font-medium text-purple-900">
                            {batch?.name || 'Unknown Batch'}
                          </span>
                          {project && (
                            <span className="ml-3 text-sm text-purple-700">
                              {project.name}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-purple-700">
                          {batchProgress}% complete
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${batchProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* File Info */}
                    {task.fileName && (
                      <div className="text-sm text-gray-600 mb-3 truncate">
                        📄 {task.fileName}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {completedCount}/{requiredCount} annotations
                        </span>
                      </div>
                      {task.estimatedDuration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Est. {Math.round(task.estimatedDuration / 60)}min</span>
                        </div>
                      )}
                      <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      variant="primary"
                      onClick={() => handleReviewTask(task.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>

                    <button
                      onClick={() => setReportingTask(task.id)}
                      className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Report Issue
                    </button>
                  </div>
                </div>

                {/* Report Issue Form */}
                {reportingTask === task.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Report an Issue</h4>
                    <textarea
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      placeholder="Describe the issue with this task..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={() => {
                          setReportingTask(null);
                          setIssueDescription('');
                        }}
                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReportIssue(task.id)}
                        disabled={!issueDescription.trim()}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Submit Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tasks Found</h3>
          <p className="text-gray-600 mb-6">
            {tasks.length === 0
              ? 'No tasks are currently available for review.'
              : 'No tasks match your current filters. Try adjusting your filter criteria.'}
          </p>
        </div>
      )}
    </div>
  );
};
