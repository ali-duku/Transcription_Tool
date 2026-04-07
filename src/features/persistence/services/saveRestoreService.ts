import { SAVE_KEY } from "../../../shared/constants/storageKeys";
import { normalizeQuestionKeysOnLoad } from "../../../domain/migration/normalizeIncoming";
import { collectFormDataWithoutValidation } from "../../../domain/serializers/collectFormData";
import type { ValidationSummary } from "../../../domain/serializers/generateJson";
import type { TranscriptionDocumentState } from "../../shell/state/documentReducer";
import type { SerializableTranscriptionPayload } from "../../../shared/types/transcriptionPayload";
import {
  readLocalStorageItem,
  removeLocalStorageItem,
  writeLocalStorageItem
} from "./storageService";

export interface SaveProgressResult {
  ok: boolean;
  payload: SerializableTranscriptionPayload;
  raw: string;
  errors: string[];
  warnings: string[];
  // Save path preserves legacy semantics: validation errors do not block save.
  blocked: false;
}

export interface LoadSavedDataResult {
  ok: boolean;
  payload: SerializableTranscriptionPayload | null;
}

export function saveProgress(
  state: TranscriptionDocumentState,
  validation: ValidationSummary,
  options: { isAutoSave?: boolean } = {}
): SaveProgressResult {
  const payload = collectFormDataWithoutValidation(state, { includeSaveTimestamp: true });
  const raw = JSON.stringify(payload);
  const wrote = writeLocalStorageItem(SAVE_KEY, raw);

  if (!wrote) {
    return {
      ok: false,
      payload,
      raw,
      errors: validation.errors,
      warnings: validation.warnings,
      blocked: false
    };
  }

  // The isAutoSave flag is retained for parity with legacy API.
  void options.isAutoSave;

  return {
    ok: true,
    payload,
    raw,
    errors: validation.errors,
    warnings: validation.warnings,
    blocked: false
  };
}

export function loadSavedData(): LoadSavedDataResult {
  const savedData = readLocalStorageItem(SAVE_KEY);
  if (!savedData) {
    return { ok: true, payload: null };
  }

  try {
    const jsonData = JSON.parse(savedData) as SerializableTranscriptionPayload;
    const normalized = normalizeQuestionKeysOnLoad(jsonData);
    return { ok: true, payload: normalized as SerializableTranscriptionPayload };
  } catch {
    return { ok: false, payload: null };
  }
}

export function clearSavedData(): boolean {
  return removeLocalStorageItem(SAVE_KEY);
}

export function restoreLatest(): LoadSavedDataResult {
  return loadSavedData();
}
