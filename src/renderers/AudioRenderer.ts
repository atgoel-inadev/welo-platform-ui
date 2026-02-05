import { Graphics, Text as PixiText, TextStyle } from 'pixi.js';
import { BaseRenderer } from './BaseRenderer';
import { FileMetadata, RendererConfig, PlaybackState } from '../types/renderer';
import { formatDuration } from '../utils/fileUtils';

export class AudioRenderer extends BaseRenderer {
  private audioElement: HTMLAudioElement;
  private controlsContainer: HTMLDivElement;
  private playbackState: PlaybackState;
  private waveformData: number[];
  private animationFrameId: number | null;

  constructor(container: HTMLElement, config: RendererConfig) {
    super(container, config);

    this.audioElement = new Audio();
    this.audioElement.addEventListener('loadedmetadata', this.handleLoadedMetadata.bind(this));
    this.audioElement.addEventListener('timeupdate', this.handleTimeUpdate.bind(this));
    this.audioElement.addEventListener('ended', this.handleEnded.bind(this));

    this.playbackState = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
    };

    this.waveformData = [];
    this.animationFrameId = null;

    this.controlsContainer = document.createElement('div');
    this.controlsContainer.style.position = 'absolute';
    this.controlsContainer.style.bottom = '0';
    this.controlsContainer.style.left = '0';
    this.controlsContainer.style.width = '100%';
    this.controlsContainer.style.height = '120px';
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
    timeDisplay.id = 'audio-time-display';
    timeDisplay.style.color = '#e5e7eb';
    timeDisplay.style.fontSize = '14px';
    timeDisplay.style.fontFamily = 'monospace';
    timeDisplay.textContent = '0:00 / 0:00';
    buttonRow.appendChild(timeDisplay);

    this.controlsContainer.appendChild(buttonRow);

    const progressBar = document.createElement('input');
    progressBar.type = 'range';
    progressBar.id = 'audio-progress';
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
    volumeSlider.id = 'audio-volume';
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
      this.audioElement.pause();
      this.playbackState.isPlaying = false;
      const playButton = this.controlsContainer.querySelector('button');
      if (playButton) playButton.textContent = '▶';
    } else {
      this.audioElement.play();
      this.playbackState.isPlaying = true;
      const playButton = this.controlsContainer.querySelector('button');
      if (playButton) playButton.textContent = '⏸';
    }
  }

  private handleSeek(value: string): void {
    const seekTime = (parseFloat(value) / 100) * this.playbackState.duration;
    this.audioElement.currentTime = seekTime;
  }

  private handleVolumeChange(value: string): void {
    const volume = parseFloat(value) / 100;
    this.audioElement.volume = volume;
    this.playbackState.volume = volume;
  }

  private handleLoadedMetadata(): void {
    this.playbackState.duration = this.audioElement.duration;
    this.updateTimeDisplay();
    this.generateWaveform();
  }

  private handleTimeUpdate(): void {
    this.playbackState.currentTime = this.audioElement.currentTime;
    this.updateTimeDisplay();
    this.updateProgressBar();
    this.render();
  }

  private handleEnded(): void {
    this.playbackState.isPlaying = false;
    const playButton = this.controlsContainer.querySelector('button');
    if (playButton) playButton.textContent = '▶';
  }

  private updateTimeDisplay(): void {
    const timeDisplay = this.controlsContainer.querySelector('#audio-time-display');
    if (timeDisplay) {
      timeDisplay.textContent = `${formatDuration(this.playbackState.currentTime)} / ${formatDuration(
        this.playbackState.duration
      )}`;
    }
  }

  private updateProgressBar(): void {
    const progressBar = this.controlsContainer.querySelector('#audio-progress') as HTMLInputElement;
    if (progressBar && this.playbackState.duration > 0) {
      const percentage = (this.playbackState.currentTime / this.playbackState.duration) * 100;
      progressBar.value = percentage.toString();
    }
  }

  private generateWaveform(): void {
    const sampleCount = 100;
    this.waveformData = Array.from({ length: sampleCount }, () => Math.random() * 0.5 + 0.25);
    this.render();
  }

  async load(file: FileMetadata): Promise<void> {
    await this.waitForAppReady();
    this.currentFile = file;

    this.audioElement.src = file.url;
    this.audioElement.load();
  }

  render(): void {
    this.app.stage.removeChildren();

    const waveformHeight = this.config.containerHeight - 140;
    const waveformWidth = this.config.containerWidth - 32;
    const barWidth = waveformWidth / this.waveformData.length;

    const graphics = new Graphics();

    this.waveformData.forEach((amplitude, index) => {
      const x = 16 + index * barWidth;
      const barHeight = amplitude * waveformHeight;
      const y = (waveformHeight - barHeight) / 2 + 16;

      const progress = this.playbackState.duration > 0 ? this.playbackState.currentTime / this.playbackState.duration : 0;
      const color = index / this.waveformData.length < progress ? 0x3b82f6 : 0x6b7280;

      graphics.rect(x, y, barWidth - 2, barHeight);
      graphics.fill(color);
    });

    this.app.stage.addChild(graphics);

    this.annotations.forEach((annotation) => {
      if (annotation.position.timestamp !== undefined) {
        const progress = annotation.position.timestamp / this.playbackState.duration;
        const x = 16 + progress * waveformWidth;

        const marker = new Graphics();
        marker.moveTo(x, 16);
        marker.lineTo(x, waveformHeight + 16);
        marker.stroke({ color: 0xff0000, width: 2 });
        this.app.stage.addChild(marker);

        const label = new PixiText({
          text: annotation.label,
          style: new TextStyle({
            fontSize: 12,
            fill: 0xff0000,
            fontFamily: 'Arial',
          }),
        });
        label.x = x + 5;
        label.y = 20;
        this.app.stage.addChild(label);
      }
    });
  }

  destroy(): void {
    this.audioElement.pause();
    this.audioElement.src = '';
    if (this.container.contains(this.controlsContainer)) {
      this.container.removeChild(this.controlsContainer);
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    super.destroy();
  }
}
