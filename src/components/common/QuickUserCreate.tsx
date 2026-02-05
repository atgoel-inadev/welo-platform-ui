import { useState } from 'react';
import { Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { userService, CreateUserDto } from '../../services/userService';
import { UserRole, UserStatus } from '../../services/authService';

interface QuickUserCreateProps {
  onUserCreated?: (userId: string, email: string) => void;
  defaultRole?: UserRole;
  inline?: boolean;
}

export const QuickUserCreate: React.FC<QuickUserCreateProps> = ({
  onUserCreated,
  defaultRole = UserRole.ANNOTATOR,
  inline = false,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    password: '',
    name: '',
    role: defaultRole,
    status: UserStatus.ACTIVE,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.email || !formData.password || !formData.name) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const user = await userService.createUser(formData);
      setSuccess('User created successfully!');
      
      if (onUserCreated) {
        onUserCreated(user.id, user.email);
      }

      // Reset form
      setFormData({
        email: '',
        password: '',
        name: '',
        role: defaultRole,
        status: UserStatus.ACTIVE,
      });

      setTimeout(() => {
        setSuccess('');
        if (inline) {
          setShowForm(false);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setError('');
    setSuccess('');
    setFormData({
      email: '',
      password: '',
      name: '',
      role: defaultRole,
      status: UserStatus.ACTIVE,
    });
  };

  if (inline && !showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        <Plus className="w-4 h-4 mr-1" />
        Quick Add User
      </button>
    );
  }

  if (!inline && !showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" />
        Quick Add User
      </button>
    );
  }

  return (
    <div className={`${inline ? '' : 'bg-white rounded-lg shadow-sm border border-gray-200 p-6'}`}>
      {!inline && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Quick Add User</h3>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
          <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Min. 6 characters"
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value={UserRole.ANNOTATOR}>Annotator</option>
            <option value={UserRole.REVIEWER}>Reviewer</option>
            <option value={UserRole.PROJECT_MANAGER}>Project Manager</option>
          </select>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
