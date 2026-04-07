import type { InputSubTabKey } from "../../../../shared/types/navigation";
import "./MainShellTopBar.css";

export type QuickJumpKey = InputSubTabKey | "final-preview";

export interface QuickJumpOption {
  key: QuickJumpKey;
  label: string;
}

interface MainShellTopBarProps {
  appVersion: string;
  contentCount: number;
  questionCount: number;
  canUndo: boolean;
  canRedo: boolean;
  quickJumpOptions: QuickJumpOption[];
  onUndo: () => void;
  onRedo: () => void;
  onQuickJump: (key: QuickJumpKey) => void;
  onSave: () => void;
  saveIndicatorLabel: string;
}

export function MainShellTopBar({
  appVersion,
  contentCount,
  questionCount,
  canUndo,
  canRedo,
  quickJumpOptions,
  onUndo,
  onRedo,
  onQuickJump,
  onSave,
  saveIndicatorLabel
}: MainShellTopBarProps) {
  return (
    <div className="topbar-content">
      <div className="header-title-block">
        <h1>Math Textbook Transcription</h1>
        <div className="header-meta">
          v{appVersion} | Content: {contentCount} | Questions: {questionCount}
        </div>
      </div>

      <div className="topbar-controls">
        <button type="button" className="tab-button" onClick={onUndo} disabled={!canUndo} title="Undo">
          Undo
        </button>
        <button type="button" className="tab-button" onClick={onRedo} disabled={!canRedo} title="Redo">
          Redo
        </button>

        <label className="field-label" htmlFor="quick-jump-select">
          Quick Jump
        </label>
        <select
          id="quick-jump-select"
          className="control-select"
          onChange={(event) => {
            const value = event.target.value as QuickJumpKey | "";
            if (!value) return;
            onQuickJump(value);
          }}
          defaultValue=""
        >
          <option value="">Jump to...</option>
          {quickJumpOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>

        <button type="button" className="tab-button" onClick={onSave}>
          Save
        </button>
        <span className="save-indicator-text">{saveIndicatorLabel}</span>
      </div>
    </div>
  );
}
