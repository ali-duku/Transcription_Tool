import {
  AUTO_RESIZE_ENABLED_KEY,
  FONT_SIZE_KEY,
  LINE_HEIGHT_KEY,
  THEME_STORAGE_KEY,
  TRAILING_SPACES_INDICATOR_KEY
} from "../../../../shared/constants/storageKeys";

export const DEFAULT_FONT_SIZE = "14";
export const DEFAULT_LINE_HEIGHT = "1.5";

function readStoredValue(key: string, fallback: string): string {
  try {
    const value = localStorage.getItem(key);
    return value && value.trim().length > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

function saveStoredValue(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Keep UX resilient when storage is unavailable.
  }
}

export function readInitialFontSize(): string {
  return readStoredValue(FONT_SIZE_KEY, DEFAULT_FONT_SIZE);
}

export function readInitialLineHeight(): string {
  return readStoredValue(LINE_HEIGHT_KEY, DEFAULT_LINE_HEIGHT);
}

export function readInitialAutoResizeEnabled(): boolean {
  return readStoredValue(AUTO_RESIZE_ENABLED_KEY, "true") === "true";
}

export function readInitialTrailingSpacesEnabled(): boolean {
  return readStoredValue(TRAILING_SPACES_INDICATOR_KEY, "false") === "true";
}

export function readInitialThemeMode(): "light" | "dark" {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // Keep fallback path stable when storage is blocked.
  }
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function persistFontSize(value: string) {
  saveStoredValue(FONT_SIZE_KEY, value);
}

export function persistLineHeight(value: string) {
  saveStoredValue(LINE_HEIGHT_KEY, value);
}

export function persistAutoResizeEnabled(enabled: boolean) {
  saveStoredValue(AUTO_RESIZE_ENABLED_KEY, enabled ? "true" : "false");
}

export function persistTrailingSpacesEnabled(enabled: boolean) {
  saveStoredValue(TRAILING_SPACES_INDICATOR_KEY, enabled ? "true" : "false");
}

export function applyTypographyCssVars(fontSize: string, lineHeight: string) {
  const root = document.documentElement;
  root.style.setProperty("--app-font-size", `${fontSize}px`);
  root.style.setProperty("--app-line-height", lineHeight);
}

export function applyTrailingSpacesAttribute(enabled: boolean) {
  const root = document.documentElement;
  root.setAttribute("data-show-trailing-spaces", enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent("transcription:trailing-spaces-change"));
}
