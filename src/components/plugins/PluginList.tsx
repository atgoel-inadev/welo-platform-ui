import { Globe, Code, Zap, Trash2, Pencil, Rocket, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { Plugin, PluginFailBehavior } from '../../services/pluginService';
import { PluginStatusBadge } from './PluginStatusBadge';
import { Button } from '../common';

interface Props {
  plugins: Plugin[];
  onEdit: (plugin: Plugin) => void;
  onDelete: (pluginId: string) => void;
  onDeploy: (pluginId: string) => void;
  onToggle: (pluginId: string, enabled: boolean) => void;
  onNew: () => void;
}

const FAIL_BEHAVIOR_LABELS: Record<PluginFailBehavior, { label: string; color: string }> = {
  HARD_BLOCK: { label: 'Hard Block', color: 'bg-red-100 text-red-700' },
  SOFT_WARN: { label: 'Soft Override', color: 'bg-orange-100 text-orange-700' },
  ADVISORY: { label: 'Advisory', color: 'bg-blue-100 text-blue-700' },
};

export const PluginList = ({ plugins, onEdit, onDelete, onDeploy, onToggle, onNew }: Props) => {
  if (plugins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-xl">
        <Zap size={48} className="text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No plugins configured</h3>
        <p className="text-sm text-gray-400 mb-6 max-w-sm">
          Add a plugin to validate annotator answers via an API call or custom JavaScript before they submit.
        </p>
        <Button onClick={onNew} variant="primary" icon={Zap}>
          Create First Plugin
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plugins.map((plugin) => {
        const failBehavior = FAIL_BEHAVIOR_LABELS[plugin.onFailBehavior] ?? FAIL_BEHAVIOR_LABELS.ADVISORY;
        const boundCount = plugin.questionBindings.length;

        return (
          <div
            key={plugin.id}
            className={`bg-white border rounded-xl p-5 shadow-sm transition-shadow hover:shadow-md ${plugin.enabled && !plugin.isDraft ? 'border-green-200' : 'border-gray-200'}`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left: Icon + Name + Meta */}
              <div className="flex items-start gap-3 min-w-0">
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${plugin.type === 'API' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                  {plugin.type === 'API' ? (
                    <Globe size={20} className="text-blue-600" />
                  ) : (
                    <Code size={20} className="text-purple-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 truncate">{plugin.name}</h3>
                    <PluginStatusBadge plugin={plugin} />
                    <span className="text-xs text-gray-400 font-mono">v{plugin.version}</span>
                  </div>
                  {plugin.description && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{plugin.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {plugin.type === 'API' ? 'API Call' : 'JavaScript'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${failBehavior.color}`}>
                      {failBehavior.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {boundCount === 0 ? 'All questions' : `${boundCount} question${boundCount !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Enable / disable toggle */}
                <button
                  onClick={() => onToggle(plugin.id, !plugin.enabled)}
                  disabled={plugin.isDraft && !plugin.enabled}
                  title={plugin.isDraft && !plugin.enabled ? 'Deploy the plugin first to enable it' : plugin.enabled ? 'Disable' : 'Enable'}
                  className={`text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {plugin.enabled ? (
                    <ToggleRight size={22} className="text-green-600" />
                  ) : (
                    <ToggleLeft size={22} />
                  )}
                </button>

                {/* Deploy (only when draft) */}
                {plugin.isDraft && (
                  <button
                    onClick={() => onDeploy(plugin.id)}
                    title="Deploy plugin"
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    <Rocket size={18} />
                  </button>
                )}

                <button
                  onClick={() => onEdit(plugin)}
                  title="Edit"
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Pencil size={16} />
                </button>

                <button
                  onClick={() => onDelete(plugin.id)}
                  title="Delete"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Unsaved / draft warning */}
            {plugin.isDraft && plugin.enabled === false && (
              <div className="mt-3 flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                <AlertTriangle size={12} />
                Draft — click <strong className="mx-0.5">Deploy</strong> to make this plugin active for annotators.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
