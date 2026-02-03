import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchProjects, deleteProject, cloneProject } from '../../store/projectsSlice';
import { Button, Badge, Modal } from '../../components/common';
import { ProjectStatus } from '../../types';

export const ProjectsList = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { projects, loading, total, page, limit } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | ''>('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [cloneName, setCloneName] = useState('');

  useEffect(() => {
    dispatch(fetchProjects({ page, limit, search, status: statusFilter || undefined }));
  }, [dispatch, page, limit]);

  const handleSearch = () => {
    dispatch(fetchProjects({ page: 1, limit, search, status: statusFilter || undefined }));
  };

  const handleDelete = async () => {
    if (selectedProject) {
      await dispatch(deleteProject(selectedProject));
      setDeleteModalOpen(false);
      setSelectedProject(null);
    }
  };

  const handleClone = async () => {
    if (selectedProject && cloneName && user) {
      await dispatch(cloneProject({ projectId: selectedProject, newName: cloneName, userId: user.id }));
      setCloneModalOpen(false);
      setSelectedProject(null);
      setCloneName('');
    }
  };

  const getStatusBadgeVariant = (status: ProjectStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      case 'PAUSED':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">Manage your annotation projects</p>
        </div>
        <Link to="/ops/projects/create">
          <Button icon={Plus} variant="primary">
            Create Project
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | '')}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <Button onClick={handleSearch} variant="primary">
              Search
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No projects found</p>
              <Link to="/ops/projects/create" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
                Create your first project
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                        {project.description && (
                          <div className="text-sm text-gray-500">{project.description.substring(0, 50)}...</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{project.project_type.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(project.status)}>
                        {project.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/ops/projects/${project.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/ops/projects/${project.id}/edit`)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProject(project.id);
                            setCloneName(`${project.name} (Copy)`);
                            setCloneModalOpen(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Clone"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProject(project.id);
                            setDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && projects.length > 0 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} projects
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => dispatch(fetchProjects({ page: page - 1, limit, search, status: statusFilter || undefined }))}
                disabled={page === 1}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => dispatch(fetchProjects({ page: page + 1, limit, search, status: statusFilter || undefined }))}
                disabled={page * limit >= total}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Project"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this project? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button onClick={() => setDeleteModalOpen(false)} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="danger">
            Delete
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={cloneModalOpen}
        onClose={() => setCloneModalOpen(false)}
        title="Clone Project"
        size="sm"
      >
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Project Name
          </label>
          <input
            type="text"
            value={cloneName}
            onChange={(e) => setCloneName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter project name"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button onClick={() => setCloneModalOpen(false)} variant="secondary">
            Cancel
          </Button>
          <Button onClick={handleClone} variant="primary" disabled={!cloneName}>
            Clone Project
          </Button>
        </div>
      </Modal>
    </div>
  );
};
