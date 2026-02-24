import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, FormInput, FormSelect } from '../common';
import { ReviewLevel, WorkflowConfiguration } from '../../types';

export interface WorkflowStage {
  id: string;
  name: string;
  type: 'ANNOTATION' | 'REVIEW' | 'QA' | 'APPROVAL';
  annotators_count: number;
  reviewers_count: number;
  max_rework_attempts: number;
  require_consensus: boolean;
  consensus_threshold: number;
  auto_assign: boolean;
  allowed_users?: string[];
}

export interface ExtendedWorkflowConfiguration extends WorkflowConfiguration {
  stages: WorkflowStage[];
  global_max_rework_before_reassignment: number;
  enable_quality_gates: boolean;
  minimum_quality_score: number;
}

interface WorkflowConfigEditorProps {
  config: ExtendedWorkflowConfiguration;
  onChange: (config: ExtendedWorkflowConfiguration) => void;
  readOnly?: boolean;
}

export const WorkflowConfigEditor = ({ config, onChange, readOnly = false }: WorkflowConfigEditorProps) => {
  const [expandedSections, setExpandedSections] = useState({
    stages: true,
    assignment: true,
    quality: true,
    advanced: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const addStage = () => {
    const newStage: WorkflowStage = {
      id: crypto.randomUUID(),
      name: `Stage ${config.stages.length + 1}`,
      type: 'ANNOTATION',
      annotators_count: 1,
      reviewers_count: 0,
      max_rework_attempts: 3,
      require_consensus: false,
      consensus_threshold: 0.8,
      auto_assign: true,
      allowed_users: [],
    };
    onChange({ ...config, stages: [...config.stages, newStage] });
  };

  const updateStage = (index: number, updates: Partial<WorkflowStage>) => {
    const updatedStages = [...config.stages];
    updatedStages[index] = { ...updatedStages[index], ...updates };
    onChange({ ...config, stages: updatedStages });
  };

  const removeStage = (index: number) => {
    onChange({ ...config, stages: config.stages.filter((_, i) => i !== index) });
  };

  const addReviewLevel = () => {
    const newLevel: ReviewLevel = {
      level: config.review_levels.length + 1,
      name: `L${config.review_levels.length + 1} Review`,
      reviewers_count: 1,
      require_all_approvals: false,
      auto_assign: true,
      allowed_reviewers: [],
    };
    onChange({ ...config, review_levels: [...config.review_levels, newLevel] });
  };

  const updateReviewLevel = (index: number, updates: Partial<ReviewLevel>) => {
    const updated = [...config.review_levels];
    updated[index] = { ...updated[index], ...updates };
    onChange({ ...config, review_levels: updated });
  };

  const removeReviewLevel = (index: number) => {
    onChange({ ...config, review_levels: config.review_levels.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* Workflow Stages Section */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection('stages')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
          disabled={readOnly}
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">Workflow Stages</h3>
            <p className="text-sm text-gray-600 mt-1">Define the stages tasks go through</p>
          </div>
          {expandedSections.stages ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.stages && (
          <div className="p-4 space-y-4">
            {config.stages.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-gray-500 mb-4">No workflow stages configured</p>
                {!readOnly && (
                  <Button onClick={addStage} variant="primary" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Stage
                  </Button>
                )}
              </div>
            ) : (
              <>
                {config.stages.map((stage, index) => (
                  <div key={stage.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">
                        Stage {index + 1}: {stage.name}
                      </h4>
                      {!readOnly && (
                        <Button
                          onClick={() => removeStage(index)}
                          variant="danger"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="Stage Name"
                        value={stage.name}
                        onChange={(e) => updateStage(index, { name: e.target.value })}
                        disabled={readOnly}
                        placeholder="e.g., Initial Annotation"
                      />

                      <FormSelect
                        label="Stage Type"
                        value={stage.type}
                        onChange={(e) => updateStage(index, { type: e.target.value as WorkflowStage['type'] })}
                        disabled={readOnly}
                        options={[
                          { value: 'ANNOTATION', label: 'Annotation' },
                          { value: 'REVIEW', label: 'Review' },
                          { value: 'QA', label: 'Quality Assurance' },
                          { value: 'APPROVAL', label: 'Final Approval' },
                        ]}
                      />

                      <FormInput
                        label={`Number of ${stage.type === 'ANNOTATION' ? 'Annotators' : 'Reviewers'}`}
                        type="number"
                        min="1"
                        max="10"
                        value={stage.type === 'ANNOTATION' ? stage.annotators_count : stage.reviewers_count}
                        onChange={(e) => {
                          const count = parseInt(e.target.value) || 1;
                          if (stage.type === 'ANNOTATION') {
                            updateStage(index, { annotators_count: count, reviewers_count: 0 });
                          } else {
                            updateStage(index, { reviewers_count: count, annotators_count: 0 });
                          }
                        }}
                        disabled={readOnly}
                        helperText={`Task owners for this ${stage.type.toLowerCase()} stage`}
                      />

                      <FormInput
                        label="Max Rework Attempts"
                        type="number"
                        min="1"
                        max="10"
                        value={stage.max_rework_attempts}
                        onChange={(e) => updateStage(index, { max_rework_attempts: parseInt(e.target.value) || 3 })}
                        disabled={readOnly}
                        helperText="Before reassignment"
                      />

                      {((stage.type === 'ANNOTATION' && stage.annotators_count > 1) || 
                        (stage.type !== 'ANNOTATION' && stage.reviewers_count > 1)) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Consensus Threshold
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="1"
                            step="0.05"
                            value={stage.consensus_threshold}
                            onChange={(e) => updateStage(index, { consensus_threshold: parseFloat(e.target.value) })}
                            disabled={readOnly}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-gray-600 mt-1">
                            <span>50%</span>
                            <span className="font-medium">{Math.round(stage.consensus_threshold * 100)}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stage.require_consensus}
                          onChange={(e) => updateStage(index, { require_consensus: e.target.checked })}
                          disabled={readOnly || 
                            (stage.type === 'ANNOTATION' ? stage.annotators_count <= 1 : stage.reviewers_count <= 1)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          Require consensus between {stage.type === 'ANNOTATION' ? 'annotators' : 'reviewers'}
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={stage.auto_assign}
                          onChange={(e) => updateStage(index, { auto_assign: e.target.checked })}
                          disabled={readOnly}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">Auto-assign tasks</span>
                      </label>
                    </div>
                  </div>
                ))}

                {!readOnly && (
                  <Button onClick={addStage} variant="secondary" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Stage
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Assignment Configuration */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection('assignment')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          disabled={readOnly}
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">Assignment Configuration</h3>
            <p className="text-sm text-gray-600 mt-1">Control how tasks are distributed</p>
          </div>
          {expandedSections.assignment ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.assignment && (
          <div className="p-4 space-y-4">
            <FormSelect
              label="Queue Strategy"
              value={config.queue_strategy}
              onChange={(e) => onChange({ ...config, queue_strategy: e.target.value as WorkflowConfiguration['queue_strategy'] })}
              disabled={readOnly}
              options={[
                { value: 'FIFO', label: 'First In First Out (FIFO)' },
                { value: 'PRIORITY', label: 'Priority Based' },
                { value: 'SKILL_BASED', label: 'Skill Based Assignment' },
              ]}
              helperText="How tasks are prioritized in the queue"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Assignment Expiration (hours)"
                type="number"
                min="1"
                max="168"
                value={config.assignment_expiration_hours}
                onChange={(e) => onChange({ ...config, assignment_expiration_hours: parseInt(e.target.value) || 24 })}
                disabled={readOnly}
                helperText="Hours before task is auto-released"
              />

              <FormInput
                label="Max Tasks Per User"
                type="number"
                min="1"
                max="100"
                value={config.max_tasks_per_annotator}
                onChange={(e) => onChange({ ...config, max_tasks_per_annotator: parseInt(e.target.value) || 10 })}
                disabled={readOnly}
                helperText="Maximum concurrent assignments"
              />

              <FormInput
                label="Global Rework Limit"
                type="number"
                min="1"
                max="20"
                value={config.global_max_rework_before_reassignment}
                onChange={(e) => onChange({ ...config, global_max_rework_before_reassignment: parseInt(e.target.value) || 5 })}
                disabled={readOnly}
                helperText="Max rework attempts before reassignment"
              />
            </div>
          </div>
        )}
      </div>

      {/* Quality Configuration */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection('quality')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          disabled={readOnly}
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">Quality Control</h3>
            <p className="text-sm text-gray-600 mt-1">Quality gates and thresholds</p>
          </div>
          {expandedSections.quality ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.quality && (
          <div className="p-4 space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enable_quality_gates}
                onChange={(e) => onChange({ ...config, enable_quality_gates: e.target.checked })}
                disabled={readOnly}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-900">Enable Quality Gates</span>
            </label>

            {config.enable_quality_gates && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Quality Score
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.minimum_quality_score}
                  onChange={(e) => onChange({ ...config, minimum_quality_score: parseFloat(e.target.value) })}
                  disabled={readOnly}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>0%</span>
                  <span className="font-medium">{Math.round(config.minimum_quality_score * 100)}%</span>
                  <span>100%</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Tasks below this score will be sent for rework
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Levels (Legacy Support) */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection('advanced')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-b-lg hover:bg-gray-100 transition-colors"
          disabled={readOnly}
        >
          <div>
            <h3 className="text-lg font-medium text-gray-900">Advanced: Review Levels</h3>
            <p className="text-sm text-gray-600 mt-1">Legacy review configuration</p>
          </div>
          {expandedSections.advanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.advanced && (
          <div className="p-4 space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Use Workflow Stages above for more flexible configuration. Review Levels are maintained for backward compatibility.
              </p>
            </div>

            {config.review_levels.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed rounded-lg">
                <p className="text-gray-500 mb-3">No review levels configured</p>
                {!readOnly && (
                  <Button onClick={addReviewLevel} variant="secondary" size="sm">
                    Add Review Level
                  </Button>
                )}
              </div>
            ) : (
              <>
                {config.review_levels.map((level, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Level {level.level}</h4>
                      {!readOnly && (
                        <Button onClick={() => removeReviewLevel(index)} variant="danger" size="sm">
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label="Level Name"
                        value={level.name}
                        onChange={(e) => updateReviewLevel(index, { name: e.target.value })}
                        disabled={readOnly}
                      />
                      <FormInput
                        label="Reviewers Count"
                        type="number"
                        min="1"
                        value={level.reviewers_count}
                        onChange={(e) => updateReviewLevel(index, { reviewers_count: parseInt(e.target.value) || 1 })}
                        disabled={readOnly}
                      />
                    </div>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={level.auto_assign}
                        onChange={(e) => updateReviewLevel(index, { auto_assign: e.target.checked })}
                        disabled={readOnly}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Auto-assign reviewers</span>
                    </label>
                  </div>
                ))}
                {!readOnly && (
                  <Button onClick={addReviewLevel} variant="secondary" size="sm">
                    Add Another Level
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
