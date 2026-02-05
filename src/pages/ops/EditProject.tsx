import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchProjectById, updateProject } from '../../store/projectsSlice';
import { Button, FormInput, FormTextarea, FormSelect } from '../../components/common';
import { ProjectTeamAssignment } from '../../components/common/ProjectTeamAssignment';
import { ProjectStatus } from '../../types';

export const EditProject = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentProject, loading: projectLoading } = useAppSelector((state) => state.projects);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: '' as ProjectStatus | '',
    quality_threshold: 0.8,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
    }
    // Note: Customer is read-only in edit mode, no need to fetch customers list
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProject) {
      setFormData({
        name: currentProject.name,
        description: currentProject.description || '',
        status: currentProject.status,
        quality_threshold: currentProject.quality_threshold || 0.8,
      });
    }
  }, [currentProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!id) return;

    try {
      await dispatch(
        updateProject({
          id,
          input: {
            name: formData.name,
            description: formData.description || undefined,
            status: formData.status as ProjectStatus,
            quality_threshold: formData.quality_threshold,
          },
        })
      ).unwrap();

      navigate(`/ops/projects/${id}`);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  if (projectLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-gray-500">Project not found</p>
          <Button onClick={() => navigate('/ops/projects')} variant="primary" className="mt-4">
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button onClick={() => navigate('/ops/projects')} variant="ghost" icon={ArrowLeft} className="mb-4">
            Back to Projects
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
          <p className="text-gray-600 mt-2">Update project settings</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
          <div className="space-y-6">
            <FormInput
              label="Project Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              error={errors.name}
              placeholder="Enter project name"
            />

            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the project goals and requirements"
            />

            <FormSelect
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              required
              options={[
                { value: 'DRAFT', label: 'Draft' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'PAUSED', label: 'Paused' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'ARCHIVED', label: 'Archived' },
              ]}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Threshold
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={formData.quality_threshold}
                onChange={(e) => setFormData({ ...formData, quality_threshold: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>0%</span>
                <span className="font-medium">{Math.round(formData.quality_threshold * 100)}%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Customer:</dt>
                  <dd className="font-medium">{currentProject.customer?.name || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Type:</dt>
                  <dd className="font-medium">{currentProject.project_type.replace(/_/g, ' ')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Created:</dt>
                  <dd className="font-medium">{new Date(currentProject.created_at).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Questions:</dt>
                  <dd className="font-medium">{currentProject.annotation_questions.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Review Levels:</dt>
                  <dd className="font-medium">{currentProject.workflow_config.review_levels.length}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button onClick={() => navigate('/ops/projects')} variant="ghost">
              Cancel
            </Button>

            <Button type="submit" variant="primary" icon={Save} disabled={projectLoading}>
              {projectLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        {/* Project Team Assignment */}
        <div className="mt-8">
          <ProjectTeamAssignment 
            projectId={id!} 
            onTeamUpdated={() => {
              // Optionally reload project data
              dispatch(fetchProjectById(id!));
            }}
          />
        </div>
      </div>
    </div>
  );
};
