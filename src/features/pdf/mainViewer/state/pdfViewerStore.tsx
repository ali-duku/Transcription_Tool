import { createContext, type PropsWithChildren, useContext } from "react";
import { usePdfViewerPanelState } from "../hooks/usePdfViewerPanelState";

type PdfViewerStoreValue = ReturnType<typeof usePdfViewerPanelState>;

const PdfViewerStoreContext = createContext<PdfViewerStoreValue | null>(null);

export function PdfViewerStoreProvider({ children }: PropsWithChildren) {
  const value = usePdfViewerPanelState();
  return <PdfViewerStoreContext.Provider value={value}>{children}</PdfViewerStoreContext.Provider>;
}

export function usePdfViewerStore(): PdfViewerStoreValue {
  const context = useContext(PdfViewerStoreContext);
  if (!context) {
    throw new Error("usePdfViewerStore must be used within PdfViewerStoreProvider.");
  }
  return context;
}
