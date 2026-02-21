import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Users, Settings, Trash2 } from 'lucide-react';

export const AnnotationStageNode = memo(({ data, id }: NodeProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 min-w-[220px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span className="font-semibold text-sm">Annotation Stage</span>
        </div>
        {data.onDelete && (
          <button
            onClick={() => data.onDelete(id)}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="font-medium text-gray-900">{data.label || 'Untitled Stage'}</div>
        
        {data.annotators && data.annotators.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Users className="w-3 h-3" />
              <span>{data.annotators.length} Annotator{data.annotators.length !== 1 ? 's' : ''}</span>
            </div>
            {data.requireConsensus && (
              <div className="text-xs text-blue-600">
                Consensus: {Math.round((data.consensusThreshold || 0.8) * 100)}%
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Settings className="w-3 h-3" />
            No annotators assigned
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
        className="w-3 h-3 !bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500"
      />
    </div>
  );
});

AnnotationStageNode.displayName = 'AnnotationStageNode';
