import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { StartNode, QuestionNode, DecisionNode, ConditionNode, EndNode } from './nodes';
import { WorkflowToolbar } from './WorkflowToolbar';
import { useWorkflowStore } from '../../store/workflowStore';
import { Save, AlertCircle } from 'lucide-react';

export const WorkflowBuilder = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    deleteNode,
    updateNode,
    selectNode,
    saveWorkflowData,
    isLoading,
    error,
    currentWorkflow,
  } = useWorkflowStore();

  const nodeTypes = useMemo(
    () => ({
      start: StartNode,
      question: QuestionNode,
      decision: DecisionNode,
      condition: ConditionNode,
      end: EndNode,
    }),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      addNode(type, position);
    },
    [addNode]
  );

  const handleSave = async () => {
    await saveWorkflowData();
  };

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      selectNode(node);
    },
    [selectNode]
  );

  const enhancedNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onEdit: (nodeId: string) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (node) selectNode(node);
        },
        onDelete: (nodeId: string) => {
          if (window.confirm('Are you sure you want to delete this node?')) {
            deleteNode(nodeId);
          }
        },
      },
    }));
  }, [nodes, deleteNode, selectNode]);

  if (!currentWorkflow) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Workflow Selected
          </h3>
          <p className="text-gray-500">
            Select or create a workflow to start building
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {currentWorkflow.name}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {currentWorkflow.description || 'No description'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            Version {currentWorkflow.version}
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            <Save className="w-4 h-4" />
            Save Workflow
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        <WorkflowToolbar />

        <div className="flex-1 relative">
          <ReactFlow
            nodes={enhancedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{
              animated: true,
              style: { stroke: '#3b82f6', strokeWidth: 2 },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'start':
                    return '#10b981';
                  case 'question':
                    return '#3b82f6';
                  case 'decision':
                    return '#a855f7';
                  case 'condition':
                    return '#f97316';
                  case 'end':
                    return '#ef4444';
                  default:
                    return '#6b7280';
                }
              }}
              maskColor="rgb(240, 240, 240, 0.6)"
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};
