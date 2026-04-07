import { useEffect, useState, type KeyboardEvent } from "react";
import "./BboxDrawToolbar.css";
import { normalizeRect, type Rect } from "./bboxDrawGeometry";
import type { RectEdge } from "./bboxNudgeUtils";

interface BboxDrawToolbarProps {
  source: "textbook" | "guide";
  exists: boolean;
  currentPage: number;
  totalPages: number;
  scale: number;
  rect: Rect | null;
  hasRect: boolean;
  onSetSource: (source: "textbook" | "guide") => void;
  onSetPage: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetZoom: () => void;
  onClearRect: () => void;
  confirmOnClear: boolean;
  onToggleConfirmOnClear: (next: boolean) => void;
  onNudgeRect: (dx: number, dy: number) => void;
  onNudgeEdge: (edge: RectEdge, delta: number) => void;
}

export function BboxDrawToolbar({
  source,
  exists,
  currentPage,
  totalPages,
  scale,
  rect,
  hasRect,
  onSetSource,
  onSetPage,
  onPrevPage,
  onNextPage,
  onZoomOut,
  onZoomIn,
  onResetZoom,
  onClearRect,
  confirmOnClear,
  onToggleConfirmOnClear,
  onNudgeRect,
  onNudgeEdge
}: BboxDrawToolbarProps) {
  const normalizedRect = rect ? normalizeRect(rect) : null;
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  function updateEdgeValue(edge: RectEdge, nextRaw: string) {
    if (!normalizedRect) {
      return;
    }
    const next = Number.parseFloat(nextRaw);
    if (!Number.isFinite(next)) {
      return;
    }
    const current = normalizedRect[edge];
    onNudgeEdge(edge, next - current);
  }

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

  return (
    <div className="bbox-draw-controls">
      <div className="bbox-draw-group">
        <button
          type="button"
          className={`tab-button${source === "textbook" ? " active" : ""}`}
          onClick={() => onSetSource("textbook")}
        >
          Textbook
        </button>
        <button
          type="button"
          className={`tab-button${source === "guide" ? " active" : ""}`}
          onClick={() => onSetSource("guide")}
        >
          Guidebook
        </button>
      </div>

      <div className="bbox-draw-group">
        <button type="button" className="tab-button" onClick={onPrevPage} disabled={!exists || currentPage <= 1}>
          &lt;
        </button>
        <span>Page</span>
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
        <span>/ {Math.max(1, totalPages)}</span>
        <button
          type="button"
          className="tab-button"
          onClick={onNextPage}
          disabled={!exists || currentPage >= Math.max(1, totalPages)}
        >
          &gt;
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
        <span>{Math.round(scale * 100)}%</span>
      </div>

      <button type="button" className="tab-button" onClick={onClearRect} disabled={!hasRect}>
        Clear Box
      </button>

      <label className="bbox-draw-toggle">
        <input
          type="checkbox"
          checked={confirmOnClear}
          onChange={(event) => onToggleConfirmOnClear(event.target.checked)}
        />
        Confirm clear
      </label>

      <div className="bbox-draw-group">
        <span>Nudge</span>
        <button type="button" className="tab-button" onClick={() => onNudgeRect(-1, 0)} disabled={!hasRect}>
          Left
        </button>
        <button type="button" className="tab-button" onClick={() => onNudgeRect(1, 0)} disabled={!hasRect}>
          Right
        </button>
        <button type="button" className="tab-button" onClick={() => onNudgeRect(0, -1)} disabled={!hasRect}>
          Up
        </button>
        <button type="button" className="tab-button" onClick={() => onNudgeRect(0, 1)} disabled={!hasRect}>
          Down
        </button>
      </div>

      <div className="bbox-draw-group">
        <span>Edges</span>
        <button type="button" className="tab-button" onClick={() => onNudgeEdge("x1", -1)} disabled={!hasRect}>
          x1-
        </button>
        <button type="button" className="tab-button" onClick={() => onNudgeEdge("x1", 1)} disabled={!hasRect}>
          x1+
        </button>
        <button type="button" className="tab-button" onClick={() => onNudgeEdge("x2", -1)} disabled={!hasRect}>
          x2-
        </button>
        <button type="button" className="tab-button" onClick={() => onNudgeEdge("x2", 1)} disabled={!hasRect}>
          x2+
        </button>
        <button type="button" className="tab-button" onClick={() => onNudgeEdge("y1", -1)} disabled={!hasRect}>
          y1-
        </button>
        <button type="button" className="tab-button" onClick={() => onNudgeEdge("y1", 1)} disabled={!hasRect}>
          y1+
        </button>
        <button type="button" className="tab-button" onClick={() => onNudgeEdge("y2", -1)} disabled={!hasRect}>
          y2-
        </button>
        <button type="button" className="tab-button" onClick={() => onNudgeEdge("y2", 1)} disabled={!hasRect}>
          y2+
        </button>
      </div>

      <div className="bbox-draw-group bbox-draw-coordinates">
        <span>Coords</span>
        {(["x1", "y1", "x2", "y2"] as RectEdge[]).map((edge) => (
          <label key={edge} className="bbox-draw-coordinate-field">
            <span>{edge}</span>
            <input
              type="number"
              step="1"
              value={normalizedRect ? normalizedRect[edge] : ""}
              disabled={!hasRect}
              onChange={(event) => updateEdgeValue(edge, event.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="bbox-draw-shortcuts">
        Shortcuts: `Arrow` move, `Shift+Arrow` x10, `Ctrl/Cmd+Arrow` edge adjust, `Esc` close.
      </div>
    </div>
  );
}
