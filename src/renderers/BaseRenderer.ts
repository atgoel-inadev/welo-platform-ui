import { Application } from 'pixi.js';
import { BaseRenderer as IBaseRenderer, FileMetadata, Annotation, RendererConfig } from '../types/renderer';

export abstract class BaseRenderer implements IBaseRenderer {
  protected app: Application;
  protected container: HTMLElement;
  protected annotations: Map<string, Annotation>;
  protected config: RendererConfig;
  protected currentFile: FileMetadata | null;

  constructor(container: HTMLElement, config: RendererConfig) {
    this.container = container;
    this.config = config;
    this.annotations = new Map();
    this.currentFile = null;

    this.app = new Application();
    this.initializeApp();
  }

  private async initializeApp() {
    await this.app.init({
      width: this.config.containerWidth,
      height: this.config.containerHeight,
      backgroundColor: this.config.backgroundColor || 0xffffff,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.container.appendChild(this.app.canvas);
  }

  abstract load(file: FileMetadata): Promise<void>;
  abstract render(): void;

  addAnnotation(annotation: Annotation): void {
    this.annotations.set(annotation.id, annotation);
    this.renderAnnotations();
  }

  removeAnnotation(annotationId: string): void {
    this.annotations.delete(annotationId);
    this.renderAnnotations();
  }

  getAnnotations(): Annotation[] {
    return Array.from(this.annotations.values());
  }

  resize(width: number, height: number): void {
    this.config.containerWidth = width;
    this.config.containerHeight = height;
    this.app.renderer.resize(width, height);
    this.render();
  }

  destroy(): void {
    this.app.destroy(true, { children: true, texture: true, textureSource: true });
    if (this.container.contains(this.app.canvas)) {
      this.container.removeChild(this.app.canvas);
    }
  }

  protected renderAnnotations(): void {
    this.render();
  }

  protected waitForAppReady(): Promise<void> {
    return new Promise((resolve) => {
      if (this.app.renderer) {
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (this.app.renderer) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);
      }
    });
  }
}
