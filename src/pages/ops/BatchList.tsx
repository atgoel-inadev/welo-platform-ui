import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, Clock, AlertCircle, Filter, Plus } from 'lucide-react';
import { batchService, Batch, BatchStatistics } from '../../services/batchService';
import { projectService } from '../../services/projectService';
import { Project } from '../../types';

export const BatchList = () => {
  const navigate = useNavigate();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchStats, setBatchStats] = useState<Record<string, BatchStatistics>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadProjects();
    loadBatches();
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      const response = await projectService.fetchProjects({ status: 'ACTIVE' });
      setProjects(response.data || []);
    } catch (error: any) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadBatches = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await batchService.listBatches(selectedProjectId || undefined);
      setBatches(data);

      // Load statistics for each batch
      const statsPromises = data.map(batch => 
        batchService.getBatchStatistics(batch.id)
          .catch(err => {
            console.error(`Failed to load stats for batch ${batch.id}:`, err);
            return null;
          })
      );
      
      const stats = await Promise.all(statsPromises);
      const statsMap: Record<string, BatchStatistics> = {};
      data.forEach((batch, index) => {
        if (stats[index]) {
          statsMap[batch.id] = stats[index];
        }
      });
      setBatchStats(statsMap);
    } catch (error: any) {
      console.error('Failed to load batches:', error);
      setError(error.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (batchId: string): number => {
    const stats = batchStats[batchId];
    if (!stats || stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBatches = batches.filter(batch => {
    if (statusFilter && batch.status !== statusFilter) return false;
    return true;
  });

  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batches</h1>
          <p className="mt-2 text-gray-600">
            Manage and monitor your annotation batches
          </p>
        </div>
        <button
          onClick={() => navigate('/ops/batches/upload')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Upload Batch
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <button
            onClick={loadBatches}
            className="mt-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading batches...</p>
        </div>
      )}

      {/* Batches Grid */}
      {!loading && filteredBatches.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Batches Found</h3>
          <p className="text-gray-600 mb-6">
            {selectedProjectId || statusFilter 
              ? 'No batches match your filters. Try adjusting your search criteria.'
              : 'Get started by uploading your first batch of files.'}
          </p>
          <button
            onClick={() => navigate('/ops/batches/upload')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Batch
          </button>
        </div>
      )}

      {!loading && filteredBatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => {
            const stats = batchStats[batch.id];
            const progress = getProgressPercentage(batch.id);

            return (
              <div
                key={batch.id}
                onClick={() => navigate(`/ops/batches/${batch.id}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {batch.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getProjectName(batch.projectId)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                    {batch.status}
                  </span>
                </div>

                {/* Description */}
                {batch.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {batch.description}
                  </p>
                )}

                {/* Statistics */}
                {stats && (
                  <div className="space-y-3 mb-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Total</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {stats.totalTasks}
                        </p>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <p className="text-xs text-green-600">Done</p>
                        <p className="text-lg font-semibold text-green-700">
                          {stats.completedTasks}
                        </p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-xs text-blue-600">Active</p>
                        <p className="text-lg font-semibold text-blue-700">
                          {stats.inProgressTasks}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {new Date(batch.createdAt).toLocaleDateString()}
                  </div>
                  {stats?.qualityScore && (
                    <div className="flex items-center text-xs text-green-600">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {Math.round(stats.qualityScore * 100)}% Quality
                    </div>
                  )}
                  {batch.priority > 5 && (
                    <span className="text-xs font-medium text-orange-600">
                      High Priority
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && filteredBatches.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Summary</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{filteredBatches.length}</p>
              <p className="text-sm text-gray-600">Total Batches</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {filteredBatches.filter(b => b.status === 'ACTIVE').length}
              </p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {filteredBatches.filter(b => b.status === 'COMPLETED').length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {Object.values(batchStats).reduce((sum, stat) => sum + stat.totalTasks, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Tasks</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
