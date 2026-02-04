import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Clock, Users, FileText } from 'lucide-react';
import { taskService, Task } from '../../services/taskService';
import { Button } from '../../components/common/Button';
import { useAppSelector } from '../../hooks/useRedux';

export const ReviewQueue = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_review'>('pending');
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const userId = user?.id;

  // Redirect if not authenticated
  useEffect(() => {
    if (!userId) {
      navigate('/login');
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (userId) {
      loadTasks();
    }
  }, [filter, userId]);

  const loadTasks = async () => {
    if (!userId) return;
    
    try {
      setError(null);
      
      const statusFilter = 
        filter === 'pending' ? 'PENDING_REVIEW' :
        filter === 'in_review' ? 'IN_PROGRESS' :
        undefined;

      const tasksData = await taskService.getTasksForReview(userId, {
        status: statusFilter as any,
      });

      setTasks(tasksData);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      setError(error.response?.data?.message || 'Failed to load review tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewTask = (taskId: string) => {
    navigate(`/review/task/${taskId}`);
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
            <p className="text-gray-600 mt-1">Review and approve submitted annotations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('in_review')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'in_review'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Review
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task) => {
              const completedCount = task.completedAssignments || 0;
              const requiredCount = task.totalAssignmentsRequired || 1;

              return (
                <div
                  key={task.id}
                  className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                      </div>

                      {task.fileName && (
                        <div className="text-sm text-gray-600 mb-3 truncate">
                          {task.fileName}
                        </div>
                      )}

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{completedCount}/{requiredCount} annotation{requiredCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Updated {new Date(task.updatedAt).toLocaleString()}</span>
                        </div>
                        {task.priority > 0 && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                            Priority: {task.priority}
                          </span>
                        )}
                        {task.requiresConsensus && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            Consensus Required
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      onClick={() => handleReviewTask(task.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No tasks in review queue</p>
            <p className="text-sm text-gray-500 mt-2">
              {filter === 'pending'
                ? 'There are no tasks pending review'
                : filter === 'in_review'
                ? 'There are no tasks currently in review'
                : 'No review tasks available'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
