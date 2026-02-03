import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { OpsDashboard } from './pages/ops/OpsDashboard';
import { ProjectsList } from './pages/ops/ProjectsList';
import { CreateProject } from './pages/ops/CreateProject';
import { EditProject } from './pages/ops/EditProject';
import { WorkflowManagement } from './pages/ops/WorkflowManagement';
import { TaskQueue } from './pages/annotator/TaskQueue';
import { AnnotateTask } from './pages/annotator/AnnotateTask';
import { ReviewQueue } from './pages/reviewer/ReviewQueue';
import { ReviewTask } from './pages/reviewer/ReviewTask';
import { UserRole } from './types';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<div className="p-8">Users Management - Coming Soon</div>} />
            <Route path="analytics" element={<div className="p-8">Analytics - Coming Soon</div>} />
          </Route>

          <Route
            path="/ops/*"
            element={
              <ProtectedRoute allowedRoles={[UserRole.PROJECT_MANAGER, UserRole.ADMIN]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<OpsDashboard />} />
            <Route path="projects" element={<ProjectsList />} />
            <Route path="projects/create" element={<CreateProject />} />
            <Route path="projects/:id" element={<div className="p-8">View Project - Coming Soon</div>} />
            <Route path="projects/:id/edit" element={<EditProject />} />
            <Route path="workflows" element={<WorkflowManagement />} />
            <Route path="workflows/:workflowId" element={<WorkflowManagement />} />
            <Route path="batches" element={<div className="p-8">Batches - Coming Soon</div>} />
            <Route path="batches/create" element={<div className="p-8">Upload Batch - Coming Soon</div>} />
          </Route>

          <Route
            path="/review/*"
            element={
              <ProtectedRoute allowedRoles={[UserRole.REVIEWER, UserRole.ADMIN]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="queue" element={<ReviewQueue />} />
            <Route path="task/:taskId" element={<ReviewTask />} />
            <Route path="history" element={<div className="p-8">Review History - Coming Soon</div>} />
          </Route>

          <Route
            path="/annotate/*"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ANNOTATOR, UserRole.ADMIN]}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="queue" element={<TaskQueue />} />
            <Route path="task/:taskId" element={<AnnotateTask />} />
            <Route path="history" element={<div className="p-8">Task History - Coming Soon</div>} />
            <Route path="dashboard" element={<div className="p-8">Performance Dashboard - Coming Soon</div>} />
          </Route>

          <Route path="/unauthorized" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
                <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
                <a href="/login" className="text-blue-600 hover:text-blue-700">Go to Login</a>
              </div>
            </div>
          } />

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
