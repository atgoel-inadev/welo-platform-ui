import { FileType } from '../types/renderer';

export const getFileType = (filename: string, mimeType?: string): FileType => {
  const extension = filename.split('.').pop()?.toLowerCase();

  if (mimeType?.startsWith('image/')) {
    return FileType.IMAGE;
  }

  if (mimeType?.startsWith('audio/')) {
    return FileType.AUDIO;
  }

  if (mimeType?.startsWith('video/')) {
    return FileType.VIDEO;
  }

  switch (extension) {
    case 'txt':
    case 'md':
    case 'json':
      return FileType.TEXT;

    case 'csv':
      return FileType.CSV;

    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'svg':
      return FileType.IMAGE;

    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
    case 'm4a':
      return FileType.AUDIO;

    case 'mp4':
    case 'webm':
    case 'mov':
    case 'avi':
    case 'mkv':
      return FileType.VIDEO;

    default:
      return FileType.UNKNOWN;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};
