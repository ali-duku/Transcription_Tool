import type { SidePanelKey } from "../../../../../shared/types/navigation";
import "./PanelHeader.css";

interface PanelHeaderProps {
  activeSidePanel: SidePanelKey;
  onSidePanelChange: (panel: SidePanelKey) => void;
  onGenerateJson: () => void;
}

export function PanelHeader({
  activeSidePanel,
  onSidePanelChange,
  onGenerateJson
}: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <div className="panel-toggle-group">
        <button
          type="button"
          className={`tab-button${activeSidePanel === "json-preview" ? " active" : ""}`}
          onClick={() => onSidePanelChange("json-preview")}
        >
          JSON Preview
        </button>
        <button
          type="button"
          className={`tab-button${activeSidePanel === "pdf-viewer" ? " active" : ""}`}
          onClick={() => onSidePanelChange("pdf-viewer")}
        >
          PDF Viewer
        </button>
      </div>
      <button className="primary-button" type="button" onClick={onGenerateJson}>
        Generate JSON
      </button>
    </div>
  );
}
