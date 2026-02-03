# PixiJS Multi-File Rendering Engine

A comprehensive, modular rendering engine built with PixiJS for handling multiple file types in annotation workflows.

## Overview

The rendering engine supports viewing and annotating various file formats with specialized renderers for each type:

- **Text Files** (.txt, .md, .json)
- **CSV Files** with tabular display
- **Images** with zoom and pan capabilities
- **Audio Files** with playback controls and waveform visualization
- **Video Files** with standard media controls

## Architecture

### Core Components

#### 1. **BaseRenderer** (`src/renderers/BaseRenderer.ts`)

Abstract base class providing common functionality for all renderers:

- PixiJS application initialization
- Annotation management (add, remove, get)
- Resize handling
- Cleanup and destruction

```typescript
abstract class BaseRenderer implements IBaseRenderer {
  protected app: Application;
  protected container: HTMLElement;
  protected annotations: Map<string, Annotation>;
  protected config: RendererConfig;

  abstract load(file: FileMetadata): Promise<void>;
  abstract render(): void;

  addAnnotation(annotation: Annotation): void;
  removeAnnotation(annotationId: string): void;
  getAnnotations(): Annotation[];
  resize(width: number, height: number): void;
  destroy(): void;
}
```

#### 2. **Specialized Renderers**

##### TextRenderer (`src/renderers/TextRenderer.ts`)
- Displays text content with monospace font
- Auto-formats JSON files with syntax highlighting
- Overlays PixiJS annotations on top of text
- Supports point and rectangle annotations

##### CSVRenderer (`src/renderers/CSVRenderer.ts`)
- Parses CSV using PapaParse library
- Displays data in a styled HTML table
- Sticky header for easy navigation
- Zebra-striped rows for readability

##### ImageRenderer (`src/renderers/ImageRenderer.ts`)
- Full zoom and pan controls
- Mouse wheel zoom
- Click and drag to pan
- Fits image to viewport initially
- Supports point, rectangle, and polygon annotations
- Visual annotation overlays with labels

##### AudioRenderer (`src/renderers/AudioRenderer.ts`)
- HTML5 audio playback
- Custom visual waveform display
- Progress bar with seek capability
- Volume control slider
- Time display (current / duration)
- Timestamp-based annotations

##### VideoRenderer (`src/renderers/VideoRenderer.ts`)
- HTML5 video playback
- Custom playback controls
- Progress bar with seek capability
- Volume control
- Canvas overlay for annotations
- Spatial and temporal annotations support

#### 3. **FileViewer Component** (`src/components/FileViewer.tsx`)

Unified React component that:
- Auto-detects file type
- Instantiates appropriate renderer
- Manages renderer lifecycle
- Handles annotation state
- Provides loading and error states
- Shows file metadata

```typescript
interface FileViewerProps {
  file: FileMetadata;
  annotations?: Annotation[];
  onAnnotationAdd?: (annotation: Annotation) => void;
  onAnnotationRemove?: (annotationId: string) => void;
  width?: number;
  height?: number;
}
```

## Types

### FileType
```typescript
enum FileType {
  TEXT = 'text',
  CSV = 'csv',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  UNKNOWN = 'unknown',
}
```

### FileMetadata
```typescript
interface FileMetadata {
  id: string;
  name: string;
  type: FileType;
  url: string;
  size: number;
  mimeType: string;
}
```

### Annotation
```typescript
interface Annotation {
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
```

### RendererConfig
```typescript
interface RendererConfig {
  containerWidth: number;
  containerHeight: number;
  backgroundColor?: number;
  interactive?: boolean;
  showControls?: boolean;
}
```

## Usage

### Basic Example

```typescript
import { FileViewer } from './components/FileViewer';
import { FileMetadata, FileType, Annotation } from './types/renderer';

const MyComponent = () => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const file: FileMetadata = {
    id: 'file-1',
    name: 'example.jpg',
    type: FileType.IMAGE,
    url: 'https://example.com/image.jpg',
    size: 245678,
    mimeType: 'image/jpeg',
  };

  const handleAnnotationAdd = (annotation: Annotation) => {
    setAnnotations([...annotations, annotation]);
  };

  const handleAnnotationRemove = (annotationId: string) => {
    setAnnotations(annotations.filter(a => a.id !== annotationId));
  };

  return (
    <FileViewer
      file={file}
      annotations={annotations}
      onAnnotationAdd={handleAnnotationAdd}
      onAnnotationRemove={handleAnnotationRemove}
      width={800}
      height={600}
    />
  );
};
```

### Advanced Usage with Annotation Workflow

See `src/pages/annotator/AnnotationTask.tsx` for a complete example including:
- File viewing
- Annotation creation interface
- Annotation list management
- Task submission workflow

## Features

### Image Renderer Features
- **Zoom**: Mouse wheel to zoom in/out (10% - 1000%)
- **Pan**: Click and drag to move around
- **Fit to View**: Automatically scales image to fit viewport
- **Reset View**: Method to restore initial view state
- **Annotations**: Visual overlays with labels

### Audio Renderer Features
- **Playback Controls**: Play/pause button
- **Seek Bar**: Click to jump to any position
- **Volume Control**: Adjustable volume slider
- **Time Display**: Shows current time / total duration
- **Waveform Visualization**: Visual representation of audio
- **Timestamp Annotations**: Mark specific moments in audio

### Video Renderer Features
- **Playback Controls**: Play/pause functionality
- **Seek Bar**: Navigate through video timeline
- **Volume Control**: Adjustable audio volume
- **Time Display**: Current time / total duration
- **Annotation Overlay**: Canvas-based annotations over video
- **Spatial Annotations**: Rectangle annotations on video frames
- **Temporal Annotations**: Time-based annotation markers

### Text Renderer Features
- **Syntax Highlighting**: Auto-formats JSON files
- **Monospace Font**: Easy to read code and structured text
- **Scrollable**: Handles large text files
- **Line Wrapping**: Automatic word wrapping

### CSV Renderer Features
- **Tabular Display**: Clean table layout
- **Sticky Header**: Header stays visible while scrolling
- **Zebra Stripes**: Alternating row colors for readability
- **Responsive**: Adapts to container size

## File Type Detection

The `getFileType()` utility function automatically detects file types based on:
1. MIME type (if available)
2. File extension

```typescript
import { getFileType } from './utils/fileUtils';

const fileType = getFileType('document.pdf', 'application/pdf');
// Returns: FileType.PDF
```

## Utilities

### formatFileSize
```typescript
formatFileSize(1234567); // Returns: "1.18 MB"
```

### formatDuration
```typescript
formatDuration(125); // Returns: "2:05"
formatDuration(3665); // Returns: "1:01:05"
```

## Installation

The rendering engine requires these dependencies:

```bash
npm install pixi.js papaparse
npm install --save-dev @types/papaparse
```

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Navigate to the annotation task demo:
```
http://localhost:5173/annotate/task
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires support for:
- ES6+ JavaScript
- HTML5 Canvas
- HTML5 Audio/Video
- WebGL (for PixiJS)

## Performance Considerations

### Image Rendering
- Large images are automatically scaled to fit viewport
- Texture caching for improved performance
- Hardware acceleration via WebGL

### Audio/Video Rendering
- Native browser decoding
- Efficient canvas updates for overlays
- Throttled annotation rendering during playback

### Text/CSV Rendering
- DOM-based rendering for optimal text display
- Virtual scrolling for large datasets (future enhancement)

## Extending the Engine

### Creating a Custom Renderer

```typescript
import { BaseRenderer } from './BaseRenderer';
import { FileMetadata, RendererConfig } from '../types/renderer';

export class PDFRenderer extends BaseRenderer {
  constructor(container: HTMLElement, config: RendererConfig) {
    super(container, config);
  }

  async load(file: FileMetadata): Promise<void> {
    await this.waitForAppReady();
    this.currentFile = file;

    // Custom loading logic
  }

  render(): void {
    // Custom rendering logic
  }
}
```

### Registering the Renderer

Update `FileViewer.tsx` to support the new file type:

```typescript
case FileType.PDF:
  renderer = new PDFRenderer(containerRef.current, config);
  break;
```

## Testing

To test the rendering engine:

1. Login with annotator role
2. Navigate to `/annotate/task`
3. Use the demo interface to:
   - View the sample image
   - Add annotations
   - Remove annotations
   - Submit the task

## Known Limitations

- Text renderer does not support syntax highlighting beyond JSON
- CSV renderer loads entire file into memory
- Audio waveform is simulated (not actual audio analysis)
- Video annotations are frame-based, not persistent across seeking
- No support for 3D files or complex documents

## Future Enhancements

### Priority 1
- Real audio waveform analysis using Web Audio API
- PDF support with pdf.js
- 3D model viewer support

### Priority 2
- Virtual scrolling for large CSV files
- Advanced annotation shapes (polygon, bezier curves)
- Collaborative real-time annotations
- Annotation history and undo/redo

### Priority 3
- Annotation templates
- Keyboard shortcuts for common actions
- Export annotations in various formats
- Import existing annotations

## API Integration

The rendering engine integrates with the annotation API through:

1. **Loading Files**: Fetch file URLs from API
2. **Saving Annotations**: POST annotations to API endpoints
3. **Loading Annotations**: GET existing annotations for files
4. **Real-time Updates**: WebSocket support for collaborative annotations

See `src/pages/annotator/AnnotationTask.tsx` for integration examples.

## Troubleshooting

### PixiJS Canvas Not Rendering
- Ensure WebGL is supported in browser
- Check browser console for WebGL errors
- Verify container element exists before initialization

### Audio/Video Not Playing
- Check CORS headers on media files
- Verify browser supports media format
- Ensure HTTPS for secure contexts

### Annotations Not Appearing
- Verify annotation positions are within bounds
- Check annotation z-index and rendering order
- Ensure annotations array is passed correctly

### Performance Issues
- Reduce canvas resolution for lower-end devices
- Implement lazy loading for large file lists
- Use smaller images when possible
- Enable hardware acceleration in browser

## Contributing

When contributing new renderers or features:

1. Extend `BaseRenderer` for new file types
2. Implement all required abstract methods
3. Add comprehensive TypeScript types
4. Include usage examples
5. Update this documentation
6. Add unit tests for new functionality

## License

Part of the Welo Platform project.
