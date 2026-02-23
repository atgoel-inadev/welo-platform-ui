import { Plugin } from '../../services/pluginService';

interface Props {
  plugin: Plugin;
}

export const PluginStatusBadge = ({ plugin }: Props) => {
  if (!plugin.enabled) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Disabled
      </span>
    );
  }
  if (plugin.isDraft) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Active
    </span>
  );
};
