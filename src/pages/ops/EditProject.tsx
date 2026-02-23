import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchProjectById, updateProject } from '../../store/projectsSlice';
import { Button, FormInput, FormTextarea, FormSelect } from '../../components/common';
import { ProjectTeamAssignment } from '../../components/common/ProjectTeamAssignment';
import { WorkflowConfigEditor, type ExtendedWorkflowConfiguration } from '../../components/workflow';
import { ProjectStatus, AnnotationQuestion, QuestionType } from '../../types';

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
    annotation_questions: [] as AnnotationQuestion[],
    workflow_config: {
      review_levels: [],
      enable_multi_annotator: false,
      annotators_per_task: 1,
      consensus_threshold: 0.8,
      queue_strategy: 'FIFO',
      assignment_expiration_hours: 24,
      max_tasks_per_annotator: 10,
      stages: [],
      global_max_rework_before_reassignment: 5,
      enable_quality_gates: false,
      minimum_quality_score: 0.8,
    } as ExtendedWorkflowConfiguration,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState({
    workflow: false,
    questions: false,
  });

  const toggleSection = (section: 'workflow' | 'questions') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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
        annotation_questions: currentProject.annotation_questions || [],
        workflow_config: {
          review_levels: currentProject.workflow_config?.review_levels || [],
          enable_multi_annotator: (currentProject.workflow_config?.annotators_per_task || 1) > 1,
          annotators_per_task: currentProject.workflow_config?.annotators_per_task || 1,
          consensus_threshold: currentProject.workflow_config?.consensus_threshold || 0.8,
          queue_strategy: currentProject.workflow_config?.queue_strategy || 'FIFO',
          assignment_expiration_hours: currentProject.workflow_config?.assignment_expiration_hours || 24,
          max_tasks_per_annotator: currentProject.workflow_config?.max_tasks_per_annotator || 10,
          stages: currentProject.workflow_config?.stages || [],
          global_max_rework_before_reassignment: currentProject.workflow_config?.global_max_rework_before_reassignment || 5,
          enable_quality_gates: currentProject.workflow_config?.enable_quality_gates || false,
          minimum_quality_score: currentProject.workflow_config?.minimum_quality_score || 0.8,
        },
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
            annotation_questions: formData.annotation_questions,
            workflow_config: formData.workflow_config,
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
              <p className="text-gray-600 mt-2">Update project settings</p>
            </div>
            <Button
              onClick={() => navigate(`/ops/projects/${id}/plugins`)}
              variant="secondary"
              icon={Zap}
            >
              Manage Plugins
            </Button>
          </div>
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

            {/* Workflow Configuration Section */}
            <div className="border-t pt-6">
              <button
                type="button"
                onClick={() => toggleSection('workflow')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-medium text-gray-900">Workflow Configuration</h3>
                {expandedSections.workflow ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {expandedSections.workflow && (
                <div className="mt-4">
                  <WorkflowConfigEditor
                    config={formData.workflow_config}
                    onChange={(config) => setFormData({ ...formData, workflow_config: config })}
                  />
                </div>
              )}
            </div>

            {/* Annotation Questions Section */}
            <div className="border-t pt-6">
              <button
                type="button"
                onClick={() => toggleSection('questions')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-medium text-gray-900">Annotation Questions</h3>
                {expandedSections.questions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {expandedSections.questions && (
                <div className="mt-4 space-y-6">
                  <p className="text-gray-600">
                    Define the questions annotators will answer for each task
                  </p>

                  {formData.annotation_questions.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <p className="text-gray-500 mb-4">No questions added yet</p>
                      <Button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            annotation_questions: [
                              {
                                id: crypto.randomUUID(),
                                type: QuestionType.TEXT,
                                label: 'Question 1',
                                description: '',
                                required: true,
                                order: 1,
                              },
                            ],
                          })
                        }
                        variant="primary"
                      >
                        Add First Question
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.annotation_questions.map((question, index) => (
                        <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                            <Button
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  annotation_questions: formData.annotation_questions.filter((_, i) => i !== index),
                                })
                              }
                              variant="danger"
                              size="sm"
                            >
                              Remove
                            </Button>
                          </div>

                          <div className="space-y-4">
                            <FormSelect
                              label="Question Type"
                              value={question.type}
                              onChange={(e) => {
                                const updated = [...formData.annotation_questions];
                                updated[index].type = e.target.value as QuestionType;
                                setFormData({ ...formData, annotation_questions: updated });
                              }}
                              options={[
                                { value: 'TEXT', label: 'Text Input' },
                                { value: 'NUMBER', label: 'Number Input' },
                                { value: 'SINGLE_SELECT', label: 'Single Choice' },
                                { value: 'MULTI_SELECT', label: 'Multiple Choice' },
                                { value: 'RATING', label: 'Rating Scale' },
                                { value: 'DATE', label: 'Date Picker' },
                                { value: 'MULTI_TURN', label: 'Multi-Turn Conversation' },
                              ]}
                            />

                            <FormInput
                              label="Question Label"
                              value={question.label}
                              onChange={(e) => {
                                const updated = [...formData.annotation_questions];
                                updated[index].label = e.target.value;
                                setFormData({ ...formData, annotation_questions: updated });
                              }}
                              required
                              placeholder="Enter question text"
                            />

                            <FormTextarea
                              label="Description"
                              value={question.description || ''}
                              onChange={(e) => {
                                const updated = [...formData.annotation_questions];
                                updated[index].description = e.target.value;
                                setFormData({ ...formData, annotation_questions: updated });
                              }}
                              placeholder="Optional instructions for annotators"
                            />

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={question.required}
                                onChange={(e) => {
                                  const updated = [...formData.annotation_questions];
                                  updated[index].required = e.target.checked;
                                  setFormData({ ...formData, annotation_questions: updated });
                                }}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span className="text-sm text-gray-700">Required question</span>
                            </label>

                            {(question.type === QuestionType.SINGLE_SELECT || question.type === QuestionType.MULTI_SELECT) && (
                              <div className="mt-4 p-4 border rounded-lg bg-white">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                                {question.options?.map((option, optIndex) => (
                                  <div key={optIndex} className="flex gap-2 mb-2">
                                    <input
                                      type="text"
                                      value={option.label}
                                      onChange={(e) => {
                                        const updated = [...formData.annotation_questions];
                                        if (updated[index].options) {
                                          updated[index].options![optIndex].label = e.target.value;
                                          updated[index].options![optIndex].value = e.target.value.toLowerCase().replace(/\s+/g, '_');
                                        }
                                        setFormData({ ...formData, annotation_questions: updated });
                                      }}
                                      className="flex-1 px-3 py-2 border rounded-md"
                                      placeholder="Option text"
                                    />
                                    <Button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...formData.annotation_questions];
                                        updated[index].options = updated[index].options?.filter((_, i) => i !== optIndex);
                                        setFormData({ ...formData, annotation_questions: updated });
                                      }}
                                      variant="danger"
                                      size="sm"
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...formData.annotation_questions];
                                    if (!updated[index].options) updated[index].options = [];
                                    updated[index].options!.push({ value: '', label: '' });
                                    setFormData({ ...formData, annotation_questions: updated });
                                  }}
                                  variant="secondary"
                                  size="sm"
                                >
                                  Add Option
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            annotation_questions: [
                              ...formData.annotation_questions,
                              {
                                id: crypto.randomUUID(),
                                type: QuestionType.TEXT,
                                label: `Question ${formData.annotation_questions.length + 1}`,
                                description: '',
                                required: true,
                                order: formData.annotation_questions.length + 1,
                              },
                            ],
                          })
                        }
                        variant="secondary"
                      >
                        Add Another Question
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Project Details (Read-only) */}
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
