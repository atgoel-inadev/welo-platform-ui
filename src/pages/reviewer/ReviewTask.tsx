import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import UnifiedTaskRenderer from '../../components/task/UnifiedTaskRenderer';
import { useAuth } from '../../hooks/useAuth';

/**
 * ReviewTask Page
 * 
 * Uses UnifiedTaskRenderer to dynamically render reviewer view
 * based on project UI configuration
 */
export const ReviewTask = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuth();

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

  return (
    <Layout>
      <UnifiedTaskRenderer 
        taskId={taskId} 
        viewType="reviewer"
        userId={user?.id || 'temp-user-id'} // TODO: Get from proper auth
      />
    </Layout>
  );
};

export default ReviewTask;
