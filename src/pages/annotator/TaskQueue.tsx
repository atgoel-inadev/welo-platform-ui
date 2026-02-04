import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, FileText } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchMyTasks, pullNextTask } from '../../store/tasksSlice';
import { Button } from '../../components/common/Button';

export const TaskQueue = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { myTasks, pulling, loading, error } = useAppSelector((state) => state.tasks);
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
      dispatch(fetchMyTasks({ userId, status: 'ASSIGNED' }));
    }
  }, [dispatch, userId]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Queue</h1>
            <p className="text-gray-600 mt-1">Pull tasks from the queue or continue your assigned tasks</p>
          </div>
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

        {myTasks.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Active Tasks</h2>
            <div className="space-y-3">
              {myTasks.map((assignment) => {
                const task = assignment.task;
                if (!task) return null;

                return (
                  <div
                    key={assignment.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            Task #{task.id.slice(0, 8)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            assignment.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {assignment.status}
                          </span>
                          {task.fileType && (
                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                              {task.fileType}
                            </span>
                          )}
                        </div>
                        {task.fileName && (
                          <div className="text-sm text-gray-600 truncate">
                            {task.fileName}
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              Assigned {new Date(assignment.assignedAt).toLocaleString()}
                            </span>
                          </div>
                          {task.estimatedDuration && (
                            <span>Est. {Math.round(task.estimatedDuration / 60)}min</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => handleContinueTask(task.id)}
                      >
                        {assignment.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {myTasks.length === 0 && !error && (
          <div className="text-center py-12 border-t border-gray-200">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No active tasks assigned</p>
            <p className="text-sm text-gray-500 mt-1">Click "Pull Next Task" to get a task from the queue</p>
          </div>
        )}
      </div>
    </div>
  );
};
