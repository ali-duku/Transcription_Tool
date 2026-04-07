export type SaveIndicatorStatus = "none" | "unsaved" | "saving" | "saved";

export interface PersistenceState {
  hasUnsavedChanges: boolean;
  lastSavedData: string | null;
  saveInProgress: boolean;
  jsonLoadInProgress: boolean;
  saveIndicatorStatus: SaveIndicatorStatus;
  lastValidationErrorSet: string[] | null;
  lastValidationWarningSet: string[] | null;
  lastValidationWarningTime: number;
}

export type PersistenceAction =
  | { type: "mark_changed" }
  | { type: "start_save" }
  | { type: "save_success"; raw: string }
  | { type: "save_failed" }
  | { type: "set_json_load_in_progress"; value: boolean }
  | { type: "set_validation_errors"; errors: string[] }
  | { type: "set_validation_warnings"; warnings: string[] }
  | { type: "set_validation_warning_time"; timestamp: number }
  | { type: "clear_saved_data" }
  | { type: "reset" };

export function createInitialPersistenceState(): PersistenceState {
  return {
    hasUnsavedChanges: false,
    lastSavedData: null,
    saveInProgress: false,
    jsonLoadInProgress: false,
    saveIndicatorStatus: "none",
    lastValidationErrorSet: null,
    lastValidationWarningSet: null,
    lastValidationWarningTime: 0
  };
}

export function persistenceReducer(state: PersistenceState, action: PersistenceAction): PersistenceState {
  switch (action.type) {
    case "mark_changed":
      if (state.hasUnsavedChanges) {
        return state;
      }
      return {
        ...state,
        hasUnsavedChanges: true,
        saveIndicatorStatus: "unsaved"
      };

    case "start_save":
      return {
        ...state,
        saveInProgress: true,
        saveIndicatorStatus: "saving"
      };

    case "save_success":
      return {
        ...state,
        saveInProgress: false,
        hasUnsavedChanges: false,
        lastSavedData: action.raw,
        saveIndicatorStatus: "saved"
      };

    case "save_failed":
      return {
        ...state,
        saveInProgress: false,
        saveIndicatorStatus: "unsaved"
      };

    case "set_json_load_in_progress":
      return {
        ...state,
        jsonLoadInProgress: action.value
      };

    case "set_validation_errors":
      return {
        ...state,
        lastValidationErrorSet: action.errors
      };

    case "set_validation_warnings":
      return {
        ...state,
        lastValidationWarningSet: action.warnings
      };

    case "set_validation_warning_time":
      return {
        ...state,
        lastValidationWarningTime: action.timestamp
      };

    case "clear_saved_data":
      return {
        ...state,
        hasUnsavedChanges: false,
        lastSavedData: null,
        saveIndicatorStatus: "none"
      };

    case "reset":
      return createInitialPersistenceState();

    default:
      return state;
  }
}
