import Papa from 'papaparse';
import { BaseRenderer } from './BaseRenderer';
import { FileMetadata, Annotation, RendererConfig } from '../types/renderer';

export class CSVRenderer extends BaseRenderer {
  private tableContainer: HTMLDivElement;
  private csvData: string[][];
  private headers: string[];

  constructor(container: HTMLElement, config: RendererConfig) {
    super(container, config);
    this.csvData = [];
    this.headers = [];

    this.tableContainer = document.createElement('div');
    this.tableContainer.style.position = 'absolute';
    this.tableContainer.style.top = '0';
    this.tableContainer.style.left = '0';
    this.tableContainer.style.width = `${config.containerWidth}px`;
    this.tableContainer.style.height = `${config.containerHeight}px`;
    this.tableContainer.style.overflow = 'auto';
    this.tableContainer.style.backgroundColor = '#ffffff';

    container.appendChild(this.tableContainer);
  }

  async load(file: FileMetadata): Promise<void> {
    await this.waitForAppReady();
    this.currentFile = file;

    try {
      const response = await fetch(file.url);
      const csvText = await response.text();

      const result = Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
      });

      if (result.data && result.data.length > 0) {
        this.headers = result.data[0] as string[];
        this.csvData = result.data.slice(1) as string[][];
      }

      this.render();
    } catch (error) {
      console.error('Failed to load CSV file:', error);
      this.tableContainer.innerHTML = '<div style="padding: 16px; color: #ef4444;">Error loading CSV file</div>';
    }
  }

  render(): void {
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '14px';

    const thead = document.createElement('thead');
    thead.style.backgroundColor = '#f3f4f6';
    thead.style.position = 'sticky';
    thead.style.top = '0';
    thead.style.zIndex = '10';

    const headerRow = document.createElement('tr');
    this.headers.forEach((header) => {
      const th = document.createElement('th');
      th.textContent = header;
      th.style.padding = '12px';
      th.style.textAlign = 'left';
      th.style.borderBottom = '2px solid #d1d5db';
      th.style.fontWeight = '600';
      th.style.color = '#374151';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    this.csvData.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #e5e7eb';

      if (rowIndex % 2 === 0) {
        tr.style.backgroundColor = '#f9fafb';
      }

      row.forEach((cell) => {
        const td = document.createElement('td');
        td.textContent = cell;
        td.style.padding = '12px';
        td.style.color = '#1f2937';
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    this.tableContainer.innerHTML = '';
    this.tableContainer.appendChild(table);
  }

  resize(width: number, height: number): void {
    super.resize(width, height);
    this.tableContainer.style.width = `${width}px`;
    this.tableContainer.style.height = `${height}px`;
  }

  destroy(): void {
    if (this.container.contains(this.tableContainer)) {
      this.container.removeChild(this.tableContainer);
    }
    super.destroy();
  }
}
