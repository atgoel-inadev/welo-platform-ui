import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchCustomers } from '../../store/customersSlice';
import { createProject } from '../../store/projectsSlice';
import { Button, FormInput, FormTextarea, FormSelect } from '../../components/common';
import { ProjectType, AnnotationQuestion, QuestionType, ReviewLevel } from '../../types';

interface FormData {
  name: string;
  description: string;
  customer_id: string;
  project_type: ProjectType | '';
  quality_threshold: number;
  annotation_questions: AnnotationQuestion[];
  review_levels: ReviewLevel[];
  enable_multi_annotator: boolean;
  annotators_per_task: number;
  consensus_threshold: number;
  queue_strategy: 'FIFO' | 'PRIORITY' | 'SKILL_BASED';
  assignment_expiration_hours: number;
  max_tasks_per_annotator: number;
}

export const CreateProject = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { customers, loading: customersLoading } = useAppSelector((state) => state.customers);
  const { loading: projectLoading } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    customer_id: '',
    project_type: '',
    quality_threshold: 0.8,
    annotation_questions: [],
    review_levels: [],
    enable_multi_annotator: false,
    annotators_per_task: 1,
    consensus_threshold: 0.8,
    queue_strategy: 'FIFO',
    assignment_expiration_hours: 24,
    max_tasks_per_annotator: 10,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Project name is required';
      if (!formData.customer_id) newErrors.customer_id = 'Customer is required';
      if (!formData.project_type) newErrors.project_type = 'Project type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      await dispatch(
        createProject({
          input: {
            name: formData.name,
            description: formData.description || undefined,
            customer_id: formData.customer_id,
            project_type: formData.project_type as ProjectType,
            annotation_questions: formData.annotation_questions,
            workflow_config: {
              review_levels: formData.review_levels,
              enable_multi_annotator: formData.enable_multi_annotator,
              annotators_per_task: formData.annotators_per_task,
              consensus_threshold: formData.consensus_threshold,
              queue_strategy: formData.queue_strategy,
              assignment_expiration_hours: formData.assignment_expiration_hours,
              max_tasks_per_annotator: formData.max_tasks_per_annotator,
            },
            quality_threshold: formData.quality_threshold,
          },
          userId: user.id,
        })
      ).unwrap();

      navigate('/ops/projects');
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const projectTypes = [
    { value: 'TEXT_ANNOTATION', label: 'Text Annotation' },
    { value: 'IMAGE_ANNOTATION', label: 'Image Annotation' },
    { value: 'AUDIO_TRANSCRIPTION', label: 'Audio Transcription' },
    { value: 'VIDEO_ANNOTATION', label: 'Video Annotation' },
    { value: 'DATA_LABELING', label: 'Data Labeling' },
    { value: 'CONTENT_MODERATION', label: 'Content Moderation' },
  ];

  const steps = [
    { number: 1, name: 'Basic Details' },
    { number: 2, name: 'Workflow' },
    { number: 3, name: 'Questions' },
    { number: 4, name: 'Review' },
  ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-600 mt-2">Set up your annotation project</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : currentStep === step.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? <Check size={20} /> : step.number}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Project Details</h2>

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
                helperText="Optional but recommended"
              />

              <FormSelect
                label="Customer"
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                required
                error={errors.customer_id}
                options={customers.map((c) => ({ value: c.id, label: c.name }))}
                disabled={customersLoading}
              />

              <FormSelect
                label="Project Type"
                value={formData.project_type}
                onChange={(e) => setFormData({ ...formData, project_type: e.target.value as ProjectType })}
                required
                error={errors.project_type}
                options={projectTypes}
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
                <p className="text-sm text-gray-500 mt-1">
                  Minimum quality score required for task completion
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Workflow Configuration</h2>

              <div className="border rounded-lg p-4 bg-gray-50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enable_multi_annotator}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enable_multi_annotator: e.target.checked,
                        annotators_per_task: e.target.checked ? 3 : 1,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Enable Multi-Annotator Consensus</span>
                </label>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Multiple annotators will work on each task to ensure quality
                </p>
              </div>

              {formData.enable_multi_annotator && (
                <div className="space-y-4">
                  <FormInput
                    label="Annotators Per Task"
                    type="number"
                    min="2"
                    max="10"
                    value={formData.annotators_per_task}
                    onChange={(e) => setFormData({ ...formData, annotators_per_task: parseInt(e.target.value) })}
                    helperText="Number of annotators assigned to each task"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Consensus Threshold
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.05"
                      value={formData.consensus_threshold}
                      onChange={(e) => setFormData({ ...formData, consensus_threshold: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>50%</span>
                      <span className="font-medium">{Math.round(formData.consensus_threshold * 100)}%</span>
                      <span>100%</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Minimum agreement percentage required between annotators
                    </p>
                  </div>
                </div>
              )}

              <FormSelect
                label="Queue Strategy"
                value={formData.queue_strategy}
                onChange={(e) => setFormData({ ...formData, queue_strategy: e.target.value as 'FIFO' | 'PRIORITY' | 'SKILL_BASED' })}
                options={[
                  { value: 'FIFO', label: 'First In First Out (FIFO)' },
                  { value: 'PRIORITY', label: 'Priority Based' },
                  { value: 'SKILL_BASED', label: 'Skill Based Assignment' },
                ]}
                helperText="How tasks are assigned to annotators"
              />

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Assignment Expiration (hours)"
                  type="number"
                  min="1"
                  max="168"
                  value={formData.assignment_expiration_hours}
                  onChange={(e) => setFormData({ ...formData, assignment_expiration_hours: parseInt(e.target.value) })}
                  helperText="Hours before task is auto-released"
                />

                <FormInput
                  label="Max Tasks Per Annotator"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.max_tasks_per_annotator}
                  onChange={(e) => setFormData({ ...formData, max_tasks_per_annotator: parseInt(e.target.value) })}
                  helperText="Maximum concurrent assignments"
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Review Levels</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add review stages to ensure quality. Reviews happen after annotation.
                </p>

                {formData.review_levels.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500 mb-4">No review levels configured</p>
                    <Button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          review_levels: [
                            {
                              level: 1,
                              name: 'L1 Review',
                              reviewers_count: 1,
                              require_all_approvals: false,
                              auto_assign: true,
                              allowed_reviewers: [],
                            },
                          ],
                        })
                      }
                      variant="primary"
                      size="sm"
                    >
                      Add Review Level
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.review_levels.map((level, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">Level {level.level} Review</h4>
                          <Button
                            onClick={() =>
                              setFormData({
                                ...formData,
                                review_levels: formData.review_levels.filter((_, i) => i !== index),
                              })
                            }
                            variant="danger"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormInput
                            label="Level Name"
                            value={level.name}
                            onChange={(e) => {
                              const updated = [...formData.review_levels];
                              updated[index].name = e.target.value;
                              setFormData({ ...formData, review_levels: updated });
                            }}
                            placeholder="e.g., L1 Review"
                          />
                          <FormInput
                            label="Reviewers Count"
                            type="number"
                            min="1"
                            value={level.reviewers_count}
                            onChange={(e) => {
                              const updated = [...formData.review_levels];
                              updated[index].reviewers_count = parseInt(e.target.value);
                              setFormData({ ...formData, review_levels: updated });
                            }}
                          />
                        </div>
                        <label className="flex items-center gap-2 mt-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={level.auto_assign}
                            onChange={(e) => {
                              const updated = [...formData.review_levels];
                              updated[index].auto_assign = e.target.checked;
                              setFormData({ ...formData, review_levels: updated });
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm text-gray-700">Auto-assign reviewers</span>
                        </label>
                      </div>
                    ))}
                    <Button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          review_levels: [
                            ...formData.review_levels,
                            {
                              level: formData.review_levels.length + 1,
                              name: `L${formData.review_levels.length + 1} Review`,
                              reviewers_count: 1,
                              require_all_approvals: false,
                              auto_assign: true,
                              allowed_reviewers: [],
                            },
                          ],
                        })
                      }
                      variant="secondary"
                      size="sm"
                    >
                      Add Another Level
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Annotation Questions</h2>
              <p className="text-gray-600 mb-4">
                Define the questions annotators will answer for each task
              </p>

              {formData.annotation_questions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-gray-500 mb-4">No questions added yet</p>
                  <Button
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

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Review & Submit</h2>

              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Basic Details</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{formData.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Type:</dt>
                      <dd className="font-medium">{formData.project_type.replace(/_/g, ' ')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Customer:</dt>
                      <dd className="font-medium">{customers.find((c) => c.id === formData.customer_id)?.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Quality Threshold:</dt>
                      <dd className="font-medium">{Math.round(formData.quality_threshold * 100)}%</dd>
                    </div>
                  </dl>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Workflow Configuration</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Multi-Annotator:</dt>
                      <dd className="font-medium">{formData.enable_multi_annotator ? 'Enabled' : 'Disabled'}</dd>
                    </div>
                    {formData.enable_multi_annotator && (
                      <>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Annotators Per Task:</dt>
                          <dd className="font-medium">{formData.annotators_per_task}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Consensus Threshold:</dt>
                          <dd className="font-medium">{Math.round(formData.consensus_threshold * 100)}%</dd>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Queue Strategy:</dt>
                      <dd className="font-medium">{formData.queue_strategy}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Review Levels:</dt>
                      <dd className="font-medium">{formData.review_levels.length}</dd>
                    </div>
                  </dl>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Annotation Questions</h3>
                  <p className="text-sm text-gray-600">
                    {formData.annotation_questions.length} question(s) configured
                  </p>
                  <div className="mt-2 space-y-2">
                    {formData.annotation_questions.map((q, i) => (
                      <div key={q.id} className="text-sm flex items-center gap-2">
                        <span className="text-gray-600">{i + 1}.</span>
                        <span className="font-medium">{q.label}</span>
                        <span className="text-gray-500">({q.type})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {formData.annotation_questions.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      Warning: No annotation questions configured. You can add them later.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button onClick={() => navigate('/ops/projects')} variant="ghost">
              Cancel
            </Button>

            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button onClick={handlePrevious} variant="secondary" icon={ChevronLeft}>
                  Previous
                </Button>
              )}

              {currentStep < 4 ? (
                <Button onClick={handleNext} variant="primary" icon={ChevronRight}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} variant="primary" disabled={projectLoading} icon={Check}>
                  {projectLoading ? 'Creating...' : 'Create Project'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
