import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle, Users, Plus, Layout as LayoutIcon, UserCheck, FileEdit } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchProjects } from '../../store/projectsSlice';
import { StatCard, Button } from '../../components/common';
import { userService } from '../../services/userService';
import { User, UserRole, UserStatus } from '../../services/authService';

export const OpsDashboard = () => {
  const dispatch = useAppDispatch();
  const { projects, loading } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchProjects({ limit: 5 }));
    loadUsers();
  }, [dispatch]);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const result = await userService.listUsers({ limit: 100 });
      setUsers(result.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;
  const draftProjects = projects.filter((p) => p.status === 'DRAFT').length;
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;

  const activeUsers = users.filter((u) => u.status === UserStatus.ACTIVE).length;
  const annotatorCount = users.filter((u) => u.role === UserRole.ANNOTATOR).length;
  const reviewerCount = users.filter((u) => u.role === UserRole.REVIEWER).length;

  const stats = [
    { label: 'Active Projects', value: activeProjects, icon: Briefcase, color: 'bg-blue-500' },
    { label: 'Total Users', value: users.length, icon: Users, color: 'bg-green-500' },
    { label: 'Annotators', value: annotatorCount, icon: FileEdit, color: 'bg-purple-500' },
    { label: 'Reviewers', value: reviewerCount, icon: UserCheck, color: 'bg-teal-500' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ops Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}</p>
        </div>
        <Link to="/ops/projects/create">
          <Button icon={Plus} variant="primary">
            Create Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
              <Link to="/ops/projects" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : projects.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No projects yet</p>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    to={`/ops/projects/${project.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {project.project_type?.replace(/_/g, ' ') || 'N/A'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'DRAFT'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team Overview */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Team Overview</h2>
              <Link to="/admin/users" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Manage Users
              </Link>
            </div>
          </div>
          <div className="p-6">
            {usersLoading ? (
              <p className="text-gray-500 text-center py-8">Loading...</p>
            ) : users.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No team members yet</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-700">{activeUsers}</p>
                    <p className="text-sm text-green-600">Active Users</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-gray-700">
                      {users.filter((u) => u.status === UserStatus.INACTIVE).length}
                    </p>
                    <p className="text-sm text-gray-600">Inactive Users</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { role: 'Admins', count: users.filter((u) => u.role === UserRole.ADMIN).length, color: 'bg-red-100 text-red-700' },
                    { role: 'Project Managers', count: users.filter((u) => u.role === UserRole.PROJECT_MANAGER).length, color: 'bg-blue-100 text-blue-700' },
                    { role: 'Annotators', count: annotatorCount, color: 'bg-purple-100 text-purple-700' },
                    { role: 'Reviewers', count: reviewerCount, color: 'bg-teal-100 text-teal-700' },
                    { role: 'Customers', count: users.filter((u) => u.role === UserRole.CUSTOMER).length, color: 'bg-yellow-100 text-yellow-700' },
                  ].map((item) => (
                    <div key={item.role} className="flex items-center justify-between py-2 px-3 rounded">
                      <span className="text-sm text-gray-700">{item.role}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${item.color}`}>
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions and Project Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <Link
                to="/ops/projects/create"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Plus className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create New Project</p>
                  <p className="text-sm text-gray-500">Start a new annotation project</p>
                </div>
              </Link>
              <Link
                to="/ops/batches/create"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                <div className="bg-green-100 p-2 rounded-lg">
                  <Briefcase className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Upload Batch</p>
                  <p className="text-sm text-gray-500">Upload tasks in bulk</p>
                </div>
              </Link>
              <Link
                to="/ops/projects"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                <div className="bg-purple-100 p-2 rounded-lg">
                  <CheckCircle className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manage Projects</p>
                  <p className="text-sm text-gray-500">View and edit all projects</p>
                </div>
              </Link>
              <Link
                to="/ops/ui-builder"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
              >
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <LayoutIcon className="text-indigo-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">UI Builder</p>
                  <p className="text-sm text-gray-500">Design custom annotation interfaces</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Project Summary */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Project Summary</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Projects</span>
                <span className="font-semibold text-gray-900">{projects.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">Active</span>
                </div>
                <span className="font-semibold text-green-700">{activeProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-600">Draft</span>
                </div>
                <span className="font-semibold text-yellow-700">{draftProjects}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                  <span className="text-gray-600">Completed</span>
                </div>
                <span className="font-semibold text-teal-700">{completedProjects}</span>
              </div>
              {projects.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
                    {activeProjects > 0 && (
                      <div
                        className="bg-green-500 h-3"
                        style={{ width: `${(activeProjects / projects.length) * 100}%` }}
                      ></div>
                    )}
                    {draftProjects > 0 && (
                      <div
                        className="bg-yellow-500 h-3"
                        style={{ width: `${(draftProjects / projects.length) * 100}%` }}
                      ></div>
                    )}
                    {completedProjects > 0 && (
                      <div
                        className="bg-teal-500 h-3"
                        style={{ width: `${(completedProjects / projects.length) * 100}%` }}
                      ></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
