import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { usePdfViewerStore } from "../../state/pdfViewerStore";
import type { PdfViewerSource } from "../../state/pdfViewerReducer";
import "./PdfViewerPanel.css";

function sourceLabel(source: PdfViewerSource): string {
  return source === "textbook" ? "Textbook" : "Guide";
}

function parsePageInput(raw: string): number {
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? 1 : parsed;
}

const SOURCE_OPTIONS: PdfViewerSource[] = ["textbook", "guide"];

export function PdfViewerPanel() {
  const {
    state,
    activeDoc,
    setSource,
    toggleAutoNav,
    uploadPdf,
    clearPdf,
    setPage,
    goPrevPage,
    goNextPage,
    zoomIn,
    zoomOut,
    resetZoom,
    setActiveScrollRatios,
    renderActivePage
  } = usePdfViewerStore();
  const [gotoPage, setGotoPage] = useState("1");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const textbookFileRef = useRef<HTMLInputElement | null>(null);
  const guideFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setGotoPage(String(activeDoc.currentPage));
  }, [activeDoc.currentPage, state.source]);

  useEffect(() => {
    void renderActivePage(canvasRef.current);
  }, [activeDoc.currentPage, activeDoc.exists, activeDoc.scale, renderActivePage, state.source]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !activeDoc.exists) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const maxLeft = Math.max(0, container.scrollWidth - container.clientWidth);
      const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);
      container.scrollLeft = maxLeft * activeDoc.scrollLeftRatio;
      container.scrollTop = maxTop * activeDoc.scrollTopRatio;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeDoc.currentPage, activeDoc.exists, activeDoc.scale, state.source]);

  function handleFileChange(source: PdfViewerSource, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    void uploadPdf(source, file);
    event.target.value = "";
  }

  function onGotoCommit() {
    setPage(parsePageInput(gotoPage));
  }

  function onGotoKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      onGotoCommit();
    }
  }

  function onCanvasContainerScroll() {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    const maxLeft = Math.max(1, container.scrollWidth - container.clientWidth);
    const maxTop = Math.max(1, container.scrollHeight - container.clientHeight);
    setActiveScrollRatios(container.scrollLeft / maxLeft, container.scrollTop / maxTop);
  }

  return (
    <div className="pdf-panel">
      <div className="pdf-toolbar">
        <div className="pdf-control-group">
          {SOURCE_OPTIONS.map((source) => (
            <button
              key={source}
              type="button"
              className={`tab-button${state.source === source ? " active" : ""}`}
              onClick={() => setSource(source)}
            >
              {sourceLabel(source)}
            </button>
          ))}
        </div>

        <div className="pdf-control-group">
          <button type="button" className="tab-button" onClick={() => textbookFileRef.current?.click()}>
            Upload Textbook
          </button>
          <button type="button" className="tab-button" onClick={() => guideFileRef.current?.click()}>
            Upload Guide
          </button>
          <button type="button" className="tab-button" onClick={() => void clearPdf(state.source)}>
            Clear Active
          </button>
          <input
            ref={textbookFileRef}
            type="file"
            accept="application/pdf"
            className="pdf-hidden-input"
            onChange={(event) => handleFileChange("textbook", event)}
          />
          <input
            ref={guideFileRef}
            type="file"
            accept="application/pdf"
            className="pdf-hidden-input"
            onChange={(event) => handleFileChange("guide", event)}
          />
        </div>

        <div className="pdf-control-group">
          <button type="button" className={`tab-button${state.autoNavEnabled ? " active" : ""}`} onClick={toggleAutoNav}>
            Auto Nav
          </button>
          <span className="pdf-meta-text">{state.autoNavEnabled ? "ON" : "OFF"}</span>
        </div>
      </div>

      <div className="pdf-viewer-controls-row">
        <div className="pdf-nav-group">
          <button
            type="button"
            className="tab-button"
            onClick={goPrevPage}
            disabled={!activeDoc.exists || activeDoc.currentPage <= 1}
          >
            &lt;
          </button>
          <button
            type="button"
            className="tab-button"
            onClick={goNextPage}
            disabled={!activeDoc.exists || activeDoc.currentPage >= Math.max(1, activeDoc.totalPages)}
          >
            &gt;
          </button>
          <input
            className="pdf-goto-input"
            type="number"
            min={1}
            max={Math.max(1, activeDoc.totalPages)}
            value={gotoPage}
            disabled={!activeDoc.exists}
            onChange={(event) => setGotoPage(event.target.value)}
            onBlur={onGotoCommit}
            onKeyDown={onGotoKeyDown}
          />
          <button type="button" className="tab-button" onClick={onGotoCommit} disabled={!activeDoc.exists}>
            Go
          </button>
          <span className="pdf-page-total">Page {activeDoc.currentPage}/{Math.max(1, activeDoc.totalPages)}</span>
        </div>

        <div className="pdf-nav-group">
          <button type="button" className="tab-button" onClick={zoomOut} disabled={!activeDoc.exists}>
            -
          </button>
          <button type="button" className="tab-button" onClick={zoomIn} disabled={!activeDoc.exists}>
            +
          </button>
          <button type="button" className="tab-button" onClick={resetZoom} disabled={!activeDoc.exists}>
            Reset
          </button>
          <span className="pdf-zoom-label">{Math.round(activeDoc.scale * 100)}%</span>
        </div>
      </div>

      <div className="pdf-canvas-shell">
        {activeDoc.exists ? (
          <div className="pdf-canvas-container" ref={scrollContainerRef} onScroll={onCanvasContainerScroll}>
            <canvas ref={canvasRef} className="pdf-canvas" />
          </div>
        ) : (
          <div className="pdf-empty-state">
            <p>No {sourceLabel(state.source)} PDF loaded. Use Upload buttons to start.</p>
          </div>
        )}
      </div>

      {state.panelMessage ? <p className="pdf-panel-message">{state.panelMessage}</p> : null}
    </div>
  );
}
