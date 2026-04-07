import { useEffect, useRef } from "react";
import type { ValidationSummary } from "../../../domain/serializers/generateJson";
import type { TranscriptionDocumentState } from "../../shell/state/documentReducer";
import { saveProgress } from "../services/saveRestoreService";
import type { PersistenceAction, PersistenceState } from "../state/persistenceReducer";

interface UseAutoSaveInput {
  document: TranscriptionDocumentState;
  persistence: PersistenceState;
  dispatchPersistence: (action: PersistenceAction) => void;
  validation: ValidationSummary;
  debounceMs?: number;
}

export function useAutoSave({
  document,
  persistence,
  dispatchPersistence,
  validation,
  debounceMs = 1000
}: UseAutoSaveInput) {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!persistence.hasUnsavedChanges || persistence.saveInProgress) {
      return;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      dispatchPersistence({ type: "start_save" });
      const result = saveProgress(document, validation, { isAutoSave: true });
      if (result.ok) {
        dispatchPersistence({ type: "save_success", raw: result.raw });
      } else {
        dispatchPersistence({ type: "save_failed" });
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [
    debounceMs,
    dispatchPersistence,
    document,
    persistence.hasUnsavedChanges,
    persistence.saveInProgress,
    validation
  ]);
}
