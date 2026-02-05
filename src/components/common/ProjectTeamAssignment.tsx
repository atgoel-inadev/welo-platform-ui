import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { userService, ProjectTeamMember, AssignUserToProjectDto } from '../../services/userService';
import { User, UserRole } from '../../services/authService';

interface ProjectTeamAssignmentProps {
  projectId: string;
  onTeamUpdated?: () => void;
}

export const ProjectTeamAssignment: React.FC<ProjectTeamAssignmentProps> = ({
  projectId,
  onTeamUpdated,
}) => {
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [availableAnnotators, setAvailableAnnotators] = useState<User[]>([]);
  const [availableReviewers, setAvailableReviewers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Assignment form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ANNOTATOR);
  const [quota, setQuota] = useState(10);

  useEffect(() => {
    loadTeamMembers();
    loadAvailableUsers();
  }, [projectId]);

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      const members = await userService.getProjectTeam(projectId);
      setTeamMembers(members);
    } catch (err: any) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const [annotators, reviewers] = await Promise.all([
        userService.getAvailableAnnotators(),
        userService.getAvailableReviewers(),
      ]);
      setAvailableAnnotators(annotators);
      setAvailableReviewers(reviewers);
    } catch (err: any) {
      console.error('Failed to load available users:', err);
    }
  };

  const handleAssignUser = async () => {
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const dto: AssignUserToProjectDto = {
        userId: selectedUserId,
        projectId,
        role: selectedRole,
        quota,
      };

      await userService.assignUserToProject(dto);
      setSuccess('User assigned to project successfully!');
      setShowAssignForm(false);
      resetForm();
      loadTeamMembers();
      
      if (onTeamUpdated) {
        onTeamUpdated();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to assign user to project');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the project team?')) {
      return;
    }

    try {
      await userService.removeUserFromProject(projectId, userId);
      setSuccess('User removed from project!');
      loadTeamMembers();
      
      if (onTeamUpdated) {
        onTeamUpdated();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove user from project');
    }
  };

  const handleUpdateQuota = async (userId: string, newQuota: number) => {
    try {
      await userService.updateTeamMemberQuota(projectId, userId, newQuota);
      setSuccess('Quota updated successfully!');
      loadTeamMembers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update quota');
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setSelectedRole(UserRole.ANNOTATOR);
    setQuota(10);
  };

  const getAvailableUsers = (): User[] => {
    if (selectedRole === UserRole.ANNOTATOR) {
      return availableAnnotators.filter(
        u => !teamMembers.some(tm => tm.userId === u.id && tm.role === UserRole.ANNOTATOR)
      );
    } else {
      return availableReviewers.filter(
        u => !teamMembers.some(tm => tm.userId === u.id && tm.role === UserRole.REVIEWER)
      );
    }
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.ANNOTATOR:
        return 'bg-green-100 text-green-800';
      case UserRole.REVIEWER:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Team</h2>
          <p className="text-gray-600">Assign annotators and reviewers to this project</p>
        </div>
        <button
          onClick={() => setShowAssignForm(!showAssignForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Assign User
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Assignment Form */}
      {showAssignForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Assign User to Project</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value as UserRole);
                  setSelectedUserId('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={UserRole.ANNOTATOR}>Annotator</option>
                <option value={UserRole.REVIEWER}>Reviewer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User *
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a user...</option>
                {getAvailableUsers().map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tasks Quota
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={quota}
                onChange={(e) => setQuota(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => {
                setShowAssignForm(false);
                resetForm();
                setError('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignUser}
              disabled={!selectedUserId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Assign to Project
            </button>
          </div>
        </div>
      )}

      {/* Team Members List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading team members...</p>
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Team Members Yet</h3>
          <p className="text-gray-600 mb-6">
            Assign annotators and reviewers to start working on this project.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                        {member.user?.name.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {member.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.user?.email || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="number"
                      min="1"
                      value={member.quota || 10}
                      onChange={(e) => handleUpdateQuota(member.userId, parseInt(e.target.value) || 10)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.assignedTasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.completedTasks}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleRemoveUser(member.userId)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors"
                      title="Remove from project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!loading && teamMembers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Team Summary</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {teamMembers.filter(m => m.role === UserRole.ANNOTATOR).length}
              </p>
              <p className="text-sm text-gray-600">Annotators</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {teamMembers.filter(m => m.role === UserRole.REVIEWER).length}
              </p>
              <p className="text-sm text-gray-600">Reviewers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {teamMembers.reduce((sum, m) => sum + m.assignedTasks, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Assigned</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
