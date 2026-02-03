import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, Edit, Trash2 } from 'lucide-react';
import { DecisionNodeData } from '../../../types/workflow';

export const DecisionNode = memo(({ id, data, selected }: NodeProps<DecisionNodeData>) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-4 min-w-[200px] border-2 transition-all ${
        selected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
      />

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="bg-purple-100 p-2 rounded-lg">
            <GitBranch className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 text-sm">{data.label}</div>
            {data.condition && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                {data.condition}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          {data.onEdit && (
            <button
              onClick={() => data.onEdit?.(id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Edit condition"
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

      <div className="flex gap-2 mt-3">
        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          style={{ left: '33%' }}
          className="w-3 h-3 !bg-green-500 border-2 border-white"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          style={{ left: '66%' }}
          className="w-3 h-3 !bg-red-500 border-2 border-white"
        />
      </div>

      <div className="flex justify-between mt-2 text-xs font-medium">
        <span className="text-green-600 ml-8">True</span>
        <span className="text-red-600 mr-8">False</span>
      </div>
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';
