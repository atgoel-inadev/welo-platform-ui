import { useState } from 'react';
import { FileViewer } from '../../components/FileViewer';
import { FileMetadata, Annotation } from '../../types/renderer';
import { FileType } from '../../types';
import { Button } from '../../components/common';
import { Save, SkipForward, AlertCircle } from 'lucide-react';

export const AnnotationTask = () => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotationLabel, setCurrentAnnotationLabel] = useState('');

  const sampleFile: FileMetadata = {
    id: 'sample-1',
    name: 'sample-image.jpg',
    type: FileType.IMAGE,
    url: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
    size: 245678,
    mimeType: 'image/jpeg',
  };

  const handleAddAnnotation = () => {
    if (!currentAnnotationLabel.trim()) return;

    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      fileId: sampleFile.id,
      type: 'rectangle',
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        width: 150,
        height: 100,
      },
      label: currentAnnotationLabel,
      createdAt: new Date(),
      createdBy: 'current-user',
    };

    setAnnotations([...annotations, newAnnotation]);
    setCurrentAnnotationLabel('');
  };

  const handleRemoveAnnotation = (annotationId: string) => {
    setAnnotations(annotations.filter((a) => a.id !== annotationId));
  };

  const handleSubmit = () => {
    console.log('Submitting annotations:', annotations);
    alert(`Submitted ${annotations.length} annotations`);
  };

  const handleSkip = () => {
    console.log('Skipping task');
    alert('Task skipped');
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Annotation Task</h1>
          <p className="text-gray-600 mt-2">Review the file and add annotations as needed</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <FileViewer
                file={sampleFile}
                annotations={annotations}
                onAnnotationAdd={(annotation) => setAnnotations([...annotations, annotation])}
                onAnnotationRemove={handleRemoveAnnotation}
                width={800}
                height={600}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Annotations</h2>

                <div className="space-y-3 mb-6">
                  {annotations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No annotations yet</p>
                    </div>
                  ) : (
                    annotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{annotation.label}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {annotation.type} • {new Date(annotation.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAnnotation(annotation.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Add Annotation</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={currentAnnotationLabel}
                      onChange={(e) => setCurrentAnnotationLabel(e.target.value)}
                      placeholder="Enter label"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddAnnotation();
                        }
                      }}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleAddAnnotation}
                      disabled={!currentAnnotationLabel.trim()}
                      className="w-full"
                    >
                      Add Annotation
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-3">
                <Button
                  variant="primary"
                  icon={Save}
                  onClick={handleSubmit}
                  disabled={annotations.length === 0}
                  className="w-full"
                >
                  Submit Task
                </Button>
                <Button variant="ghost" icon={SkipForward} onClick={handleSkip} className="w-full">
                  Skip Task
                </Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Task Info</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Project:</dt>
                    <dd className="font-medium text-gray-900">Sample Project</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Batch:</dt>
                    <dd className="font-medium text-gray-900">Batch #1</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Task ID:</dt>
                    <dd className="font-medium text-gray-900">TASK-001</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Progress:</dt>
                    <dd className="font-medium text-gray-900">1 / 25</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
