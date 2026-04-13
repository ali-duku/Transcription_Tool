import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import type { PdfViewerSource } from "../../../../pdf/mainViewer/state/pdfViewerReducer";
import { usePdfViewerStore } from "../../../../pdf/mainViewer/state/pdfViewerStore";
import { drawOverlay, isValidRect, normalizeRect, type Rect } from "./bboxDrawGeometry";
import { areRectsEqual, toPageBounds, type Size } from "./bboxDrawModalUtils";
import { BboxDrawFileInputs } from "./BboxDrawFileInputs";
import { BboxDrawSidebar } from "./BboxDrawSidebar";
import { BboxDrawToolbar } from "./BboxDrawToolbar";
import { readPdfPointFromMouseEvent } from "./bboxDrawModalHelpers";
import { useBboxCanvasInteractions } from "./useBboxCanvasInteractions";
import { useBboxKeyboardShortcuts } from "./useBboxKeyboardShortcuts";
import { useBboxSavedSelections } from "./useBboxSavedSelections";
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
    uploadPdf,
    renderActivePage
  } = usePdfViewerStore();
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const textbookUploadRef = useRef<HTMLInputElement | null>(null);
  const guideUploadRef = useRef<HTMLInputElement | null>(null);
  const [currentRect, setCurrentRect] = useState<Rect | null>(initialRect);
  const [pageBounds, setPageBounds] = useState<Size>({ width: 0, height: 0 });
  const [coordsText, setCoordsText] = useState("-");
  const {
    activePageBoxes,
    activeSelectedIndex,
    selectedRect,
    hasSavedBoxes,
    resetSelections,
    clearCurrentPage,
    addCurrentRect,
    selectSavedBox
  } = useBboxSavedSelections(activeDoc.currentPage);
  const { onPointerDown, onPointerMove, onPointerUp, resetDragState } = useBboxCanvasInteractions({
    drawCanvasRef,
    scale: activeDoc.scale,
    pageBounds,
    currentRect,
    setCurrentRect
  });

  useEffect(() => {
    if (!open) return;
    setCoordsText("-");
    setCurrentRect(initialRect);
    resetSelections();
    resetDragState();
    setSource(initialSource);
    if (initialPage > 0) setPage(initialPage);
  }, [initialPage, initialRect, initialSource, open, resetDragState, resetSelections, setPage, setSource]);

  useEffect(() => {
    if (!open || !activeDoc.exists) return;
    void renderActivePage(pdfCanvasRef.current).then(() => {
      const baseCanvas = pdfCanvasRef.current;
      const overlayCanvas = drawCanvasRef.current;
      if (!baseCanvas || !overlayCanvas) return;

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
  }, [activeDoc.currentPage, activeDoc.exists, activeDoc.scale, currentRect, open, renderActivePage, state.source]);

  useEffect(() => {
    if (!open || !activeDoc.exists) return;
    drawOverlay(drawCanvasRef.current, currentRect, activeDoc.scale);
  }, [activeDoc.exists, activeDoc.scale, currentRect, open]);

  const canConfirm = useMemo(() => isValidRect(selectedRect ?? currentRect), [currentRect, selectedRect]);
  const hasUnsavedRectChanges = useMemo(() => !areRectsEqual(initialRect, currentRect), [currentRect, initialRect]);
  const hasAnyModalWork = useMemo(() => hasUnsavedRectChanges || hasSavedBoxes, [hasSavedBoxes, hasUnsavedRectChanges]);

  const requestClose = useCallback(() => {
    if (hasAnyModalWork && !window.confirm("You have unsaved bounding boxes. Close and lose this modal work?")) {
      return;
    }
    onClose();
  }, [hasAnyModalWork, onClose]);

  const ensureNoUnsavedRect = useCallback(() => {
    if (!isValidRect(currentRect)) return true;
    if (!window.confirm("You have an unsaved bounding box. Navigate away and lose the current drawing?")) {
      return false;
    }
    setCurrentRect(null);
    return true;
  }, [currentRect]);

  const handleSetPage = useCallback(
    (page: number) => {
      if (!ensureNoUnsavedRect()) return;
      setPage(page);
      setCoordsText("-");
    },
    [ensureNoUnsavedRect, setPage]
  );

  const handlePrevPage = useCallback(() => {
    if (!ensureNoUnsavedRect()) return;
    goPrevPage();
    setCoordsText("-");
  }, [ensureNoUnsavedRect, goPrevPage]);

  const handleNextPage = useCallback(() => {
    if (!ensureNoUnsavedRect()) return;
    goNextPage();
    setCoordsText("-");
  }, [ensureNoUnsavedRect, goNextPage]);

  const handleResetZoom = useCallback(() => {
    if (!ensureNoUnsavedRect()) return;
    resetZoom();
  }, [ensureNoUnsavedRect, resetZoom]);

  const handleClearPage = useCallback(() => {
    setCurrentRect(null);
    clearCurrentPage();
  }, [clearCurrentPage]);

  const handleUndo = useCallback(() => {
    if (!isValidRect(currentRect)) return;
    if (!window.confirm("Undo current bounding box drawing?")) return;
    setCurrentRect(null);
  }, [currentRect]);

  const handleAddBbox = useCallback(() => {
    if (!isValidRect(currentRect)) return;
    addCurrentRect(currentRect);
    setCurrentRect(null);
  }, [addCurrentRect, currentRect]);

  async function handleUploadChange(source: PdfViewerSource, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    setSource(source);
    await uploadPdf(source, file);
  }

  function handleOverlayMouseMove(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = drawCanvasRef.current;
    if (canvas) {
      const point = readPdfPointFromMouseEvent(event, canvas, activeDoc.scale, pageBounds);
      setCoordsText(`(${Math.round(point.x)}, ${Math.round(point.y)})`);
    }
    onPointerMove(event);
  }

  function handleSelectSavedBox(index: number) {
    const selected = selectSavedBox(index);
    if (selected) setCurrentRect(selected);
  }

  function handleConfirmSelection() {
    const rect = selectedRect ?? currentRect;
    if (!isValidRect(rect)) return;
    onConfirm({ page: activeDoc.currentPage, rect: normalizeRect(rect) });
    onClose();
  }

  useBboxKeyboardShortcuts({
    open,
    hasRect: isValidRect(currentRect),
    onRequestClose: requestClose,
    onNudgeRect: (dx, dy) =>
      setCurrentRect((previous) =>
        isValidRect(previous)
          ? normalizeRect({ x1: previous.x1 + dx, y1: previous.y1 + dy, x2: previous.x2 + dx, y2: previous.y2 + dy })
          : previous
      )
  });

  if (!open) return null;

  return (
    <div className="bbox-draw-modal">
      <div className="bbox-draw-dialog">
        <BboxDrawToolbar
          source={state.source}
          exists={activeDoc.exists}
          currentPage={activeDoc.currentPage}
          totalPages={activeDoc.totalPages}
          scale={activeDoc.scale}
          coordsText={coordsText}
          hasCurrentRect={isValidRect(currentRect)}
          onUploadTextbook={() => textbookUploadRef.current?.click()}
          onUploadGuide={() => guideUploadRef.current?.click()}
          onSetPage={handleSetPage}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onZoomOut={zoomOut}
          onZoomIn={zoomIn}
          onResetZoom={handleResetZoom}
          onUndo={handleUndo}
          onAddBbox={handleAddBbox}
          onClearPage={handleClearPage}
          onClose={requestClose}
        />

        <div className="bbox-draw-content">
          <div className="bbox-draw-canvas-shell">
            {activeDoc.exists ? (
              <div className="bbox-draw-canvas-stack">
                <canvas ref={pdfCanvasRef} className="bbox-base-canvas" />
                <canvas
                  ref={drawCanvasRef}
                  className="bbox-overlay-canvas"
                  onMouseDown={onPointerDown}
                  onMouseMove={handleOverlayMouseMove}
                  onMouseUp={onPointerUp}
                  onMouseLeave={() => {
                    setCoordsText("-");
                    onPointerUp();
                  }}
                />
              </div>
            ) : (
              <p>No PDF is loaded for the selected source.</p>
            )}
          </div>

          <BboxDrawSidebar
            page={activeDoc.currentPage}
            boxes={activePageBoxes}
            selectedIndex={activeSelectedIndex}
            onSelect={handleSelectSavedBox}
          />
        </div>

        <div className="bbox-draw-footer">
          <button type="button" className="tab-button" onClick={requestClose}>
            Cancel
          </button>
          <button type="button" className="primary-button" disabled={!canConfirm} onClick={handleConfirmSelection}>
            Use Selected
          </button>
        </div>

        <BboxDrawFileInputs
          setTextbookInputRef={(node) => {
            textbookUploadRef.current = node;
          }}
          setGuideInputRef={(node) => {
            guideUploadRef.current = node;
          }}
          onUpload={handleUploadChange}
        />
      </div>
    </div>
  );
}
