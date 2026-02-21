import { useParams, Navigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import UnifiedTaskRenderer from '../../components/task/UnifiedTaskRenderer';
import { useAuth } from '../../hooks/useAuth';

/**
 * AnnotateTask Page
 *
 * Uses UnifiedTaskRenderer to dynamically render annotator view
 * based on project UI configuration
 */
export const AnnotateTask = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user, isAuthenticated, initialCheckDone } = useAuth();

  if (initialCheckDone && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!taskId) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Task ID is missing</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user?.id) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <UnifiedTaskRenderer
        taskId={taskId}
        viewType="annotator"
        userId={user.id}
      />
    </Layout>
  );
};

export default AnnotateTask;
