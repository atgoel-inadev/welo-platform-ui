import { FileType } from './index';

export interface FileMetadata {
  id: string;
  name: string;
  type: FileType;
  url: string;
  size: number;
  mimeType: string;
}

export interface Annotation {
  id: string;
  fileId: string;
  type: 'point' | 'rectangle' | 'polygon' | 'text' | 'timestamp';
  position: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    points?: { x: number; y: number }[];
    timestamp?: number;
  };
  label: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface RendererConfig {
  containerWidth: number;
  containerHeight: number;
  backgroundColor?: number;
  interactive?: boolean;
  showControls?: boolean;
}

export interface BaseRenderer {
  load(file: FileMetadata): Promise<void>;
  render(): void;
  destroy(): void;
  addAnnotation(annotation: Annotation): void;
  removeAnnotation(annotationId: string): void;
  getAnnotations(): Annotation[];
  resize(width: number, height: number): void;
}

export interface ZoomPanState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}
