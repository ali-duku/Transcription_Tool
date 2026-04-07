import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  useContext,
  useMemo,
  useReducer
} from "react";
import { createInitialHistoryState, undoReducer, type DocumentHistoryState, type UndoAction } from "../../undo/state/undoReducer";
import type { DocumentAction, TranscriptionDocumentState } from "./documentReducer";
import {
  createInitialPersistenceState,
  persistenceReducer,
  type PersistenceAction,
  type PersistenceState
} from "../../persistence/state/persistenceReducer";
import { useAutoSave } from "../../persistence/hooks/useAutoSave";
import { validateDocumentForSave } from "../../validation/validators/documentValidation";

interface DocumentStoreContextValue {
  history: DocumentHistoryState;
  dispatch: Dispatch<UndoAction>;
  persistence: PersistenceState;
  dispatchPersistence: Dispatch<PersistenceAction>;
  applyDocumentAction: (action: DocumentAction) => void;
  undo: () => void;
  redo: () => void;
  resetHistory: (payload?: TranscriptionDocumentState) => void;
}

const DocumentStoreContext = createContext<DocumentStoreContextValue | null>(null);

export function DocumentStoreProvider({ children }: PropsWithChildren) {
  const [history, dispatch] = useReducer(undoReducer, undefined, () => createInitialHistoryState());
  const [persistence, dispatchPersistence] = useReducer(
    persistenceReducer,
    undefined,
    () => createInitialPersistenceState()
  );
  const saveValidation = useMemo(() => validateDocumentForSave(history.present), [history.present]);

  useAutoSave({
    document: history.present,
    persistence,
    dispatchPersistence,
    validation: saveValidation
  });

  const value = useMemo<DocumentStoreContextValue>(() => {
    return {
      history,
      dispatch,
      persistence,
      dispatchPersistence,
      applyDocumentAction: (action: DocumentAction) => {
        dispatch({ type: "apply", action });
        dispatchPersistence({ type: "mark_changed" });
      },
      undo: () => dispatch({ type: "undo" }),
      redo: () => dispatch({ type: "redo" }),
      resetHistory: (payload?: TranscriptionDocumentState) =>
        dispatch({ type: "reset_history", payload })
    };
  }, [dispatchPersistence, history, persistence]);

  return <DocumentStoreContext.Provider value={value}>{children}</DocumentStoreContext.Provider>;
}

export function useDocumentStore(): DocumentStoreContextValue {
  const context = useContext(DocumentStoreContext);
  if (!context) {
    throw new Error("useDocumentStore must be used within a DocumentStoreProvider.");
  }
  return context;
}
