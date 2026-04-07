import type { TranscriptionDocumentState } from "../../features/shell/state/documentReducer";
import type { SerializableTranscriptionPayload } from "../../shared/types/transcriptionPayload";
import { collectFormDataWithoutValidation } from "./collectFormData";

export interface ValidationSummary {
  errors: string[];
  warnings: string[];
}

export interface GenerateJsonSuccess {
  ok: true;
  payload: SerializableTranscriptionPayload;
  warnings: string[];
}

export interface GenerateJsonFailure {
  ok: false;
  errors: string[];
  warnings: string[];
}

export type GenerateJsonResult = GenerateJsonSuccess | GenerateJsonFailure;

export function generateJsonPayload(
  state: TranscriptionDocumentState,
  validation: ValidationSummary
): GenerateJsonResult {
  if (validation.errors.length > 0) {
    return {
      ok: false,
      errors: validation.errors,
      warnings: validation.warnings
    };
  }

  return {
    ok: true,
    payload: collectFormDataWithoutValidation(state),
    warnings: validation.warnings
  };
}

export function formatJsonWithCompactArrays(value: unknown, indent = 0): string {
  const indentStr = "  ".repeat(indent);
  const nextIndentStr = "  ".repeat(indent + 1);

  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }

    const allPrimitives = value.every(
      (item) =>
        item === null ||
        item === undefined ||
        typeof item === "boolean" ||
        typeof item === "number" ||
        typeof item === "string" ||
        (Array.isArray(item) &&
          item.every(
            (nested) =>
              typeof nested === "number" || typeof nested === "string" || typeof nested === "boolean"
          ))
    );

    if (allPrimitives) {
      const items = value.map((item) => {
        if (Array.isArray(item)) {
          return `[${item.map((nested) => JSON.stringify(nested)).join(", ")}]`;
        }
        return JSON.stringify(item);
      });
      return `[${items.join(", ")}]`;
    }

    const items = value.map((item) => formatJsonWithCompactArrays(item, indent + 1));
    return `[\n${items.map((item) => `${nextIndentStr}${item}`).join(",\n")}\n${indentStr}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return "{}";
    }

    const lines = entries.map(
      ([key, entryValue]) => `${nextIndentStr}"${key}": ${formatJsonWithCompactArrays(entryValue, indent + 1)}`
    );
    return `{\n${lines.join(",\n")}\n${indentStr}}`;
  }

  return JSON.stringify(value);
}
