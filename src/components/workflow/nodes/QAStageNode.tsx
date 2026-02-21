import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CheckCircle, Settings, Trash2 } from 'lucide-react';

export const QAStageNode = memo(({ data, id }: NodeProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-green-600 min-w-[220px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span className="font-semibold text-sm">QA Stage</span>
        </div>
        {data.onDelete && (
          <button
            onClick={() => data.onDelete(id)}
            className="p-1 hover:bg-green-800 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="font-medium text-gray-900">{data.label || 'Quality Assurance'}</div>
        
        {data.qaReviewers && data.qaReviewers.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <CheckCircle className="w-3 h-3" />
              <span>{data.qaReviewers.length} QA Reviewer{data.qaReviewers.length !== 1 ? 's' : ''}</span>
            </div>
            {data.qualityThreshold && (
              <div className="text-xs text-green-600">
                Quality: ≥{Math.round(data.qualityThreshold * 100)}%
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Settings className="w-3 h-3" />
            No QA reviewers assigned
          </div>
        )}

        {data.autoAssign !== undefined && (
          <div className="text-xs text-gray-500">
            {data.autoAssign ? 'Auto-assign' : 'Manual assign'}
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-green-600"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-600"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="fail"
        className="w-3 h-3 !bg-red-500"
        style={{ top: '70%' }}
      />
    </div>
  );
});

QAStageNode.displayName = 'QAStageNode';
