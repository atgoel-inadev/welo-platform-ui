import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  UserPlus,
  RefreshCw,
  Download,
  Filter,
  Search,
} from 'lucide-react';
import { batchService, Batch, BatchStatistics, Task } from '../../services/batchService';
import { userService, User } from '../../services/userService';
import { UserRole } from '../../services/authService';

type AssignmentMethod = 'AUTO_ROUND_ROBIN' | 'AUTO_WORKLOAD_BASED' | 'AUTO_SKILL_BASED';

export const BatchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [batch, setBatch] = useState<Batch | null>(null);
  const [statistics, setStatistics] = useState<BatchStatistics | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableAnnotators, setAvailableAnnotators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Assignment controls
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<AssignmentMethod>('AUTO_ROUND_ROBIN');
  const [autoAssigning, setAutoAssigning] = useState(false);

  // Manual assignment
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (id) {
      loadBatchData();
      loadAvailableAnnotators();
    }
  }, [id]);

  const loadBatchData = async () => {
    if (!id) return;

    setLoading(true);
    setError('');

    try {
      const [batchData, statsData, tasksData] = await Promise.all([
        batchService.getBatch(id),
        batchService.getBatchStatistics(id),
        batchService.getBatchTasks(id),
      ]);

      setBatch(batchData);
      setStatistics(statsData);
      setTasks(tasksData);
    } catch (err: any) {
      setError(err.message || 'Failed to load batch data');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAnnotators = async () => {
    try {
      const annotators = await userService.getAvailableAnnotators();
      setAvailableAnnotators(annotators);
    } catch (err: any) {
      console.error('Failed to load annotators:', err);
    }
  };

  const handleAutoAssign = async () => {
    if (!id) return;

    setAutoAssigning(true);
    setError('');
    setSuccess('');

    try {
      const result = await batchService.autoAssignTasks(id, selectedMethod);
      setSuccess(`Successfully assigned ${result.assignedCount} tasks!`);
      setShowAutoAssignModal(false);
      loadBatchData();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to auto-assign tasks');
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleManualAssign = async (taskId: string, userId: string) => {
    setAssigning(true);
    setError('');
    setSuccess('');

    try {
      await batchService.assignTask(taskId, userId);
      setSuccess('Task assigned successfully!');
      setSelectedTaskId(null);
      setSelectedUserId('');
      loadBatchData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to assign task');
    } finally {
      setAssigning(false);
    }
  };

  const handleReassign = async (taskId: string, newUserId: string) => {
    if (!confirm('Are you sure you want to reassign this task?')) return;

    setError('');
    setSuccess('');

    try {
      await batchService.reassignTask(taskId, newUserId);
      setSuccess('Task reassigned successfully!');
      loadBatchData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reassign task');
    }
  };

  const handleUnassign = async (taskId: string) => {
    if (!confirm('Are you sure you want to unassign this task?')) return;

    setError('');
    setSuccess('');

    try {
      await batchService.unassignTask(taskId);
      setSuccess('Task unassigned successfully!');
      loadBatchData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to unassign task');
    }
  };

  const getFilteredTasks = (): Task[] => {
    return tasks.filter((task) => {
      // Status filter
      if (statusFilter !== 'ALL' && task.status !== statusFilter) {
        return false;
      }

      // Assignment filter
      if (assignmentFilter === 'ASSIGNED' && !task.assignedTo) {
        return false;
      }
      if (assignmentFilter === 'UNASSIGNED' && task.assignedTo) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          task.fileName.toLowerCase().includes(query) ||
          task.externalId.toLowerCase().includes(query) ||
          (task.assignedTo && task.assignedTo.toLowerCase().includes(query))
        );
      }

      return true;
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any; label: string }> = {
      QUEUED: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Queued' },
      ASSIGNED: { color: 'bg-blue-100 text-blue-800', icon: UserPlus, label: 'Assigned' },
      IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-800', icon: Play, label: 'In Progress' },
      SUBMITTED: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, label: 'Submitted' },
      APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Approved' },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Rejected' },
    };

    const badge = badges[status] || badges.QUEUED;
    const Icon = badge.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const getAssignedUserName = (userId: string): string => {
    const user = availableAnnotators.find((u) => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const unassignedCount = tasks.filter((t) => !t.assignedTo).length;
  const filteredTasks = getFilteredTasks();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (!batch || !statistics) {
    return (
      <div className="p-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Batch Not Found</h3>
          <p className="text-gray-600 mb-6">The batch you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/ops/batches')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Batches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/ops/batches')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Batches
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{batch.name}</h1>
            <p className="text-gray-600 mt-2">{batch.description || 'No description'}</p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => loadBatchData()}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh
            </button>
            <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="w-5 h-5 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{statistics.totalTasks}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">{statistics.completedTasks}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${statistics.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">{statistics.inProgressTasks}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Queued</p>
              <p className="text-3xl font-bold text-blue-600">{statistics.queuedTasks}</p>
            </div>
            <Play className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unassigned</p>
              <p className="text-3xl font-bold text-gray-600">{unassignedCount}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Assignment Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Assignment Controls</h2>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAutoAssignModal(true)}
            disabled={unassignedCount === 0}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Users className="w-5 h-5 mr-2" />
            Auto-Assign ({unassignedCount} unassigned)
          </button>

          <div className="flex-1 text-sm text-gray-600">
            <p>
              <strong>{Object.keys(statistics.assignmentCounts).length}</strong> annotators assigned
            </p>
          </div>
        </div>

        {/* Assignment Distribution */}
        {Object.keys(statistics.assignmentCounts).length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Assignment Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(statistics.assignmentCounts).map(([userId, count]) => (
                <div key={userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                      {getAssignedUserName(userId).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {getAssignedUserName(userId)}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
            <span className="text-sm text-gray-600">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </span>
          </div>

          {/* Filters */}
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Statuses</option>
              <option value="QUEUED">Queued</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Tasks</option>
              <option value="ASSIGNED">Assigned Only</option>
              <option value="UNASSIGNED">Unassigned Only</option>
            </select>

            <button
              onClick={() => {
                setStatusFilter('ALL');
                setAssignmentFilter('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">No tasks found</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{task.fileName}</div>
                          <div className="text-gray-500">{task.fileType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(task.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.assignedTo ? (
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm mr-2">
                            {getAssignedUserName(task.assignedTo).charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-900">
                            {getAssignedUserName(task.assignedTo)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{task.priority}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {!task.assignedTo ? (
                          <>
                            {selectedTaskId === task.id ? (
                              <>
                                <select
                                  value={selectedUserId}
                                  onChange={(e) => setSelectedUserId(e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  disabled={assigning}
                                >
                                  <option value="">Select user...</option>
                                  {availableAnnotators.map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleManualAssign(task.id, selectedUserId)}
                                  disabled={!selectedUserId || assigning}
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  Assign
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedTaskId(null);
                                    setSelectedUserId('');
                                  }}
                                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setSelectedTaskId(task.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Assign
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleUnassign(task.id)}
                              className="text-orange-600 hover:text-orange-800"
                            >
                              Unassign
                            </button>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleReassign(task.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Reassign to...</option>
                              {availableAnnotators
                                .filter((u) => u.id !== task.assignedTo)
                                .map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.name}
                                  </option>
                                ))}
                            </select>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Auto-Assign Modal */}
      {showAutoAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Auto-Assign Tasks</h3>

            <p className="text-gray-600 mb-6">
              Automatically assign {unassignedCount} unassigned task{unassignedCount !== 1 ? 's' : ''} to
              available annotators using the selected method.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Method
              </label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value as AssignmentMethod)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="AUTO_ROUND_ROBIN">Round Robin (Equal Distribution)</option>
                <option value="AUTO_WORKLOAD_BASED">Workload Based (Least Busy First)</option>
                <option value="AUTO_SKILL_BASED">Skill Based (Best Match)</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                {selectedMethod === 'AUTO_ROUND_ROBIN' &&
                  'Distributes tasks evenly across all annotators'}
                {selectedMethod === 'AUTO_WORKLOAD_BASED' &&
                  'Assigns tasks to annotators with the least current workload'}
                {selectedMethod === 'AUTO_SKILL_BASED' &&
                  'Matches tasks to annotators based on skills and past performance'}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowAutoAssignModal(false)}
                disabled={autoAssigning}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAutoAssign}
                disabled={autoAssigning}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {autoAssigning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 inline animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Tasks'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
