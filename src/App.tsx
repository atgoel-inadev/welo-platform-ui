import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleBasedRoute } from './components/RoleBasedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import Unauthorized from './pages/Unauthorized';
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
import { UserRole } from './services/authService';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <RoleBasedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout />
              </RoleBasedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<div className="p-8">Users Management - Coming Soon</div>} />
            <Route path="analytics" element={<div className="p-8">Analytics - Coming Soon</div>} />
          </Route>

          {/* Ops Manager Routes */}
          <Route
            path="/ops/*"
            element={
              <RoleBasedRoute allowedRoles={[UserRole.OPS_MANAGER, UserRole.ADMIN]}>
                <Layout />
              </RoleBasedRoute>
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

          {/* Reviewer Routes */}
          <Route
            path="/review/*"
            element={
              <RoleBasedRoute allowedRoles={[UserRole.REVIEWER, UserRole.ADMIN]}>
                <Layout />
              </RoleBasedRoute>
            }
          >
            <Route path="queue" element={<ReviewQueue />} />
            <Route path="task/:taskId" element={<ReviewTask />} />
            <Route path="history" element={<div className="p-8">Review History - Coming Soon</div>} />
          </Route>

          {/* Annotator Routes */}
          <Route
            path="/annotate/*"
            element={
              <RoleBasedRoute allowedRoles={[UserRole.ANNOTATOR, UserRole.ADMIN]}>
                <Layout />
              </RoleBasedRoute>
            }
          >
            <Route path="queue" element={<TaskQueue />} />
            <Route path="task/:taskId" element={<AnnotateTask />} />
            <Route path="history" element={<div className="p-8">Task History - Coming Soon</div>} />
            <Route path="dashboard" element={<div className="p-8">Performance Dashboard - Coming Soon</div>} />
          </Route>

          {/* Customer Routes */}
          <Route
            path="/customer/*"
            element={
              <RoleBasedRoute allowedRoles={[UserRole.CUSTOMER, UserRole.ADMIN]}>
                <Layout />
              </RoleBasedRoute>
            }
          >
            <Route path="dashboard" element={<div className="p-8">Customer Dashboard - Coming Soon</div>} />
            <Route path="projects" element={<div className="p-8">My Projects - Coming Soon</div>} />
            <Route path="reports" element={<div className="p-8">Reports - Coming Soon</div>} />
            <Route path="exports" element={<div className="p-8">Export History - Coming Soon</div>} />
          </Route>

          {/* Default route redirects based on user role */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
