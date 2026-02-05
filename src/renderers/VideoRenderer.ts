import { BaseRenderer } from './BaseRenderer';
import { FileMetadata, RendererConfig, PlaybackState } from '../types/renderer';
import { formatDuration } from '../utils/fileUtils';

export class VideoRenderer extends BaseRenderer {
  private videoElement: HTMLVideoElement;
  private videoContainer: HTMLDivElement;
  private controlsContainer: HTMLDivElement;
  private playbackState: PlaybackState;
  private canvasOverlay: HTMLCanvasElement;
  private overlayContext: CanvasRenderingContext2D | null;

  constructor(container: HTMLElement, config: RendererConfig) {
    super(container, config);

    this.videoContainer = document.createElement('div');
    this.videoContainer.style.position = 'absolute';
    this.videoContainer.style.top = '0';
    this.videoContainer.style.left = '0';
    this.videoContainer.style.width = `${config.containerWidth}px`;
    this.videoContainer.style.height = `${config.containerHeight - 100}px`;
    this.videoContainer.style.backgroundColor = '#000000';
    this.videoContainer.style.display = 'flex';
    this.videoContainer.style.alignItems = 'center';
    this.videoContainer.style.justifyContent = 'center';
    this.videoContainer.style.position = 'relative';

    this.videoElement = document.createElement('video');
    this.videoElement.style.maxWidth = '100%';
    this.videoElement.style.maxHeight = '100%';
    this.videoElement.style.display = 'block';
    this.videoElement.addEventListener('loadedmetadata', this.handleLoadedMetadata.bind(this));
    this.videoElement.addEventListener('timeupdate', this.handleTimeUpdate.bind(this));
    this.videoElement.addEventListener('ended', this.handleEnded.bind(this));

    this.canvasOverlay = document.createElement('canvas');
    this.canvasOverlay.style.position = 'absolute';
    this.canvasOverlay.style.top = '0';
    this.canvasOverlay.style.left = '0';
    this.canvasOverlay.style.pointerEvents = 'none';
    this.overlayContext = this.canvasOverlay.getContext('2d');

    this.videoContainer.appendChild(this.videoElement);
    this.videoContainer.appendChild(this.canvasOverlay);
    container.appendChild(this.videoContainer);

    this.playbackState = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
    };

    this.controlsContainer = document.createElement('div');
    this.controlsContainer.style.position = 'absolute';
    this.controlsContainer.style.bottom = '0';
    this.controlsContainer.style.left = '0';
    this.controlsContainer.style.width = '100%';
    this.controlsContainer.style.height = '100px';
    this.controlsContainer.style.backgroundColor = '#1f2937';
    this.controlsContainer.style.padding = '16px';
    this.controlsContainer.style.display = 'flex';
    this.controlsContainer.style.flexDirection = 'column';
    this.controlsContainer.style.gap = '12px';

    container.appendChild(this.controlsContainer);
    this.createControls();
  }

  private createControls(): void {
    const buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.gap = '8px';
    buttonRow.style.alignItems = 'center';

    const playButton = document.createElement('button');
    playButton.textContent = '▶';
    playButton.style.padding = '8px 16px';
    playButton.style.backgroundColor = '#3b82f6';
    playButton.style.color = 'white';
    playButton.style.border = 'none';
    playButton.style.borderRadius = '4px';
    playButton.style.cursor = 'pointer';
    playButton.style.fontSize = '16px';
    playButton.onclick = () => this.togglePlayback();
    buttonRow.appendChild(playButton);

    const timeDisplay = document.createElement('span');
    timeDisplay.id = 'video-time-display';
    timeDisplay.style.color = '#e5e7eb';
    timeDisplay.style.fontSize = '14px';
    timeDisplay.style.fontFamily = 'monospace';
    timeDisplay.textContent = '0:00 / 0:00';
    buttonRow.appendChild(timeDisplay);

    this.controlsContainer.appendChild(buttonRow);

    const progressBar = document.createElement('input');
    progressBar.type = 'range';
    progressBar.id = 'video-progress';
    progressBar.min = '0';
    progressBar.max = '100';
    progressBar.value = '0';
    progressBar.style.width = '100%';
    progressBar.style.cursor = 'pointer';
    progressBar.oninput = (e) => this.handleSeek((e.target as HTMLInputElement).value);
    this.controlsContainer.appendChild(progressBar);

    const volumeRow = document.createElement('div');
    volumeRow.style.display = 'flex';
    volumeRow.style.alignItems = 'center';
    volumeRow.style.gap = '8px';

    const volumeLabel = document.createElement('span');
    volumeLabel.textContent = '🔊';
    volumeLabel.style.fontSize = '16px';
    volumeRow.appendChild(volumeLabel);

    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.id = 'video-volume';
    volumeSlider.min = '0';
    volumeSlider.max = '100';
    volumeSlider.value = '100';
    volumeSlider.style.width = '150px';
    volumeSlider.style.cursor = 'pointer';
    volumeSlider.oninput = (e) => this.handleVolumeChange((e.target as HTMLInputElement).value);
    volumeRow.appendChild(volumeSlider);

    this.controlsContainer.appendChild(volumeRow);
  }

  private togglePlayback(): void {
    if (this.playbackState.isPlaying) {
      this.videoElement.pause();
      this.playbackState.isPlaying = false;
      const playButton = this.controlsContainer.querySelector('button');
      if (playButton) playButton.textContent = '▶';
    } else {
      this.videoElement.play();
      this.playbackState.isPlaying = true;
      const playButton = this.controlsContainer.querySelector('button');
      if (playButton) playButton.textContent = '⏸';
    }
  }

  private handleSeek(value: string): void {
    const seekTime = (parseFloat(value) / 100) * this.playbackState.duration;
    this.videoElement.currentTime = seekTime;
  }

  private handleVolumeChange(value: string): void {
    const volume = parseFloat(value) / 100;
    this.videoElement.volume = volume;
    this.playbackState.volume = volume;
  }

  private handleLoadedMetadata(): void {
    this.playbackState.duration = this.videoElement.duration;
    this.updateTimeDisplay();
    this.updateCanvasSize();
  }

  private handleTimeUpdate(): void {
    this.playbackState.currentTime = this.videoElement.currentTime;
    this.updateTimeDisplay();
    this.updateProgressBar();
    this.renderAnnotations();
  }

  private handleEnded(): void {
    this.playbackState.isPlaying = false;
    const playButton = this.controlsContainer.querySelector('button');
    if (playButton) playButton.textContent = '▶';
  }

  private updateTimeDisplay(): void {
    const timeDisplay = this.controlsContainer.querySelector('#video-time-display');
    if (timeDisplay) {
      timeDisplay.textContent = `${formatDuration(this.playbackState.currentTime)} / ${formatDuration(
        this.playbackState.duration
      )}`;
    }
  }

  private updateProgressBar(): void {
    const progressBar = this.controlsContainer.querySelector('#video-progress') as HTMLInputElement;
    if (progressBar && this.playbackState.duration > 0) {
      const percentage = (this.playbackState.currentTime / this.playbackState.duration) * 100;
      progressBar.value = percentage.toString();
    }
  }

  private updateCanvasSize(): void {
    const rect = this.videoElement.getBoundingClientRect();
    this.canvasOverlay.width = rect.width;
    this.canvasOverlay.height = rect.height;
    this.canvasOverlay.style.width = `${rect.width}px`;
    this.canvasOverlay.style.height = `${rect.height}px`;
    this.canvasOverlay.style.left = `${this.videoElement.offsetLeft}px`;
    this.canvasOverlay.style.top = `${this.videoElement.offsetTop}px`;
  }

  async load(file: FileMetadata): Promise<void> {
    await this.waitForAppReady();
    this.currentFile = file;

    this.videoElement.src = file.url;
    this.videoElement.load();
  }

  render(): void {
    this.renderAnnotations();
  }

  protected renderAnnotations(): void {
    if (!this.overlayContext) return;

    this.overlayContext.clearRect(0, 0, this.canvasOverlay.width, this.canvasOverlay.height);

    this.annotations.forEach((annotation) => {
      if (annotation.type === 'timestamp' && annotation.position.timestamp !== undefined) {
        const timeDiff = Math.abs(this.playbackState.currentTime - annotation.position.timestamp);
        if (timeDiff < 0.5) {
          this.overlayContext!.fillStyle = 'rgba(255, 0, 0, 0.7)';
          this.overlayContext!.font = '16px Arial';
          this.overlayContext!.fillText(annotation.label, 20, 40);
        }
      } else if (
        annotation.position.x !== undefined &&
        annotation.position.y !== undefined &&
        this.overlayContext
      ) {
        const scaleX = this.canvasOverlay.width / this.videoElement.videoWidth;
        const scaleY = this.canvasOverlay.height / this.videoElement.videoHeight;

        const x = annotation.position.x * scaleX;
        const y = annotation.position.y * scaleY;

        if (annotation.type === 'rectangle' && annotation.position.width && annotation.position.height) {
          const width = annotation.position.width * scaleX;
          const height = annotation.position.height * scaleY;

          this.overlayContext.strokeStyle = 'rgba(255, 0, 0, 0.8)';
          this.overlayContext.lineWidth = 2;
          this.overlayContext.strokeRect(x, y, width, height);

          this.overlayContext.fillStyle = 'rgba(255, 0, 0, 0.2)';
          this.overlayContext.fillRect(x, y, width, height);
        }

        this.overlayContext.fillStyle = 'rgba(255, 0, 0, 1)';
        this.overlayContext.font = 'bold 14px Arial';
        this.overlayContext.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        this.overlayContext.lineWidth = 3;
        this.overlayContext.strokeText(annotation.label, x, y - 10);
        this.overlayContext.fillText(annotation.label, x, y - 10);
      }
    });
  }

  resize(width: number, height: number): void {
    super.resize(width, height);
    this.videoContainer.style.width = `${width}px`;
    this.videoContainer.style.height = `${height - 100}px`;
    this.updateCanvasSize();
  }

  destroy(): void {
    this.videoElement.pause();
    this.videoElement.src = '';
    if (this.container.contains(this.videoContainer)) {
      this.container.removeChild(this.videoContainer);
    }
    if (this.container.contains(this.controlsContainer)) {
      this.container.removeChild(this.controlsContainer);
    }
    super.destroy();
  }
}
