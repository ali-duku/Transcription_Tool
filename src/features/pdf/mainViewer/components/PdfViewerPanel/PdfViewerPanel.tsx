import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent
} from "react";
import { usePdfViewerStore } from "../../state/pdfViewerStore";
import type { PdfStoreKey, PdfViewerSource } from "../../state/pdfViewerReducer";
import "./PdfViewerPanel.css";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function sourceLabel(source: PdfViewerSource): string {
  return source === "textbook" ? "Textbook" : "Guidebook";
}

function storeKeyForSource(source: PdfViewerSource): PdfStoreKey {
  return source === "textbook" ? "text" : "guide";
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

  function onFileChange(source: PdfViewerSource, event: ChangeEvent<HTMLInputElement>) {
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
      <div className="pdf-controls-grid">
        <div className="pdf-control-card">
          <strong>Source</strong>
          <div className="pdf-toggle-group">
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
        </div>

        <div className="pdf-control-card">
          <strong>Auto Navigation</strong>
          <button
            type="button"
            className={`tab-button${state.autoNavEnabled ? " active" : ""}`}
            onClick={toggleAutoNav}
          >
            {state.autoNavEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      <div className="pdf-source-cards">
        {SOURCE_OPTIONS.map((source) => {
          const key = storeKeyForSource(source);
          const docState = state.docs[key];
          return (
            <section className="pdf-source-card" key={source}>
              <div className="pdf-source-header">
                <strong>{sourceLabel(source)} PDF</strong>
                <span className="pdf-source-state">{docState.exists ? "Stored" : "Not stored"}</span>
              </div>
              <p className="pdf-meta-row">
                Size: {docState.exists ? formatBytes(docState.byteLength) : "(none)"}
              </p>
              <p className="pdf-meta-row">
                Updated:{" "}
                {docState.updatedAt ? new Date(docState.updatedAt).toLocaleTimeString() : "(never in this session)"}
              </p>
              {docState.error ? <p className="pdf-error">{docState.error}</p> : null}
              <div className="pdf-action-row">
                <label className="tab-button pdf-upload-label">
                  Upload
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => onFileChange(source, event)}
                  />
                </label>
                <button
                  type="button"
                  className="tab-button"
                  onClick={() => void clearPdf(source)}
                  disabled={!docState.exists || docState.loading}
                >
                  Clear
                </button>
              </div>
            </section>
          );
        })}
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
          <span className="pdf-page-total">/ {Math.max(1, activeDoc.totalPages)}</span>
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
          <div
            className="pdf-canvas-container"
            ref={scrollContainerRef}
            onScroll={onCanvasContainerScroll}
          >
            <canvas ref={canvasRef} className="pdf-canvas" />
          </div>
        ) : (
          <div className="pdf-empty-state">
            <p>Upload a PDF to enable page rendering for the active source.</p>
          </div>
        )}
      </div>

      {state.panelMessage ? <p className="pdf-panel-message">{state.panelMessage}</p> : null}
    </div>
  );
}
