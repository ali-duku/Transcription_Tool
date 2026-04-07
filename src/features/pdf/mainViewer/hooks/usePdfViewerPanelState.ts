import { useCallback, useEffect, useReducer, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { PDF_AUTO_NAV_ENABLED_KEY } from "../../../../shared/constants/storageKeys";
import { writeLocalStorageItem } from "../../../persistence/services/storageService";
import {
  clearPdfBuffer,
  loadPdfBuffer,
  savePdfBuffer
} from "../../storage/indexedDbPdfService";
import {
  destroyPdfDocument,
  loadPdfDocument,
  renderPdfPageToCanvas
} from "../services/pdfRenderService";
import {
  createInitialPdfViewerState,
  pdfViewerReducer,
  sourceToStoreKey,
  type PdfStoreKey,
  type PdfViewerSource
} from "../state/pdfViewerReducer";
import {
  MAX_SCALE,
  MIN_SCALE,
  SCALE_STEP,
  clampPage,
  clampRatio,
  formatBytes
} from "./pdfViewerPanelStateUtils";
export function usePdfViewerPanelState() {
  const [state, dispatch] = useReducer(pdfViewerReducer, undefined, createInitialPdfViewerState);
  const activeKey = sourceToStoreKey(state.source);
  const activeDoc = state.docs[activeKey];
  const docsRef = useRef<Record<PdfStoreKey, PDFDocumentProxy | null>>({
    text: null,
    guide: null
  });
  const sourceRef = useRef(state.source);
  const stateDocsRef = useRef(state.docs);
  const renderTokenRef = useRef(0);
  useEffect(() => {
    sourceRef.current = state.source;
    stateDocsRef.current = state.docs;
  }, [state.docs, state.source]);
  const cachePdfDocument = useCallback(async (key: PdfStoreKey, buffer: ArrayBuffer | null) => {
    await destroyPdfDocument(docsRef.current[key]);
    if (!buffer) {
      docsRef.current[key] = null;
      return null;
    }
    const doc = await loadPdfDocument(buffer.slice(0));
    docsRef.current[key] = doc;
    return doc;
  }, []);
  const reloadDocState = useCallback(
    async (key: PdfStoreKey) => {
      dispatch({ type: "start_doc_load", key });
      try {
        const buffer = await loadPdfBuffer(key);
        const doc = await cachePdfDocument(key, buffer);
        dispatch({
          type: "finish_doc_load",
          key,
          exists: buffer !== null,
          byteLength: buffer?.byteLength ?? 0,
          error: null
        });
        if (doc) {
          dispatch({
            type: "set_doc_view_state",
            key,
            patch: {
              currentPage: 1,
              totalPages: doc.numPages || 1,
              scale: 1
            }
          });
        }
      } catch (error) {
        docsRef.current[key] = null;
        dispatch({
          type: "finish_doc_load",
          key,
          exists: false,
          byteLength: 0,
          error: error instanceof Error ? error.message : "Unknown IndexedDB error."
        });
      }
    },
    [cachePdfDocument]
  );
  useEffect(() => {
    void reloadDocState("text");
    void reloadDocState("guide");
  }, [reloadDocState]);
  useEffect(
    () => () => {
      void destroyPdfDocument(docsRef.current.text);
      void destroyPdfDocument(docsRef.current.guide);
    },
    []
  );
  const setSource = useCallback((source: PdfViewerSource) => {
    dispatch({ type: "set_source", source });
  }, []);

  const toggleAutoNav = useCallback(() => {
    const next = !state.autoNavEnabled;
    dispatch({ type: "set_auto_nav", enabled: next });
    writeLocalStorageItem(PDF_AUTO_NAV_ENABLED_KEY, next ? "true" : "false");
    dispatch({
      type: "set_panel_message",
      message: `Auto-navigation ${next ? "enabled" : "disabled"}.`
    });
  }, [state.autoNavEnabled]);

  const uploadPdf = useCallback(
    async (source: PdfViewerSource, file: File | null) => {
      if (!file) {
        return;
      }
      const key = sourceToStoreKey(source);
      dispatch({ type: "start_doc_load", key });
      try {
        const buffer = await file.arrayBuffer();
        await savePdfBuffer(key, buffer);
        const doc = await cachePdfDocument(key, buffer);
        dispatch({
          type: "finish_doc_load",
          key,
          exists: true,
          byteLength: buffer.byteLength,
          error: null
        });
        dispatch({
          type: "set_doc_view_state",
          key,
          patch: {
            currentPage: 1,
            totalPages: doc?.numPages || 1,
            scale: 1
          }
        });
        dispatch({
          type: "set_panel_message",
          message: `${source === "textbook" ? "Textbook" : "Guidebook"} PDF saved (${formatBytes(buffer.byteLength)}).`
        });
      } catch (error) {
        docsRef.current[key] = null;
        dispatch({
          type: "finish_doc_load",
          key,
          exists: false,
          byteLength: 0,
          error: error instanceof Error ? error.message : "Unable to save PDF."
        });
        dispatch({
          type: "set_panel_message",
          message: `Failed to save ${source === "textbook" ? "textbook" : "guidebook"} PDF.`
        });
      }
    },
    [cachePdfDocument]
  );

  const clearPdf = useCallback(
    async (source: PdfViewerSource) => {
      const key = sourceToStoreKey(source);
      dispatch({ type: "start_doc_load", key });
      try {
        await clearPdfBuffer(key);
        await cachePdfDocument(key, null);
        dispatch({ type: "finish_doc_load", key, exists: false, byteLength: 0, error: null });
        dispatch({
          type: "set_panel_message",
          message: `${source === "textbook" ? "Textbook" : "Guidebook"} PDF cleared.`
        });
      } catch (error) {
        dispatch({
          type: "finish_doc_load",
          key,
          exists: false,
          byteLength: 0,
          error: error instanceof Error ? error.message : "Unable to clear PDF."
        });
        dispatch({
          type: "set_panel_message",
          message: `Failed to clear ${source === "textbook" ? "textbook" : "guidebook"} PDF.`
        });
      }
    },
    [cachePdfDocument]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const key = sourceToStoreKey(state.source);
      const page = clampPage(nextPage, state.docs[key].totalPages || 1);
      dispatch({
        type: "set_doc_view_state",
        key,
        patch: { currentPage: page }
      });
    },
    [state.docs, state.source]
  );

  const goPrevPage = useCallback(() => setPage(activeDoc.currentPage - 1), [activeDoc.currentPage, setPage]);
  const goNextPage = useCallback(() => setPage(activeDoc.currentPage + 1), [activeDoc.currentPage, setPage]);
  const setScale = useCallback(
    (nextScale: number) => {
      const key = sourceToStoreKey(state.source);
      const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Number(nextScale.toFixed(2))));
      dispatch({
        type: "set_doc_view_state",
        key,
        patch: { scale: clamped }
      });
    },
    [state.source]
  );

  const zoomIn = useCallback(() => setScale(activeDoc.scale + SCALE_STEP), [activeDoc.scale, setScale]);
  const zoomOut = useCallback(() => setScale(activeDoc.scale - SCALE_STEP), [activeDoc.scale, setScale]);
  const resetZoom = useCallback(() => setScale(1), [setScale]);
  const setActiveScrollRatios = useCallback(
    (leftRatio: number, topRatio: number) => {
      const key = sourceToStoreKey(sourceRef.current);
      const current = stateDocsRef.current[key];
      const nextLeft = clampRatio(leftRatio);
      const nextTop = clampRatio(topRatio);
      if (
        Math.abs(current.scrollLeftRatio - nextLeft) < 0.001 &&
        Math.abs(current.scrollTopRatio - nextTop) < 0.001
      ) {
        return;
      }
      dispatch({
        type: "set_doc_view_state",
        key,
        patch: {
          scrollLeftRatio: nextLeft,
          scrollTopRatio: nextTop
        }
      });
    },
    []
  );
  const renderActivePage = useCallback(
    async (canvas: HTMLCanvasElement | null) => {
      if (!canvas) {
        return;
      }
      const renderToken = ++renderTokenRef.current;
      const key = sourceToStoreKey(sourceRef.current);
      const docsState = stateDocsRef.current;
      const doc = docsRef.current[key];
      const totalPages = doc?.numPages ?? 1;
      const currentPage = clampPage(docsState[key].currentPage, totalPages);

      if (doc && (docsState[key].totalPages !== totalPages || docsState[key].currentPage !== currentPage)) {
        dispatch({
          type: "set_doc_view_state",
          key,
          patch: {
            totalPages,
            currentPage
          }
        });
      }

      await renderPdfPageToCanvas(doc, currentPage, docsState[key].scale, canvas);
      if (renderToken !== renderTokenRef.current) {
        return;
      }
    },
    []
  );

  return {
    state,
    activeDoc,
    setSource,
    toggleAutoNav,
    uploadPdf,
    clearPdf,
    reloadDocState,
    setPage,
    goPrevPage,
    goNextPage,
    zoomIn,
    zoomOut,
    resetZoom,
    setActiveScrollRatios,
    renderActivePage
  };
}
