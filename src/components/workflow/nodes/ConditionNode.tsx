import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Filter, Edit, Trash2 } from 'lucide-react';
import { ConditionNodeData } from '../../../types/workflow';

export const ConditionNode = memo(({ id, data, selected }: NodeProps<ConditionNodeData>) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-4 min-w-[200px] border-2 transition-all ${
        selected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-orange-500 border-2 border-white"
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="bg-orange-100 p-2 rounded-lg">
            <Filter className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 text-sm">{data.label}</div>
            {data.expression && (
              <div className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-1 rounded truncate">
                {data.expression}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          {data.onEdit && (
            <button
              onClick={() => data.onEdit?.(id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Edit expression"
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

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-orange-500 border-2 border-white"
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
