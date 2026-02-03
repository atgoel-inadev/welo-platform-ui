import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { Users, Briefcase, CheckSquare, FileEdit, LogOut, LayoutDashboard, Workflow } from 'lucide-react';

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (!user) return [];

    switch (user.role) {
      case UserRole.ADMIN:
        return [
          { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/admin/users', icon: Users, label: 'Users' },
          { to: '/admin/analytics', icon: CheckSquare, label: 'Analytics' },
        ];
      case UserRole.PROJECT_MANAGER:
        return [
          { to: '/ops/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/ops/projects', icon: Briefcase, label: 'Projects' },
          { to: '/ops/workflows', icon: Workflow, label: 'Workflows' },
          { to: '/ops/batches', icon: FileEdit, label: 'Batches' },
        ];
      case UserRole.REVIEWER:
        return [
          { to: '/review/queue', icon: CheckSquare, label: 'Review Queue' },
          { to: '/review/history', icon: FileEdit, label: 'History' },
        ];
      case UserRole.ANNOTATOR:
        return [
          { to: '/annotate/queue', icon: FileEdit, label: 'Task Queue' },
          { to: '/annotate/history', icon: CheckSquare, label: 'History' },
          { to: '/annotate/dashboard', icon: LayoutDashboard, label: 'Performance' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">Welo</h1>
          <p className="text-sm text-gray-600 mt-1">{user?.role.replace('_', ' ')}</p>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t bg-white">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
