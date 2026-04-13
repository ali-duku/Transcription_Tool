import { useEffect, useState, type KeyboardEvent } from "react";
import "./BboxDrawToolbar.css";

interface BboxDrawToolbarProps {
  source: "textbook" | "guide";
  exists: boolean;
  currentPage: number;
  totalPages: number;
  scale: number;
  coordsText: string;
  hasCurrentRect: boolean;
  onUploadTextbook: () => void;
  onUploadGuide: () => void;
  onSetPage: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetZoom: () => void;
  onUndo: () => void;
  onAddBbox: () => void;
  onClearPage: () => void;
  onClose: () => void;
}

export function BboxDrawToolbar({
  source,
  exists,
  currentPage,
  totalPages,
  scale,
  coordsText,
  hasCurrentRect,
  onUploadTextbook,
  onUploadGuide,
  onSetPage,
  onPrevPage,
  onNextPage,
  onZoomOut,
  onZoomIn,
  onResetZoom,
  onUndo,
  onAddBbox,
  onClearPage,
  onClose
}: BboxDrawToolbarProps) {
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  function commitPageInput() {
    const parsed = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(currentPage));
      return;
    }
    onSetPage(parsed);
  }

  function onPageInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    commitPageInput();
  }

  const sourceLabel = source === "textbook" ? "Textbook" : "Guide";

  return (
    <div className="bbox-draw-controls">
      <div className="bbox-draw-group">
        <button type="button" className="tab-button" onClick={onUploadTextbook}>
          Upload Textbook PDF
        </button>
        <button type="button" className="tab-button" onClick={onUploadGuide}>
          Upload Answers PDF
        </button>
      </div>

      <div className="bbox-draw-group">
        <span className="bbox-metric-label">
          Doc: <strong>{sourceLabel}</strong>
        </span>
      </div>

      <div className="bbox-draw-group">
        <button type="button" className="tab-button" onClick={onPrevPage} disabled={!exists || currentPage <= 1}>
          &#9664;
        </button>
        <span className="bbox-metric-label">
          Page {currentPage}/{Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          className="tab-button"
          onClick={onNextPage}
          disabled={!exists || currentPage >= Math.max(1, totalPages)}
        >
          &#9654;
        </button>
        <input
          className="bbox-draw-page-input"
          type="number"
          min={1}
          max={Math.max(1, totalPages)}
          value={pageInput}
          disabled={!exists}
          onChange={(event) => setPageInput(event.target.value)}
          onBlur={commitPageInput}
          onKeyDown={onPageInputKeyDown}
        />
        <button type="button" className="tab-button" onClick={commitPageInput} disabled={!exists}>
          Go
        </button>
      </div>

      <div className="bbox-draw-group">
        <button type="button" className="tab-button" onClick={onZoomOut} disabled={!exists}>
          -
        </button>
        <button type="button" className="tab-button" onClick={onZoomIn} disabled={!exists}>
          +
        </button>
        <button type="button" className="tab-button" onClick={onResetZoom} disabled={!exists}>
          Reset
        </button>
        <span className="bbox-metric-label">{Math.round(scale * 100)}%</span>
      </div>

      <div className="bbox-draw-group">
        <span className="bbox-metric-label">Drawing: Always On</span>
        <button type="button" className="tab-button" onClick={onUndo} disabled={!hasCurrentRect}>
          Undo
        </button>
        <button type="button" className="tab-button" onClick={onAddBbox} disabled={!hasCurrentRect}>
          Add BBox
        </button>
        <button type="button" className="tab-button danger" onClick={onClearPage}>
          Clear Page
        </button>
      </div>

      <div className="bbox-draw-group">
        <span className="bbox-metric-label">Coords</span>
        <span className="bbox-metric-label">{coordsText}</span>
      </div>

      <div className="bbox-draw-group bbox-draw-group-right">
        <button type="button" className="tab-button danger" onClick={onClose}>
          &#10005;
        </button>
      </div>
    </div>
  );
}
