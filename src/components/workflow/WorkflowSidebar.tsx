import { useState } from 'react';
import { X, Edit, Layers } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { QuestionBuilder } from './QuestionBuilder';
import { Question } from '../../types/workflow';
import { Button } from '../common';

export const WorkflowSidebar = () => {
  const { selectedNode, updateNode } = useWorkflowStore();
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex items-center justify-center">
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

  const renderNodeDetails = () => {
    switch (selectedNode.type) {
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
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Node Properties</h3>
            <button
              onClick={() => useWorkflowStore.getState().selectNode(null)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-1">Node Type</div>
            <div className="text-sm text-gray-900 font-medium capitalize">
              {selectedNode.type} Node
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
