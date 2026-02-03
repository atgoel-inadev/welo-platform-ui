import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle, Clock, Users, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchProjects } from '../../store/projectsSlice';
import { StatCard, Button } from '../../components/common';

export const OpsDashboard = () => {
  const dispatch = useAppDispatch();
  const { projects, loading } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchProjects({ limit: 5 }));
  }, [dispatch]);

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;
  const draftProjects = projects.filter((p) => p.status === 'DRAFT').length;
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: Briefcase, color: 'bg-blue-500' },
    { label: 'Active Projects', value: activeProjects, icon: Clock, color: 'bg-green-500' },
    { label: 'Draft Projects', value: draftProjects, icon: Users, color: 'bg-yellow-500' },
    { label: 'Completed', value: completedProjects, icon: CheckCircle, color: 'bg-teal-500' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <p className="text-sm text-gray-500 mt-1">{project.project_type.replace('_', ' ')}</p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
