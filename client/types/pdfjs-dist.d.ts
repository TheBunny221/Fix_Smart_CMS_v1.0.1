declare module "pdfjs-dist" {
  export interface PDFPageViewport {
    width: number;
    height: number;
  }

  export interface PDFPageProxy {
    getViewport(params: { scale: number }): PDFPageViewport;
    render(params: {
      canvasContext: CanvasRenderingContext2D;
      viewport: PDFPageViewport;
    }): { promise: Promise<void> };
  }

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  export interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>;
  }

  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  export function getDocument(
    source: string | ArrayBuffer | { data: ArrayBuffer },
  ): PDFDocumentLoadingTask;
}
