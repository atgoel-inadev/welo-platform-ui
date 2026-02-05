import { Sprite, Texture, Graphics, Text as PixiText, TextStyle, Container } from 'pixi.js';
import { BaseRenderer } from './BaseRenderer';
import { FileMetadata, RendererConfig, ZoomPanState } from '../types/renderer';

export class ImageRenderer extends BaseRenderer {
  private imageSprite: Sprite | null;
  private imageContainer: Container;
  private zoomPanState: ZoomPanState;
  private isDragging: boolean;
  private dragStart: { x: number; y: number };

  constructor(container: HTMLElement, config: RendererConfig) {
    super(container, config);
    this.imageSprite = null;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };

    this.zoomPanState = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    };

    this.imageContainer = new Container();
    this.app.stage.addChild(this.imageContainer);

    this.setupInteraction();
  }

  private setupInteraction(): void {
    this.app.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    this.app.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.app.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.app.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.app.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();

    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(10, this.zoomPanState.scale * delta));

    const rect = this.app.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const worldX = (mouseX - this.zoomPanState.offsetX) / this.zoomPanState.scale;
    const worldY = (mouseY - this.zoomPanState.offsetY) / this.zoomPanState.scale;

    this.zoomPanState.scale = newScale;
    this.zoomPanState.offsetX = mouseX - worldX * newScale;
    this.zoomPanState.offsetY = mouseY - worldY * newScale;

    this.updateTransform();
  }

  private handleMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      this.isDragging = true;
      this.dragStart = { x: event.clientX, y: event.clientY };
      this.app.canvas.style.cursor = 'grabbing';
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const dx = event.clientX - this.dragStart.x;
      const dy = event.clientY - this.dragStart.y;

      this.zoomPanState.offsetX += dx;
      this.zoomPanState.offsetY += dy;

      this.dragStart = { x: event.clientX, y: event.clientY };
      this.updateTransform();
    }
  }

  private handleMouseUp(): void {
    this.isDragging = false;
    this.app.canvas.style.cursor = 'grab';
  }

  private updateTransform(): void {
    this.imageContainer.scale.set(this.zoomPanState.scale);
    this.imageContainer.position.set(this.zoomPanState.offsetX, this.zoomPanState.offsetY);
  }

  async load(file: FileMetadata): Promise<void> {
    await this.waitForAppReady();
    this.currentFile = file;

    try {
      const texture = await Texture.from(file.url);

      if (this.imageSprite) {
        this.imageContainer.removeChild(this.imageSprite);
      }

      this.imageSprite = new Sprite(texture);

      const scaleX = this.config.containerWidth / texture.width;
      const scaleY = this.config.containerHeight / texture.height;
      const scale = Math.min(scaleX, scaleY, 1);

      this.zoomPanState.scale = scale;
      this.zoomPanState.offsetX = (this.config.containerWidth - texture.width * scale) / 2;
      this.zoomPanState.offsetY = (this.config.containerHeight - texture.height * scale) / 2;

      this.imageContainer.addChild(this.imageSprite);
      this.updateTransform();
      this.app.canvas.style.cursor = 'grab';
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  }

  render(): void {
    this.renderAnnotations();
  }

  protected renderAnnotations(): void {
    const existingAnnotations = this.imageContainer.children.filter(
      (child) => child !== this.imageSprite
    );
    existingAnnotations.forEach((child) => this.imageContainer.removeChild(child));

    this.annotations.forEach((annotation) => {
      if (annotation.position.x !== undefined && annotation.position.y !== undefined) {
        const graphics = new Graphics();

        if (annotation.type === 'point') {
          graphics.circle(annotation.position.x, annotation.position.y, 8);
          graphics.fill(0xff0000);
          graphics.circle(annotation.position.x, annotation.position.y, 8);
          graphics.stroke({ color: 0xffffff, width: 2 });
        } else if (annotation.type === 'rectangle' && annotation.position.width && annotation.position.height) {
          graphics.rect(
            annotation.position.x,
            annotation.position.y,
            annotation.position.width,
            annotation.position.height
          );
          graphics.stroke({ color: 0xff0000, width: 2 });
          graphics.fill({ color: 0xff0000, alpha: 0.2 });
        }

        this.imageContainer.addChild(graphics);

        const label = new PixiText({
          text: annotation.label,
          style: new TextStyle({
            fontSize: 14,
            fill: 0xffffff,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 3 },
          }),
        });
        label.x = annotation.position.x;
        label.y = annotation.position.y - 25;
        this.imageContainer.addChild(label);
      }
    });
  }

  resetView(): void {
    if (this.imageSprite) {
      const texture = this.imageSprite.texture;
      const scaleX = this.config.containerWidth / texture.width;
      const scaleY = this.config.containerHeight / texture.height;
      const scale = Math.min(scaleX, scaleY, 1);

      this.zoomPanState.scale = scale;
      this.zoomPanState.offsetX = (this.config.containerWidth - texture.width * scale) / 2;
      this.zoomPanState.offsetY = (this.config.containerHeight - texture.height * scale) / 2;

      this.updateTransform();
    }
  }

  destroy(): void {
    this.app.canvas.removeEventListener('wheel', this.handleWheel.bind(this));
    this.app.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.app.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.app.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.app.canvas.removeEventListener('mouseleave', this.handleMouseUp.bind(this));
    super.destroy();
  }
}
