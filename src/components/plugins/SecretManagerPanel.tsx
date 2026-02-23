import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Eye, EyeOff, AlertCircle, Copy, Check } from 'lucide-react';
import { pluginService, SecretListItem } from '../../services/pluginService';
import { Button } from '../common';

interface Props {
  projectId: string;
}

export const SecretManagerPanel = ({ projectId }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [secrets, setSecrets] = useState<SecretListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showValue, setShowValue] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState({ name: '', value: '', description: '' });
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (expanded) loadSecrets();
  }, [expanded, projectId]);

  const loadSecrets = async () => {
    setLoading(true);
    try {
      setSecrets(await pluginService.listSecrets(projectId));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setAddError('');
    if (!newSecret.name || !newSecret.value) {
      setAddError('Name and value are required');
      return;
    }
    setSaving(true);
    try {
      await pluginService.createSecret(projectId, {
        name: newSecret.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
        value: newSecret.value,
        description: newSecret.description || undefined,
      });
      setNewSecret({ name: '', value: '', description: '' });
      setShowAddForm(false);
      await loadSecrets();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create secret');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await pluginService.deleteSecret(projectId, name);
      setConfirmDelete(null);
      await loadSecrets();
    } catch (err) {
      console.error(err);
    }
  };

  const copyName = (name: string) => {
    navigator.clipboard.writeText(`{{secrets.${name}}}`);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-gray-900">Secret Manager</span>
          <span className="text-xs text-gray-500 font-normal">({secrets.length} secrets)</span>
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Warning banner */}
          <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              Secret values are encrypted server-side and can never be retrieved after saving.
              Copy the token shown below to reference a secret in your plugin configuration.
            </span>
          </div>

          {/* Secrets table */}
          {loading ? (
            <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
          ) : secrets.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">No secrets yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Token</th>
                    <th className="pb-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {secrets.map((s) => (
                    <tr key={s.id} className="text-gray-700">
                      <td className="py-2 font-mono font-medium text-xs">{s.name}</td>
                      <td className="py-2 text-gray-500 text-xs">{s.description || '—'}</td>
                      <td className="py-2">
                        <button
                          onClick={() => copyName(s.name)}
                          className="flex items-center gap-1 font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
                          title="Copy token"
                        >
                          {`{{secrets.${s.name}}}`}
                          {copied === s.name ? <Check size={10} /> : <Copy size={10} />}
                        </button>
                      </td>
                      <td className="py-2">
                        {confirmDelete === s.name ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(s.name)}
                              className="text-xs text-red-600 font-medium hover:underline"
                            >
                              Confirm
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(s.name)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add secret form */}
          {showAddForm ? (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
              <h4 className="text-sm font-semibold text-gray-800">Add New Secret</h4>
              {addError && (
                <p className="text-xs text-red-600">{addError}</p>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Name <span className="text-gray-400">(uppercase, e.g. OPENAI_API_KEY)</span>
                </label>
                <input
                  type="text"
                  value={newSecret.name}
                  onChange={(e) => setNewSecret({ ...newSecret, name: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
                  placeholder="MY_API_KEY"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Value <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal"> — shown once, never retrievable</span>
                </label>
                <div className="relative">
                  <input
                    type={showValue ? 'text' : 'password'}
                    value={newSecret.value}
                    onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                    placeholder="sk-..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowValue(!showValue)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showValue ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newSecret.description}
                  onChange={(e) => setNewSecret({ ...newSecret, description: e.target.value })}
                  placeholder="Brief description of what this key is for"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button onClick={handleAdd} variant="primary" disabled={saving} size="sm">
                  {saving ? 'Saving...' : 'Save Secret'}
                </Button>
                <Button onClick={() => { setShowAddForm(false); setNewSecret({ name: '', value: '', description: '' }); setAddError(''); }} variant="ghost" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus size={16} />
              Add Secret
            </button>
          )}
        </div>
      )}
    </div>
  );
};
