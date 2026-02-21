import { useParams, Navigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import ReviewSplitScreen from '../../components/task/ReviewSplitScreen';
import { useAuth } from '../../hooks/useAuth';

/**
 * ReviewTask Page
 *
 * Renders the split-screen review interface where reviewers can:
 * - View the task media (fixed on the left)
 * - Compare gold answers vs annotator answers side-by-side
 * - Score each question individually
 * - Submit an overall review decision (approve / needs revision / reject)
 */
export const ReviewTask = () => {
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
            <p className="text-red-700 font-medium">Task ID is missing</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user?.id) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ReviewSplitScreen taskId={taskId} userId={user.id} />
    </Layout>
  );
};

export default ReviewTask;
