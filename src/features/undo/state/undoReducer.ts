import { MAX_HISTORY_SIZE } from "../../../shared/constants/appConstants";
import {
  createInitialDocumentState,
  documentReducer,
  type DocumentAction,
  type TranscriptionDocumentState
} from "../../shell/state/documentReducer";

export interface DocumentHistoryState {
  present: TranscriptionDocumentState;
  past: TranscriptionDocumentState[];
  future: TranscriptionDocumentState[];
}

export type UndoAction =
  | { type: "apply"; action: DocumentAction }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset_history"; payload?: TranscriptionDocumentState };

export function createInitialHistoryState(
  initialDocument: TranscriptionDocumentState = createInitialDocumentState()
): DocumentHistoryState {
  return {
    present: initialDocument,
    past: [],
    future: []
  };
}

function pushBoundedPast(
  past: TranscriptionDocumentState[],
  entry: TranscriptionDocumentState
): TranscriptionDocumentState[] {
  const next = [...past, entry];
  if (next.length <= MAX_HISTORY_SIZE) {
    return next;
  }
  return next.slice(next.length - MAX_HISTORY_SIZE);
}

export function undoReducer(state: DocumentHistoryState, action: UndoAction): DocumentHistoryState {
  switch (action.type) {
    case "apply": {
      const nextPresent = documentReducer(state.present, action.action);
      if (nextPresent === state.present) {
        return state;
      }

      return {
        present: nextPresent,
        past: pushBoundedPast(state.past, state.present),
        future: []
      };
    }

    case "undo": {
      if (state.past.length === 0) {
        return state;
      }

      const previous = state.past[state.past.length - 1];
      const nextPast = state.past.slice(0, -1);
      return {
        present: previous,
        past: nextPast,
        future: [state.present, ...state.future]
      };
    }

    case "redo": {
      if (state.future.length === 0) {
        return state;
      }

      const [next, ...remainingFuture] = state.future;
      return {
        present: next,
        past: pushBoundedPast(state.past, state.present),
        future: remainingFuture
      };
    }

    case "reset_history":
      return createInitialHistoryState(action.payload ?? createInitialDocumentState());

    default:
      return state;
  }
}
