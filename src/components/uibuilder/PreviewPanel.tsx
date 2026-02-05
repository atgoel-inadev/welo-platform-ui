/**
 * Preview Panel Component
 * Shows real-time preview of UI configuration
 */

import React from 'react';
import { UIConfiguration, PipelineMode } from '../../types/uiBuilder';
import { DynamicUIRenderer } from './DynamicUIRenderer';

interface PreviewPanelProps {
  configuration: UIConfiguration;
  pipelineMode: PipelineMode;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ configuration, pipelineMode }) => {
  // Mock data for preview
  const mockFileData = {
    TEXT: 'This is sample text content for preview.',
    MARKDOWN: '# Sample Markdown\n\nThis is **bold** and this is *italic*.',
    HTML: '<h1>Sample HTML</h1><p>This is a paragraph.</p>',
    IMAGE: 'https://via.placeholder.com/400x300',
    VIDEO: 'sample-video.mp4',
    AUDIO: 'sample-audio.mp3',
    CSV: 'Name,Age,City\nJohn,30,NYC\nJane,25,LA',
    PDF: 'sample.pdf',
  };

  const mockResponseData = {};

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
        <p className="text-sm text-gray-600 mt-1">
          Mode: <span className="font-medium">{pipelineMode}</span>
        </p>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <DynamicUIRenderer
            configuration={configuration}
            pipelineMode={pipelineMode}
            fileData={mockFileData[configuration.fileType] || 'No file data'}
            fileType={configuration.fileType}
            initialData={mockResponseData}
            onSubmit={(data) => console.log('Preview submit:', data)}
            readOnly={false}
          />
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> This is a live preview showing how the UI will appear to annotators/reviewers.
        </p>
      </div>
    </div>
  );
};
