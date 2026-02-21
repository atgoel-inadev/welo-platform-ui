import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Eye, Settings, Trash2 } from 'lucide-react';

export const ReviewStageNode = memo(({ data, id }: NodeProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-purple-500 min-w-[220px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span className="font-semibold text-sm">Review Stage</span>
        </div>
        {data.onDelete && (
          <button
            onClick={() => data.onDelete(id)}
            className="p-1 hover:bg-purple-700 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="font-medium text-gray-900">{data.label || 'Untitled Review'}</div>
        
        {data.reviewers && data.reviewers.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Eye className="w-3 h-3" />
              <span>{data.reviewers.length} Reviewer{data.reviewers.length !== 1 ? 's' : ''}</span>
            </div>
            {data.reviewLevel && (
              <div className="text-xs text-purple-600">
                Level {data.reviewLevel} Review
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Settings className="w-3 h-3" />
            No reviewers assigned
          </div>
        )}

        {data.maxReworkAttempts && (
          <div className="text-xs text-gray-500">
            Max rework: {data.maxReworkAttempts}
          </div>
        )}
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="reject"
        className="w-3 h-3 !bg-red-500"
        style={{ top: '70%' }}
      />
    </div>
  );
});

ReviewStageNode.displayName = 'ReviewStageNode';
