import { THEME_STORAGE_KEY } from "./storageKeys";

export const APP_VERSION = "8.2";
export const QUESTION_SCHEMA_MIGRATION_PHASE: "global_scaffold" | "canonical_output" =
  "canonical_output";
export const DEFAULT_THEME = "dark" as const;
export const ENABLE_REPEATED_QUESTION_ID_VALIDATION = false;
export const MAX_HISTORY_SIZE = 100;

export const FINAL_PREVIEW_GROUP_ORDER = [
  "Book Metadata",
  "Unit Preamble",
  "Lesson Preamble",
  "Basic Info",
  "Content Sections",
  "Questions"
] as const;

export type ThemePreference = "light" | "dark";

export function normalizeThemePreference(theme: unknown): ThemePreference {
  return theme === "light" ? "light" : "dark";
}

export function readStoredThemePreference(): ThemePreference | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    return null;
  } catch {
    return null;
  }
}

export function getSystemThemePreference(): ThemePreference {
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches
  ) {
    return "light";
  }
  return DEFAULT_THEME;
}

export function resolveInitialThemePreference(): ThemePreference {
  const stored = readStoredThemePreference();
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return getSystemThemePreference();
}
