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
            <Route path="projects/create" element={<div className="p-8">Create Project - Coming Soon</div>} />
            <Route path="projects/:id" element={<div className="p-8">View Project - Coming Soon</div>} />
            <Route path="projects/:id/edit" element={<div className="p-8">Edit Project - Coming Soon</div>} />
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
            <Route path="queue" element={<div className="p-8">Review Queue - Coming Soon</div>} />
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
            <Route path="queue" element={<div className="p-8">Task Queue - Coming Soon</div>} />
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
