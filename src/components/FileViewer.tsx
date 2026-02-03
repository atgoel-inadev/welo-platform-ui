import { useEffect, useRef, useState } from 'react';
import { FileMetadata, Annotation, RendererConfig, BaseRenderer } from '../types/renderer';
import { FileType } from '../types';
import { getFileType, formatFileSize } from '../utils/fileUtils';
import { TextRenderer } from '../renderers/TextRenderer';
import { CSVRenderer } from '../renderers/CSVRenderer';
import { ImageRenderer } from '../renderers/ImageRenderer';
import { AudioRenderer } from '../renderers/AudioRenderer';
import { VideoRenderer } from '../renderers/VideoRenderer';
import { FileText, Image, Music, Video, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface FileViewerProps {
  file: FileMetadata;
  annotations?: Annotation[];
  onAnnotationAdd?: (annotation: Annotation) => void;
  onAnnotationRemove?: (annotationId: string) => void;
  width?: number;
  height?: number;
}

export const FileViewer = ({
  file,
  annotations = [],
  onAnnotationAdd,
  onAnnotationRemove,
  width = 800,
  height = 600,
}: FileViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<BaseRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<FileType>(FileType.TEXT);

  useEffect(() => {
    const detectedFileType = getFileType(file.name, file.mimeType);
    setFileType(detectedFileType);
  }, [file]);

  useEffect(() => {
    if (!containerRef.current) return;

    const initRenderer = async () => {
      setIsLoading(true);
      setError(null);

      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }

      const config: RendererConfig = {
        containerWidth: width,
        containerHeight: height - 60,
        backgroundColor: 0xffffff,
        interactive: true,
        showControls: true,
      };

      try {
        let renderer: BaseRenderer | null = null;

        switch (fileType) {
          case FileType.TEXT:
          case FileType.MARKDOWN:
          case FileType.JSON:
            renderer = new TextRenderer(containerRef.current, config);
            break;
          case FileType.CSV:
            renderer = new CSVRenderer(containerRef.current, config);
            break;
          case FileType.IMAGE:
            renderer = new ImageRenderer(containerRef.current, config);
            break;
          case FileType.AUDIO:
            renderer = new AudioRenderer(containerRef.current, config);
            break;
          case FileType.VIDEO:
            renderer = new VideoRenderer(containerRef.current, config);
            break;
          default:
            throw new Error(`Unsupported file type: ${fileType}`);
        }

        if (renderer) {
          await renderer.load(file);
          rendererRef.current = renderer;

          annotations.forEach((annotation) => {
            renderer!.addAnnotation(annotation);
          });

          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize renderer:', err);
        setError(err instanceof Error ? err.message : 'Failed to load file');
        setIsLoading(false);
      }
    };

    initRenderer();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [file, fileType, width, height]);

  useEffect(() => {
    if (!rendererRef.current) return;

    const currentAnnotations = rendererRef.current.getAnnotations();
    const currentIds = new Set(currentAnnotations.map((a) => a.id));
    const newIds = new Set(annotations.map((a) => a.id));

    currentAnnotations.forEach((annotation) => {
      if (!newIds.has(annotation.id)) {
        rendererRef.current!.removeAnnotation(annotation.id);
      }
    });

    annotations.forEach((annotation) => {
      if (!currentIds.has(annotation.id)) {
        rendererRef.current!.addAnnotation(annotation);
      }
    });
  }, [annotations]);

  const getFileIcon = () => {
    switch (fileType) {
      case FileType.TEXT:
      case FileType.MARKDOWN:
      case FileType.JSON:
        return <FileText className="w-5 h-5" />;
      case FileType.CSV:
        return <FileSpreadsheet className="w-5 h-5" />;
      case FileType.IMAGE:
        return <Image className="w-5 h-5" />;
      case FileType.AUDIO:
        return <Music className="w-5 h-5" />;
      case FileType.VIDEO:
        return <Video className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col" style={{ width: `${width}px`, height: `${height}px` }}>
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-gray-600">{getFileIcon()}</div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">{file.name}</h3>
            <p className="text-xs text-gray-500">
              {fileType.toUpperCase()} • {formatFileSize(file.size)}
            </p>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 bg-white"
        style={{ width: `${width}px`, height: `${height - 60}px` }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 text-sm">Loading file...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div>
                <p className="text-gray-900 font-medium">Failed to load file</p>
                <p className="text-gray-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
