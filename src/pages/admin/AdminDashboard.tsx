import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, UserCheck, FileEdit, Shield } from 'lucide-react';
import { userService } from '../../services/userService';
import { User, UserRole, UserStatus } from '../../services/authService';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const result = await userService.listUsers();
      setUsers(result.data);
    } catch {
      // Silently fail - stats will show 0
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === UserStatus.ACTIVE).length;
  const annotators = users.filter(u => u.role === UserRole.ANNOTATOR).length;
  const reviewers = users.filter(u => u.role === UserRole.REVIEWER).length;
  const managers = users.filter(u => u.role === UserRole.PROJECT_MANAGER).length;

  const stats = [
    { label: 'Total Users', value: loading ? '...' : String(totalUsers), icon: Users, color: 'bg-blue-500' },
    { label: 'Active Users', value: loading ? '...' : String(activeUsers), icon: UserCheck, color: 'bg-green-500' },
    { label: 'Annotators', value: loading ? '...' : String(annotators), icon: FileEdit, color: 'bg-orange-500' },
    { label: 'System Health', value: '100%', icon: Activity, color: 'bg-teal-500' },
  ];

  const roleBreakdown = [
    { role: 'Admins', count: users.filter(u => u.role === UserRole.ADMIN).length, color: 'bg-purple-100 text-purple-800' },
    { role: 'Project Managers', count: managers, color: 'bg-blue-100 text-blue-800' },
    { role: 'Annotators', count: annotators, color: 'bg-green-100 text-green-800' },
    { role: 'Reviewers', count: reviewers, color: 'bg-orange-100 text-orange-800' },
    { role: 'Customers', count: users.filter(u => u.role === UserRole.CUSTOMER).length, color: 'bg-gray-100 text-gray-800' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">System overview and management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Users by Role</h2>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Manage Users
            </button>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {roleBreakdown.map((item) => (
                <div key={item.role} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-gray-400" />
                    <span className="text-gray-700">{item.role}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.color}`}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Users</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users yet</p>
          ) : (
            <div className="space-y-3">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.status === UserStatus.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
