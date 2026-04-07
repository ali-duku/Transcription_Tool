import {
  GlobalWorkerOptions,
  getDocument,
  type PDFDocumentProxy,
  type RenderTask
} from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;

export async function loadPdfDocument(buffer: ArrayBuffer): Promise<PDFDocumentProxy> {
  const loadingTask = getDocument({ data: buffer });
  return loadingTask.promise;
}

export async function destroyPdfDocument(doc: PDFDocumentProxy | null): Promise<void> {
  if (!doc) {
    return;
  }
  await doc.destroy();
}

function clearCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  canvas.width = 1;
  canvas.height = 1;
  context.clearRect(0, 0, 1, 1);
}

export async function renderPdfPageToCanvas(
  doc: PDFDocumentProxy | null,
  pageNumber: number,
  scale: number,
  canvas: HTMLCanvasElement
): Promise<void> {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    return;
  }

  if (!doc) {
    clearCanvas(canvas, context);
    return;
  }

  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, viewport.width, viewport.height);

  const renderTask = page.render({
    canvas,
    canvasContext: context,
    viewport
  });
  await (renderTask as RenderTask).promise;
}
