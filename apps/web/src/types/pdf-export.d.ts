declare module 'html2canvas' {
  export default function html2canvas(
    element: HTMLElement,
    options?: Record<string, unknown>,
  ): Promise<HTMLCanvasElement>;
}

declare module 'jspdf' {
  export class jsPDF {
    constructor(orientation?: 'p' | 'portrait' | 'l' | 'landscape', unit?: string, format?: string);
    internal: { pageSize: { getWidth(): number; getHeight(): number } };
    addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
    ): void;
    addPage(): void;
    save(filename: string): void;
  }
}
