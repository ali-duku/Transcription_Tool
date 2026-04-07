import { type PropsWithChildren, useEffect } from "react";
import {
  DEFAULT_THEME,
  normalizeThemePreference,
  resolveInitialThemePreference,
  type ThemePreference
} from "../../shared/constants/appConstants";
import { THEME_STORAGE_KEY } from "../../shared/constants/storageKeys";
import { DocumentStoreProvider } from "../../features/shell/state/documentStore";
import { PdfViewerStoreProvider } from "../../features/pdf/mainViewer/state/pdfViewerStore";
import "./AppProviders.css";

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    const initialTheme = resolveInitialThemePreference();
    applyTheme(initialTheme);
  }, []);

  return (
    <PdfViewerStoreProvider>
      <DocumentStoreProvider>{children}</DocumentStoreProvider>
    </PdfViewerStoreProvider>
  );
}

function applyTheme(theme: ThemePreference) {
  const normalized = normalizeThemePreference(theme);
  document.documentElement.setAttribute("data-theme", normalized);
  document.documentElement.style.colorScheme = normalized;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, normalized);
  } catch {
    // Keep runtime resilient when storage is blocked.
  }
}

export { DEFAULT_THEME };
