import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePdfViewerStore } from "../../../../pdf/mainViewer/state/pdfViewerStore";
import {
  drawOverlay,
  isValidRect,
  normalizeRect,
  type Rect
} from "./bboxDrawGeometry";
import { nudgeRectEdge, nudgeRectPosition } from "./bboxNudgeUtils";
import { areRectsEqual, toPageBounds, type Size } from "./bboxDrawModalUtils";
import { useBboxCanvasInteractions } from "./useBboxCanvasInteractions";
import { useBboxKeyboardShortcuts } from "./useBboxKeyboardShortcuts";
import { BboxDrawToolbar } from "./BboxDrawToolbar";
import "./BboxDrawModal.css";

interface BboxDrawModalProps {
  open: boolean;
  initialSource: "textbook" | "guide";
  initialPage: number;
  initialRect: Rect | null;
  onClose: () => void;
  onConfirm: (selection: { page: number; rect: Rect }) => void;
}

export function BboxDrawModal({
  open,
  initialSource,
  initialPage,
  initialRect,
  onClose,
  onConfirm
}: BboxDrawModalProps) {
  const {
    state,
    activeDoc,
    setSource,
    setPage,
    goPrevPage,
    goNextPage,
    zoomIn,
    zoomOut,
    resetZoom,
    renderActivePage
  } = usePdfViewerStore();
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentRect, setCurrentRect] = useState<Rect | null>(initialRect);
  const [confirmOnClear, setConfirmOnClear] = useState(true);
  const [pageBounds, setPageBounds] = useState<Size>({ width: 0, height: 0 });
  const {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    resetDragState
  } = useBboxCanvasInteractions({
    drawCanvasRef,
    scale: activeDoc.scale,
    pageBounds,
    currentRect,
    setCurrentRect
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setCurrentRect(initialRect);
    setConfirmOnClear(true);
    resetDragState();
    setSource(initialSource);
    if (initialPage > 0) {
      setPage(initialPage);
    }
  }, [initialPage, initialRect, initialSource, open, resetDragState, setPage, setSource]);

  useEffect(() => {
    if (!open || !activeDoc.exists) {
      return;
    }

    void renderActivePage(pdfCanvasRef.current).then(() => {
      const baseCanvas = pdfCanvasRef.current;
      const overlayCanvas = drawCanvasRef.current;
      if (!baseCanvas || !overlayCanvas) {
        return;
      }

      const width = Math.max(
        1,
        Number.parseFloat(baseCanvas.style.width || "") || baseCanvas.width / (window.devicePixelRatio || 1)
      );
      const height = Math.max(
        1,
        Number.parseFloat(baseCanvas.style.height || "") || baseCanvas.height / (window.devicePixelRatio || 1)
      );
      overlayCanvas.width = Math.floor(width);
      overlayCanvas.height = Math.floor(height);
      overlayCanvas.style.width = `${Math.floor(width)}px`;
      overlayCanvas.style.height = `${Math.floor(height)}px`;

      setPageBounds(toPageBounds(overlayCanvas, activeDoc.scale));
      drawOverlay(overlayCanvas, currentRect, activeDoc.scale);
    });
  }, [activeDoc.currentPage, activeDoc.exists, activeDoc.scale, open, renderActivePage, state.source]);

  useEffect(() => {
    if (!open || !activeDoc.exists) {
      return;
    }
    drawOverlay(drawCanvasRef.current, currentRect, activeDoc.scale);
  }, [activeDoc.exists, activeDoc.scale, currentRect, open]);

  const canConfirm = useMemo(() => isValidRect(currentRect), [currentRect]);
  const hasUnsavedRectChanges = useMemo(
    () => !areRectsEqual(initialRect, currentRect),
    [currentRect, initialRect]
  );

  const requestClose = useCallback(() => {
    if (hasUnsavedRectChanges) {
      const discard = window.confirm(
        "Discard current bounding-box changes in the draw modal?"
      );
      if (!discard) {
        return;
      }
    }
    onClose();
  }, [hasUnsavedRectChanges, onClose]);

  const clearCurrentRect = useCallback(() => {
    if (!currentRect) {
      return;
    }
    if (confirmOnClear) {
      const shouldClear = window.confirm("Clear the current bounding box selection?");
      if (!shouldClear) {
        return;
      }
    }
    setCurrentRect(null);
  }, [confirmOnClear, currentRect]);

  const nudgeCurrentRect = useCallback((delta: { x: number; y: number }) => {
    setCurrentRect((previous) => {
      if (!isValidRect(previous)) {
        return previous;
      }
      return nudgeRectPosition(previous, pageBounds, delta);
    });
  }, [pageBounds]);

  const nudgeCurrentRectEdge = useCallback((edge: "x1" | "x2" | "y1" | "y2", amount: number) => {
    setCurrentRect((previous) => {
      if (!isValidRect(previous)) {
        return previous;
      }
      return nudgeRectEdge(previous, pageBounds, edge, amount);
    });
  }, [pageBounds]);

  useBboxKeyboardShortcuts({
    open,
    hasRect: isValidRect(currentRect),
    onRequestClose: requestClose,
    onNudgeRect: (dx, dy) => nudgeCurrentRect({ x: dx, y: dy }),
    onNudgeEdge: nudgeCurrentRectEdge
  });

  if (!open) {
    return null;
  }

  return (
    <div className="bbox-draw-modal">
      <div className="bbox-draw-dialog">
        <div className="bbox-draw-header">
          <strong>Draw Bounding Box</strong>
          <button type="button" className="tab-button" onClick={requestClose}>
            Close
          </button>
        </div>

        <BboxDrawToolbar
          source={state.source}
          exists={activeDoc.exists}
          currentPage={activeDoc.currentPage}
          totalPages={activeDoc.totalPages}
          scale={activeDoc.scale}
          rect={currentRect}
          hasRect={currentRect !== null}
          onSetSource={setSource}
          onSetPage={setPage}
          onPrevPage={goPrevPage}
          onNextPage={goNextPage}
          onZoomOut={zoomOut}
          onZoomIn={zoomIn}
          onResetZoom={resetZoom}
          onClearRect={clearCurrentRect}
          confirmOnClear={confirmOnClear}
          onToggleConfirmOnClear={setConfirmOnClear}
          onNudgeRect={(dx, dy) => nudgeCurrentRect({ x: dx, y: dy })}
          onNudgeEdge={nudgeCurrentRectEdge}
        />

        <div className="bbox-draw-canvas-shell">
          {activeDoc.exists ? (
            <div className="bbox-draw-canvas-stack">
              <canvas ref={pdfCanvasRef} className="bbox-base-canvas" />
              <canvas
                ref={drawCanvasRef}
                className="bbox-overlay-canvas"
                onMouseDown={onPointerDown}
                onMouseMove={onPointerMove}
                onMouseUp={onPointerUp}
                onMouseLeave={onPointerUp}
              />
            </div>
          ) : (
            <p>No PDF is loaded for the selected source.</p>
          )}
        </div>

        <div className="bbox-draw-footer">
          <button type="button" className="tab-button" onClick={requestClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!canConfirm}
            onClick={() => {
              if (!isValidRect(currentRect)) {
                return;
              }
              onConfirm({
                page: activeDoc.currentPage,
                rect: normalizeRect(currentRect)
              });
              onClose();
            }}
          >
            Use Selection
          </button>
        </div>
      </div>
    </div>
  );
}
