import { Graphics, Text as PixiText, TextStyle } from 'pixi.js';
import { BaseRenderer } from './BaseRenderer';
import { FileMetadata, RendererConfig } from '../types/renderer';

export class TextRenderer extends BaseRenderer {
  private textContainer: HTMLDivElement;
  private textContent: string;
  private lineHeight: number;
  private fontSize: number;

  constructor(container: HTMLElement, config: RendererConfig) {
    super(container, config);
    this.textContent = '';
    this.lineHeight = 24;
    this.fontSize = 14;

    this.textContainer = document.createElement('div');
    this.textContainer.style.position = 'absolute';
    this.textContainer.style.top = '0';
    this.textContainer.style.left = '0';
    this.textContainer.style.width = `${config.containerWidth}px`;
    this.textContainer.style.height = `${config.containerHeight}px`;
    this.textContainer.style.overflow = 'auto';
    this.textContainer.style.fontFamily = 'monospace';
    this.textContainer.style.fontSize = `${this.fontSize}px`;
    this.textContainer.style.lineHeight = `${this.lineHeight}px`;
    this.textContainer.style.padding = '16px';
    this.textContainer.style.backgroundColor = '#ffffff';
    this.textContainer.style.color = '#1f2937';
    this.textContainer.style.whiteSpace = 'pre-wrap';
    this.textContainer.style.wordWrap = 'break-word';

    container.appendChild(this.textContainer);
  }

  async load(file: FileMetadata): Promise<void> {
    await this.waitForAppReady();
    this.currentFile = file;

    try {
      const response = await fetch(file.url);
      this.textContent = await response.text();
      this.render();
    } catch (error) {
      console.error('Failed to load text file:', error);
      this.textContent = 'Error loading file';
      this.render();
    }
  }

  render(): void {
    if (this.currentFile?.name.endsWith('.json')) {
      try {
        const formatted = JSON.stringify(JSON.parse(this.textContent), null, 2);
        this.textContainer.textContent = formatted;
      } catch {
        this.textContainer.textContent = this.textContent;
      }
    } else {
      this.textContainer.textContent = this.textContent;
    }

    this.app.stage.removeChildren();
    this.renderAnnotations();
  }

  protected renderAnnotations(): void {
    this.app.stage.removeChildren();

    this.annotations.forEach((annotation) => {
      if (annotation.position.x !== undefined && annotation.position.y !== undefined) {
        const graphics = new Graphics();

        if (annotation.type === 'point') {
          graphics.circle(annotation.position.x, annotation.position.y, 5);
          graphics.fill(0xff0000);
        } else if (annotation.type === 'rectangle' && annotation.position.width && annotation.position.height) {
          graphics.rect(
            annotation.position.x,
            annotation.position.y,
            annotation.position.width,
            annotation.position.height
          );
          graphics.stroke({ color: 0xff0000, width: 2 });
        }

        this.app.stage.addChild(graphics);

        const label = new PixiText({
          text: annotation.label,
          style: new TextStyle({
            fontSize: 12,
            fill: 0xff0000,
            fontFamily: 'Arial',
          }),
        });
        label.x = annotation.position.x + 10;
        label.y = annotation.position.y - 20;
        this.app.stage.addChild(label);
      }
    });
  }

  resize(width: number, height: number): void {
    super.resize(width, height);
    this.textContainer.style.width = `${width}px`;
    this.textContainer.style.height = `${height}px`;
  }

  destroy(): void {
    if (this.container.contains(this.textContainer)) {
      this.container.removeChild(this.textContainer);
    }
    super.destroy();
  }
}
