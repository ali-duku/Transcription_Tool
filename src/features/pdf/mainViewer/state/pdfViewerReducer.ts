import { PDF_AUTO_NAV_ENABLED_KEY } from "../../../../shared/constants/storageKeys";
import { readLocalStorageItem } from "../../../persistence/services/storageService";

export type PdfViewerSource = "textbook" | "guide";
export type PdfStoreKey = "text" | "guide";

export interface StoredPdfState {
  exists: boolean;
  byteLength: number;
  updatedAt: number | null;
  currentPage: number;
  totalPages: number;
  scale: number;
  scrollLeftRatio: number;
  scrollTopRatio: number;
  loading: boolean;
  error: string | null;
}

export interface PdfViewerState {
  source: PdfViewerSource;
  autoNavEnabled: boolean;
  docs: Record<PdfStoreKey, StoredPdfState>;
  panelMessage: string;
}

export type PdfViewerAction =
  | { type: "set_source"; source: PdfViewerSource }
  | { type: "set_auto_nav"; enabled: boolean }
  | { type: "start_doc_load"; key: PdfStoreKey }
  | { type: "finish_doc_load"; key: PdfStoreKey; exists: boolean; byteLength: number; error: string | null }
  | {
      type: "set_doc_view_state";
      key: PdfStoreKey;
      patch: Partial<Pick<StoredPdfState, "currentPage" | "totalPages" | "scale" | "scrollLeftRatio" | "scrollTopRatio">>;
    }
  | { type: "set_panel_message"; message: string };

export function sourceToStoreKey(source: PdfViewerSource): PdfStoreKey {
  return source === "textbook" ? "text" : "guide";
}

function createStoredPdfState(): StoredPdfState {
  return {
    exists: false,
    byteLength: 0,
    updatedAt: null,
    currentPage: 1,
    totalPages: 0,
    scale: 1,
    scrollLeftRatio: 0,
    scrollTopRatio: 0,
    loading: false,
    error: null
  };
}

function readAutoNavPreference(): boolean {
  return readLocalStorageItem(PDF_AUTO_NAV_ENABLED_KEY) === "true";
}

export function createInitialPdfViewerState(): PdfViewerState {
  return {
    source: "textbook",
    autoNavEnabled: readAutoNavPreference(),
    docs: {
      text: createStoredPdfState(),
      guide: createStoredPdfState()
    },
    panelMessage: ""
  };
}

function updateDocState(
  state: PdfViewerState,
  key: PdfStoreKey,
  patch: Partial<StoredPdfState>
): PdfViewerState {
  return {
    ...state,
    docs: {
      ...state.docs,
      [key]: {
        ...state.docs[key],
        ...patch
      }
    }
  };
}

export function pdfViewerReducer(state: PdfViewerState, action: PdfViewerAction): PdfViewerState {
  switch (action.type) {
    case "set_source":
      return {
        ...state,
        source: action.source
      };

    case "set_auto_nav":
      return {
        ...state,
        autoNavEnabled: action.enabled
      };

    case "start_doc_load":
      return updateDocState(state, action.key, {
        loading: true,
        error: null
      });

    case "finish_doc_load":
      return updateDocState(state, action.key, {
        loading: false,
        exists: action.exists,
        byteLength: action.byteLength,
        currentPage: 1,
        totalPages: action.exists ? 1 : 0,
        scale: 1,
        scrollLeftRatio: 0,
        scrollTopRatio: 0,
        updatedAt: Date.now(),
        error: action.error
      });

    case "set_doc_view_state":
      return updateDocState(state, action.key, action.patch);

    case "set_panel_message":
      return {
        ...state,
        panelMessage: action.message
      };

    default:
      return state;
  }
}
