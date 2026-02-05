import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ArrowLeft, Workflow as WorkflowIcon } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import { WorkflowBuilder } from '../../components/workflow/WorkflowBuilder';
import { WorkflowSidebar } from '../../components/workflow/WorkflowSidebar';
import { Button, Modal } from '../../components/common';
import { useAppSelector } from '../../hooks/useRedux';

export const WorkflowManagement = () => {
  const navigate = useNavigate();
  const { workflowId } = useParams();
  const { workflows, loadWorkflows, loadWorkflow, createWorkflow, clearWorkflow } =
    useWorkflowStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const projects = useAppSelector((state) => state.projects.projects);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    } else {
      clearWorkflow();
    }
  }, [workflowId, loadWorkflow, clearWorkflow]);

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    if (!selectedProjectId) {
      alert('Please select a project');
      return;
    }

    const workflow = await createWorkflow({
      name: newWorkflowName,
      description: newWorkflowDescription,
      project_id: selectedProjectId,
      status: 'draft',
    });

    if (workflow) {
      setShowCreateModal(false);
      setNewWorkflowName('');
      setNewWorkflowDescription('');
      setSelectedProjectId('');
      navigate(`/ops/workflows/${workflow.id}`);
    }
  };

  if (workflowId) {
    return (
      <div className="h-screen flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <button
            onClick={() => navigate('/ops/workflows')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Workflows
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <WorkflowBuilder />
          <WorkflowSidebar />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Workflow Management</h1>
            <p className="text-gray-600">
              Create and manage annotation workflows for your projects
            </p>
          </div>

          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </div>

        {workflows.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <WorkflowIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Workflows Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first workflow to define annotation processes and question sequences for
              your projects
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Workflow
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => navigate(`/ops/workflows/${workflow.id}`)}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {workflow.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {workflow.description || 'No description'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      workflow.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : workflow.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {workflow.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">
                      {workflow.flow_data.nodes?.length || 0}
                    </span>{' '}
                    nodes
                  </div>
                  <div>
                    <span className="font-medium">
                      {workflow.flow_data.edges?.length || 0}
                    </span>{' '}
                    connections
                  </div>
                  <div>v{workflow.version}</div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                  Last updated{' '}
                  {new Date(workflow.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          title="Create New Workflow"
          onClose={() => setShowCreateModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workflow Name *
              </label>
              <input
                type="text"
                value={newWorkflowName}
                onChange={(e) => setNewWorkflowName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Image Annotation Workflow"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newWorkflowDescription}
                onChange={(e) => setNewWorkflowDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe the purpose of this workflow..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project *
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkflow}>Create Workflow</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
