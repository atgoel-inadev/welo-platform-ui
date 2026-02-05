import { create } from 'zustand';
import { Node, Edge, Connection, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import { immer } from 'zustand/middleware/immer';
import { Workflow } from '../types/workflow';
import workflowService from '../services/workflowService';

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  isLoading: boolean;
  error: string | null;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (type: string, position: { x: number; y: number }) => void;
  deleteNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: any) => void;
  selectNode: (node: Node | null) => void;

  loadWorkflows: (projectId?: string) => Promise<void>;
  loadWorkflow: (workflowId: string) => Promise<void>;
  createWorkflow: (workflow: Partial<Workflow>) => Promise<Workflow | null>;
  updateWorkflow: (workflowId: string, updates: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (workflowId: string) => Promise<void>;
  saveWorkflowData: () => Promise<void>;

  clearWorkflow: () => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  immer((set, get) => ({
    workflows: [],
    currentWorkflow: null,
    nodes: [],
    edges: [],
    selectedNode: null,
    isLoading: false,
    error: null,

    setNodes: (nodes) => set({ nodes }),

    setEdges: (edges) => set({ edges }),

    onNodesChange: (changes) => {
      set((state) => {
        state.nodes = applyNodeChanges(changes, state.nodes);
      });
    },

    onEdgesChange: (changes) => {
      set((state) => {
        state.edges = applyEdgeChanges(changes, state.edges);
      });
    },

    onConnect: (connection) => {
      set((state) => {
        state.edges = addEdge(connection, state.edges);
      });
    },

    addNode: (type, position) => {
      const id = `${type}-${Date.now()}`;
      const newNode: Node = {
        id,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          questions: type === 'question' ? [] : undefined,
        },
      };

      set((state) => {
        state.nodes.push(newNode);
      });
    },

    deleteNode: (nodeId) => {
      set((state) => {
        state.nodes = state.nodes.filter((node) => node.id !== nodeId);
        state.edges = state.edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        );
        if (state.selectedNode?.id === nodeId) {
          state.selectedNode = null;
        }
      });
    },

    updateNode: (nodeId, data) => {
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          node.data = { ...node.data, ...data };
        }
      });
    },

    selectNode: (node) => set({ selectedNode: node }),

    loadWorkflows: async (projectId) => {
      set({ isLoading: true, error: null });

      try {
        const workflows = await workflowService.fetchWorkflows(
          projectId ? { projectId } : undefined
        );

        set({ workflows, isLoading: false });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    loadWorkflow: async (workflowId) => {
      set({ isLoading: true, error: null });

      try {
        const workflow = await workflowService.fetchWorkflowById(workflowId);

        set({
          currentWorkflow: workflow,
          nodes: workflow.flow_data.nodes || [],
          edges: workflow.flow_data.edges || [],
          isLoading: false,
        });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    createWorkflow: async (workflow) => {
      set({ isLoading: true, error: null });

      try {
        const newWorkflow = await workflowService.createWorkflow({
          name: workflow.name || 'Untitled Workflow',
          description: workflow.description,
          projectId: workflow.project_id,
          xstateDefinition: { nodes: [], edges: [] },
          metadata: workflow,
        });

        set((state) => {
          state.workflows.unshift(newWorkflow);
          state.currentWorkflow = newWorkflow;
          state.isLoading = false;
        });

        return newWorkflow;
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
        return null;
      }
    },

    updateWorkflow: async (workflowId, updates) => {
      set({ isLoading: true, error: null });

      try {
        const updatedWorkflow = await workflowService.updateWorkflow(workflowId, updates);

        set((state) => {
          const index = state.workflows.findIndex((w) => w.id === workflowId);
          if (index !== -1) {
            state.workflows[index] = updatedWorkflow;
          }
          if (state.currentWorkflow?.id === workflowId) {
            state.currentWorkflow = updatedWorkflow;
          }
          state.isLoading = false;
        });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    deleteWorkflow: async (workflowId) => {
      set({ isLoading: true, error: null });

      try {
        await workflowService.deleteWorkflow(workflowId);

        set((state) => {
          state.workflows = state.workflows.filter((w) => w.id !== workflowId);
          if (state.currentWorkflow?.id === workflowId) {
            state.currentWorkflow = null;
            state.nodes = [];
            state.edges = [];
          }
          state.isLoading = false;
        });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    saveWorkflowData: async () => {
      const { currentWorkflow, nodes, edges } = get();

      if (!currentWorkflow) {
        set({ error: 'No workflow selected' });
        return;
      }

      set({ isLoading: true, error: null });

      try {
        const updatedWorkflow = await workflowService.updateWorkflow(currentWorkflow.id, {
          xstateDefinition: { nodes, edges },
        });

        set((state) => {
          if (state.currentWorkflow) {
            state.currentWorkflow = updatedWorkflow;
            state.currentWorkflow.flow_data = { nodes, edges };
            state.currentWorkflow.version = (state.currentWorkflow.version || 0) + 1;
          }
          state.isLoading = false;
        });
      } catch (error) {
        set({ error: (error as Error).message, isLoading: false });
      }
    },

    clearWorkflow: () => {
      set({
        currentWorkflow: null,
        nodes: [],
        edges: [],
        selectedNode: null,
      });
    },
  }))
);
