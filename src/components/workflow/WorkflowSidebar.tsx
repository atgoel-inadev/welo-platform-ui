import { useState, useEffect } from 'react';
import { X, Edit, Layers, Users, UserPlus, Trash2, AlertCircle } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { useAppSelector } from '../../hooks/useRedux';
import { QuestionBuilder } from './QuestionBuilder';
import { Question } from '../../types/workflow';
import { Button } from '../common';
import { userService, ProjectTeamMember } from '../../services/userService';

export const WorkflowSidebar = () => {
  const { selectedNode, updateNode, currentWorkflow } = useWorkflowStore();
  const { currentProject } = useAppSelector((state) => state.projects);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  useEffect(() => {
    if (currentWorkflow?.project_id) {
      loadProjectTeam(currentWorkflow.project_id);
    }
  }, [currentWorkflow?.project_id]);

  const loadProjectTeam = async (projectId: string) => {
    setLoadingTeam(true);
    try {
      const members = await userService.getProjectTeam(projectId);
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoadingTeam(false);
    }
  };

  if (!selectedNode) {
    return (
      <div className="w-96 bg-white border-l border-gray-200 p-6 flex items-center justify-center">
        <div className="text-center">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Select a node to view and edit its properties
          </p>
        </div>
      </div>
    );
  }

  const handleSaveQuestions = (questions: Partial<Question>[]) => {
    updateNode(selectedNode.id, { questions });
    setShowQuestionBuilder(false);
  };

  const handleAddUser = (userId: string, role: 'annotator' | 'reviewer' | 'qa') => {
    const member = teamMembers.find(m => m.userId === userId);
    if (!member) return;

    const field = role === 'annotator' ? 'annotators' : role === 'reviewer' ? 'reviewers' : 'qaReviewers';
    const currentUsers = selectedNode.data[field] || [];
    
    if (!currentUsers.includes(userId)) {
      updateNode(selectedNode.id, {
        [field]: [...currentUsers, userId]
      });
    }
  };

  const handleRemoveUser = (userId: string, role: 'annotator' | 'reviewer' | 'qa') => {
    const field = role === 'annotator' ? 'annotators' : role === 'reviewer' ? 'reviewers' : 'qaReviewers';
    const currentUsers = selectedNode.data[field] || [];
    
    updateNode(selectedNode.id, {
      [field]: currentUsers.filter((id: string) => id !== userId)
    });
  };

  const getUserName = (userId: string): string => {
    const member = teamMembers.find(m => m.userId === userId);
    return member?.userName || userId;
  };

  const getAvailableAnnotators = (): ProjectTeamMember[] => {
    return teamMembers.filter(m => 
      m.role === 'ANNOTATOR' && 
      !(selectedNode.data.annotators || []).includes(m.userId)
    );
  };

  const getAvailableReviewers = (): ProjectTeamMember[] => {
    return teamMembers.filter(m => 
      m.role === 'REVIEWER' && 
      !(selectedNode.data.reviewers || []).includes(m.userId)
    );
  };

  const renderStageUserAllocation = (field: 'annotators' | 'reviewers' | 'qaReviewers', role: 'annotator' | 'reviewer' | 'qa', label: string) => {
    const assignedUsers = selectedNode.data[field] || [];
    const availableUsers = role === 'annotator' ? getAvailableAnnotators() : getAvailableReviewers();

    return (
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900">{label}</h4>
          <span className="text-xs text-gray-500">
            {assignedUsers.length} assigned
          </span>
        </div>

        {assignedUsers.length > 0 && (
          <div className="mb-3 space-y-2">
            {assignedUsers.map((userId: string) => (
              <div key={userId} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">{getUserName(userId)}</span>
                </div>
                <button
                  onClick={() => handleRemoveUser(userId, role)}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        )}

        {availableUsers.length > 0 ? (
          <div>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAddUser(e.target.value, role);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              defaultValue=""
            >
              <option value="">Add {label.toLowerCase()}...</option>
              {availableUsers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.userName}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center py-2 border border-dashed rounded-lg">
            {assignedUsers.length > 0 ? `All ${label.toLowerCase()} assigned` : `No ${label.toLowerCase()} available in project team`}
          </div>
        )}
      </div>
    );
  };

  const renderNodeDetails = () => {
    switch (selectedNode.type) {
      case 'annotationStage':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stage Name
              </label>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., Initial Annotation"
              />
            </div>

            {renderStageUserAllocation('annotators', 'annotator', 'Annotators')}

            <div className="border-t border-gray-200 pt-4">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={selectedNode.data.requireConsensus || false}
                  onChange={(e) => updateNode(selectedNode.id, { requireConsensus: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-900">Require Consensus</span>
              </label>

              {selectedNode.data.requireConsensus && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consensus Threshold: {Math.round((selectedNode.data.consensusThreshold || 0.8) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.05"
                    value={selectedNode.data.consensusThreshold || 0.8}
                    onChange={(e) => updateNode(selectedNode.id, { consensusThreshold: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Rework Attempts
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={selectedNode.data.maxReworkAttempts || 3}
                onChange={(e) => updateNode(selectedNode.id, { maxReworkAttempts: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tasks will be reassigned after this many rework attempts
              </p>
            </div>
          </div>
        );

      case 'reviewStage':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stage Name
              </label>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., L1 Review"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Level
              </label>
              <select
                value={selectedNode.data.reviewLevel || 1}
                onChange={(e) => updateNode(selectedNode.id, { reviewLevel: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value={1}>Level 1 (L1)</option>
                <option value={2}>Level 2 (L2)</option>
                <option value={3}>Level 3 (L3)</option>
              </select>
            </div>

            {renderStageUserAllocation('reviewers', 'reviewer', 'Reviewers')}

            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Rework Attempts
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={selectedNode.data.maxReworkAttempts || 3}
                onChange={(e) => updateNode(selectedNode.id, { maxReworkAttempts: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max times task can be sent back for rework
              </p>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-800">
                <strong>Reject Handle:</strong> Use the red handle on the right to route rejected tasks back for rework
              </p>
            </div>
          </div>
        );

      case 'qaStage':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stage Name
              </label>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Quality Assurance"
              />
            </div>

            {renderStageUserAllocation('qaReviewers', 'qa', 'QA Reviewers')}

            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Threshold: {Math.round((selectedNode.data.qualityThreshold || 0.9) * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={selectedNode.data.qualityThreshold || 0.9}
                onChange={(e) => updateNode(selectedNode.id, { qualityThreshold: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum quality score to pass this stage
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedNode.data.autoAssign !== false}
                  onChange={(e) => updateNode(selectedNode.id, { autoAssign: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm font-medium text-gray-900">Auto-assign Tasks</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Automatically assign tasks to available QA reviewers
              </p>
            </div>

            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-xs text-green-800">
                <strong>Fail Handle:</strong> Use the red handle on the right to route failed tasks back for correction
              </p>
            </div>
          </div>
        );
      case 'start':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Node Label
              </label>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <p className="text-sm text-gray-600">
              This is the entry point of your workflow. Users will start here.
            </p>
          </div>
        );

      case 'question':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Node Label
              </label>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Questions</h4>
                <span className="text-xs text-gray-500">
                  {selectedNode.data.questions?.length || 0} configured
                </span>
              </div>

              <Button
                onClick={() => setShowQuestionBuilder(true)}
                variant="secondary"
                className="w-full"
              >
                <Edit className="w-4 h-4 mr-2" />
                {selectedNode.data.questions?.length > 0 ? 'Edit Questions' : 'Add Questions'}
              </Button>

              {selectedNode.data.questions && selectedNode.data.questions.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedNode.data.questions.map((q: Question, idx: number) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        {q.question_type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-900">{q.question_text}</div>
                      {q.is_required && (
                        <span className="inline-block mt-1 text-xs text-red-600">Required</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'decision':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Node Label
              </label>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <textarea
                value={selectedNode.data.condition || ''}
                onChange={(e) => updateNode(selectedNode.id, { condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="e.g., answer === 'yes'"
              />
              <p className="mt-1 text-xs text-gray-500">
                Define the condition that determines the path
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>True:</strong> Connects to the green handle
                <br />
                <strong>False:</strong> Connects to the red handle
              </p>
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Node Label
              </label>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expression
              </label>
              <textarea
                value={selectedNode.data.expression || ''}
                onChange={(e) => updateNode(selectedNode.id, { expression: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                rows={4}
                placeholder="e.g., rating > 3 && feedback !== ''"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter a JavaScript expression to evaluate
              </p>
            </div>
          </div>
        );

      case 'end':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Node Label
              </label>
              <input
                type="text"
                value={selectedNode.data.label}
                onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Completion Message
              </label>
              <textarea
                value={selectedNode.data.message || ''}
                onChange={(e) => updateNode(selectedNode.id, { message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Thank you for completing this workflow!"
              />
              <p className="mt-1 text-xs text-gray-500">
                Message shown when users reach this end node
              </p>
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-gray-500">Unknown node type</p>;
    }
  };

  return (
    <>
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedNode.type.includes('Stage') ? 'Stage Configuration' : 'Node Properties'}
            </h3>
            <button
              onClick={() => useWorkflowStore.getState().selectNode(null)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {loadingTeam && (
            <div className="mb-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-xs text-gray-500 mt-2">Loading team members...</p>
            </div>
          )}

          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-1">Node Type</div>
            <div className="text-sm text-gray-900 font-medium capitalize">
              {selectedNode.type.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="text-xs text-gray-500 mt-1">ID: {selectedNode.id}</div>
          </div>

          {renderNodeDetails()}
        </div>
      </div>

      {showQuestionBuilder && (
        <QuestionBuilder
          nodeId={selectedNode.id}
          questions={selectedNode.data.questions || []}
          onSave={handleSaveQuestions}
          onClose={() => setShowQuestionBuilder(false)}
        />
      )}
    </>
  );
};
