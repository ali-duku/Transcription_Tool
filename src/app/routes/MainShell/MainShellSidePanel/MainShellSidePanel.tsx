import { Suspense, lazy, useEffect, useState } from "react";
import type { SidePanelKey } from "../../../../shared/types/navigation";
import { JsonWorkspacePanel } from "./JsonWorkspacePanel";
import { PanelHeader } from "./PanelHeader";
import "./MainShellSidePanel.css";

const LazyPdfViewerPanel = lazy(async () => {
  const module = await import("../../../../features/pdf/mainViewer/components/PdfViewerPanel");
  return { default: module.PdfViewerPanel };
});

interface MainShellSidePanelProps {
  activeSidePanel: SidePanelKey;
  onSidePanelChange: (panel: SidePanelKey) => void;
  onGenerateJson: () => void;
  onLoadJson: () => void;
  onRestoreLatest: () => void;
  onClearForm: () => void;
  onClearCurrentSubtab: () => void;
  onUploadPdfs: () => void;
  onJumpToFirstError: () => void;
  onValidationMessageClick: (message: string) => void;
  jsonInput: string;
  jsonOutput: string;
  jsonStatus: string;
  validationErrors: string[];
  validationWarnings: string[];
  onJsonInputChange: (value: string) => void;
}

export function MainShellSidePanel({
  activeSidePanel,
  onSidePanelChange,
  onGenerateJson,
  onLoadJson,
  onRestoreLatest,
  onClearForm,
  onClearCurrentSubtab,
  onUploadPdfs,
  onJumpToFirstError,
  onValidationMessageClick,
  jsonInput,
  jsonOutput,
  jsonStatus,
  validationErrors,
  validationWarnings,
  onJsonInputChange
}: MainShellSidePanelProps) {
  const [hasOpenedPdfPanel, setHasOpenedPdfPanel] = useState(activeSidePanel === "pdf-viewer");

  useEffect(() => {
    if (activeSidePanel === "pdf-viewer") {
      setHasOpenedPdfPanel(true);
    }
  }, [activeSidePanel]);

  return (
    <div className="side-panel">
      <PanelHeader
        activeSidePanel={activeSidePanel}
        onSidePanelChange={onSidePanelChange}
        onGenerateJson={onGenerateJson}
      />

      <div className="panel-body">
        <div className="panel-content panel-content-json" hidden={activeSidePanel !== "json-preview"}>
          <JsonWorkspacePanel
            onLoadJson={onLoadJson}
            onRestoreLatest={onRestoreLatest}
            onClearForm={onClearForm}
            onClearCurrentSubtab={onClearCurrentSubtab}
            onUploadPdfs={onUploadPdfs}
            onJumpToFirstError={onJumpToFirstError}
            onValidationMessageClick={onValidationMessageClick}
            jsonInput={jsonInput}
            jsonOutput={jsonOutput}
            jsonStatus={jsonStatus}
            validationErrors={validationErrors}
            validationWarnings={validationWarnings}
            onJsonInputChange={onJsonInputChange}
          />
        </div>

        <div className="panel-content panel-content-pdf" hidden={activeSidePanel !== "pdf-viewer"}>
          {hasOpenedPdfPanel ? (
            <Suspense
              fallback={
                <div className="placeholder-box">
                  <p>Loading PDF viewer...</p>
                </div>
              }
            >
              <LazyPdfViewerPanel />
            </Suspense>
          ) : (
            <div className="placeholder-box">
              <p>Open PDF Viewer to initialize the panel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
