import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Clock, FileText, Package, Filter, AlertCircle, 
  CheckCircle, XCircle, SkipForward, Flag, Search, RefreshCw 
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchMyTasks, pullNextTask } from '../../store/tasksSlice';
import { Button } from '../../components/common/Button';
import { batchService, Batch, BatchStatistics } from '../../services/batchService';
import { projectService } from '../../services/projectService';
import { Project } from '../../types';

export const TaskQueue = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { myTasks, pulling, loading, error } = useAppSelector((state) => state.tasks);
  const { user } = useAppSelector((state) => state.auth);
  
  const userId = user?.id;

  // Batch and project context
  const [batches, setBatches] = useState<Record<string, Batch>>({});
  const [batchStats, setBatchStats] = useState<Record<string, BatchStatistics>>({});
  const [projects, setProjects] = useState<Record<string, Project>>({});
  
  // Filters
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Actions
  const [reportingTask, setReportingTask] = useState<string | null>(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
  }, [dispatch, userId]);

  const loadData = async () => {
    if (!userId) return;

    // Load tasks
    await dispatch(fetchMyTasks({ userId, status: 'ASSIGNED' }));

    // Load batch and project context
    try {
      const projectsResponse = await projectService.fetchProjects({ status: 'ACTIVE' });
      const projectsMap: Record<string, Project> = {};
      (projectsResponse.data || []).forEach((project: Project) => {
        projectsMap[project.id] = project;
      });
      setProjects(projectsMap);

      // Get unique batch IDs from tasks
      const batchIds = Array.from(new Set(myTasks.map(a => a.task?.batchId).filter(Boolean)));
      
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
    } catch (error) {
      console.error('Failed to load context:', error);
    }
  };

  const handlePullTask = async () => {
    if (!userId) return;
    
    const resultAction = await dispatch(pullNextTask({ userId }));
    if (pullNextTask.fulfilled.match(resultAction)) {
      const task = resultAction.payload;
      navigate(`/annotate/task/${task.id}`);
    }
    // Error is handled by Redux state
  };

  const handleContinueTask = (taskId: string) => {
    navigate(`/annotate/task/${taskId}`);
  };

  const handleReleaseTask = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to release this task? It will be returned to the queue.')) {
      return;
    }

    setActionLoading(assignmentId);
    try {
      // TODO: Implement release task API call
      // await taskService.releaseTask(assignmentId);
      console.log('Release task:', assignmentId);
      await loadData();
    } catch (error) {
      console.error('Failed to release task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkipTask = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to skip this task? You will not be able to work on it again.')) {
      return;
    }

    setActionLoading(assignmentId);
    try {
      // TODO: Implement skip task API call
      // await taskService.skipTask(assignmentId);
      console.log('Skip task:', assignmentId);
      await loadData();
    } catch (error) {
      console.error('Failed to skip task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReportIssue = async (assignmentId: string) => {
    if (!issueDescription.trim()) {
      alert('Please describe the issue');
      return;
    }

    setActionLoading(assignmentId);
    try {
      // TODO: Implement report issue API call
      // await taskService.reportIssue(assignmentId, issueDescription);
      console.log('Report issue:', assignmentId, issueDescription);
      setReportingTask(null);
      setIssueDescription('');
      alert('Issue reported successfully!');
    } catch (error) {
      console.error('Failed to report issue:', error);
      alert('Failed to report issue');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter tasks
  const filteredTasks = myTasks.filter((assignment) => {
    const task = assignment.task;
    if (!task) return false;

    // Batch filter
    if (selectedBatch && task.batchId !== selectedBatch) return false;

    // Project filter
    if (selectedProject && task.projectId !== selectedProject) return false;

    // Status filter
    if (selectedStatus && assignment.status !== selectedStatus) return false;

    // Priority filter
    if (selectedPriority) {
      const priority = parseInt(selectedPriority);
      if (task.priority !== priority) return false;
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

  const uniqueBatches = Array.from(new Set(myTasks.map(a => a.task?.batchId).filter(Boolean)));
  const uniqueProjects = Array.from(new Set(myTasks.map(a => a.task?.projectId).filter(Boolean)));

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
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Queue</h1>
            <p className="text-gray-600 mt-1">
              {myTasks.length} active task{myTasks.length !== 1 ? 's' : ''} • {filteredTasks.length} shown
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
            <Button onClick={handlePullTask} disabled={pulling}>
              {pulling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Pulling...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Pull Next Task
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
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

          {(selectedBatch || selectedProject || selectedStatus || selectedPriority || searchQuery) && (
            <button
              onClick={() => {
                setSelectedBatch('');
                setSelectedProject('');
                setSelectedStatus('');
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
          {filteredTasks.map((assignment) => {
            const task = assignment.task;
            if (!task) return null;

            const batch = batches[task.batchId];
            const batchProgress = getBatchProgress(task.batchId);
            const project = projects[task.projectId];

            return (
              <div
                key={assignment.id}
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
                        assignment.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {assignment.status.replace(/_/g, ' ')}
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
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-blue-900">
                            {batch?.name || 'Unknown Batch'}
                          </span>
                          {project && (
                            <span className="ml-3 text-sm text-blue-700">
                              {project.name}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-blue-700">
                          {batchProgress}% complete
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
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
                        <Clock className="w-4 h-4" />
                        <span>Assigned {new Date(assignment.assignedAt).toLocaleString()}</span>
                      </div>
                      {task.estimatedDuration && (
                        <span>Est. {Math.round(task.estimatedDuration / 60)}min</span>
                      )}
                      {assignment.expiresAt && (
                        <span>Expires {new Date(assignment.expiresAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      variant="primary"
                      onClick={() => handleContinueTask(task.id)}
                      disabled={!!actionLoading}
                    >
                      {assignment.status === 'IN_PROGRESS' ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Continue
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Start
                        </>
                      )}
                    </Button>

                    <button
                      onClick={() => handleReleaseTask(assignment.id)}
                      disabled={!!actionLoading}
                      className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Release
                    </button>

                    <button
                      onClick={() => handleSkipTask(assignment.id)}
                      disabled={!!actionLoading}
                      className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <SkipForward className="w-4 h-4 mr-2" />
                      Skip
                    </button>

                    <button
                      onClick={() => setReportingTask(assignment.id)}
                      disabled={!!actionLoading}
                      className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Report Issue
                    </button>
                  </div>
                </div>

                {/* Report Issue Form */}
                {reportingTask === assignment.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Report an Issue</h4>
                    <textarea
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      placeholder="Describe the issue..."
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
                        onClick={() => handleReportIssue(assignment.id)}
                        disabled={!issueDescription.trim() || !!actionLoading}
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
            {myTasks.length === 0
              ? "You don't have any assigned tasks. Click 'Pull Next Task' to get started!"
              : 'No tasks match your current filters. Try adjusting your filter criteria.'}
          </p>
        </div>
      )}
    </div>
  );
};
