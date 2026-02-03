import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { HelpCircle, Edit, Trash2 } from 'lucide-react';
import { QuestionNodeData } from '../../../types/workflow';

export const QuestionNode = memo(({ id, data, selected }: NodeProps<QuestionNodeData>) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-4 min-w-[220px] border-2 transition-all ${
        selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="bg-blue-100 p-2 rounded-lg">
            <HelpCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 text-sm">{data.label}</div>
            <div className="text-xs text-gray-500 mt-1">
              {data.questions?.length || 0} question(s)
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          {data.onEdit && (
            <button
              onClick={() => data.onEdit?.(id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Edit questions"
            >
              <Edit className="w-3 h-3 text-gray-600" />
            </button>
          )}
          {data.onDelete && (
            <button
              onClick={() => data.onDelete?.(id)}
              className="p-1 hover:bg-red-50 rounded transition-colors"
              title="Delete node"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
            </button>
          )}
        </div>
      </div>

      {data.questions && data.questions.length > 0 && (
        <div className="bg-gray-50 rounded p-2 text-xs text-gray-600 space-y-1">
          {data.questions.slice(0, 2).map((q) => (
            <div key={q.id} className="truncate">
              • {q.question_text}
            </div>
          ))}
          {data.questions.length > 2 && (
            <div className="text-gray-500 italic">
              +{data.questions.length - 2} more...
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 border-2 border-white"
      />
    </div>
  );
});

QuestionNode.displayName = 'QuestionNode';
