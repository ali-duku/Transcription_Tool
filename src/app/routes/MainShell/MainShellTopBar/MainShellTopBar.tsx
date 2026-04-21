import type { InputSubTabKey } from "../../../../shared/types/navigation";
import { AppIcon } from "../../../../shared/ui/AppIcon";
import "./MainShellTopBar.css";

export type QuickJumpKey =
  | InputSubTabKey
  | "final-preview"
  | `content-${number}`
  | `question-${number}`;

export interface QuickJumpOption {
  key: QuickJumpKey;
  label: string;
}

interface MainShellTopBarProps {
  appVersion: string;
  themeMode: "light" | "dark";
  autoResizeEnabled: boolean;
  trailingSpacesEnabled: boolean;
  fontSize: string;
  lineHeight: string;
  canUndo: boolean;
  canRedo: boolean;
  quickJumpOptions: QuickJumpOption[];
  onUndo: () => void;
  onRedo: () => void;
  onFontSizeChange: (value: string) => void;
  onLineHeightChange: (value: string) => void;
  onQuickJump: (key: QuickJumpKey) => void;
  onSave: () => void;
  onReload: () => void;
  onScrollToTop: () => void;
  onToggleTheme: () => void;
  onToggleAutoResize: () => void;
  onToggleTrailingSpaces: () => void;
  onOpenWhatsNew: () => void;
  saveIndicatorLabel: string;
}

const FONT_SIZE_OPTIONS = ["14", "16", "18", "20", "22", "24", "26", "28", "30", "32", "36", "40", "44", "48"];
const LINE_HEIGHT_OPTIONS = ["1.5", "1.8", "2.0", "2.2", "2.5"];

function renderGroupedQuickJumpOptions(options: QuickJumpOption[]) {
  const formSections = options.filter(
    (option) => !option.key.startsWith("content-") && !option.key.startsWith("question-")
  );
  const contentSections = options.filter((option) => option.key.startsWith("content-"));
  const questions = options.filter((option) => option.key.startsWith("question-"));

  return (
    <>
      <optgroup label="Form Sections">
        {formSections.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="Content Sections">
        {contentSections.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="Questions">
        {questions.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </optgroup>
    </>
  );
}

export function MainShellTopBar({
  appVersion,
  themeMode,
  autoResizeEnabled,
  trailingSpacesEnabled,
  fontSize,
  lineHeight,
  canUndo,
  canRedo,
  quickJumpOptions,
  onUndo,
  onRedo,
  onFontSizeChange,
  onLineHeightChange,
  onQuickJump,
  onSave,
  onReload,
  onScrollToTop,
  onToggleTheme,
  onToggleAutoResize,
  onToggleTrailingSpaces,
  onOpenWhatsNew,
  saveIndicatorLabel
}: MainShellTopBarProps) {
  return (
    <div className="topbar-content">
      <div className="header-title-block">
        <h1>Math Textbook Transcription</h1>
        <div className="header-meta">
          <span>v{appVersion}</span>
          <span>&bull;</span>
          <button type="button" className="meta-link-button" onClick={onOpenWhatsNew}>
            What's New
          </button>
          <span>&bull;</span>
          <span>DUKU</span>
        </div>
      </div>

      <div className="topbar-controls">
        <div className="topbar-group">
          <button
            type="button"
            className="topbar-icon-button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            aria-label="Undo"
          >
            <AppIcon name="undo" />
          </button>
          <button
            type="button"
            className="topbar-icon-button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            aria-label="Redo"
          >
            <AppIcon name="redo" />
          </button>
        </div>

        <div className="topbar-group font-controls">
          <label htmlFor="font-size-select">Font</label>
          <select
            id="font-size-select"
            className="control-select compact"
            value={fontSize}
            onChange={(event) => onFontSizeChange(event.target.value)}
          >
            {FONT_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}px
              </option>
            ))}
          </select>
          <label htmlFor="line-height-select">Line</label>
          <select
            id="line-height-select"
            className="control-select compact"
            value={lineHeight}
            onChange={(event) => onLineHeightChange(event.target.value)}
          >
            {LINE_HEIGHT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <span className="save-indicator-text">{saveIndicatorLabel}</span>

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
          <option value="">Quick Jump...</option>
          {renderGroupedQuickJumpOptions(quickJumpOptions)}
        </select>

        <div className="topbar-group">
          <button
            type="button"
            className="topbar-icon-button"
            onClick={onSave}
            title="Save Progress (Ctrl+S)"
            aria-label="Save Progress"
          >
            <AppIcon name="save" />
          </button>
          <button
            type="button"
            className="topbar-icon-button"
            onClick={onReload}
            title="Reload Page"
            aria-label="Reload Page"
          >
            <AppIcon name="reload" />
          </button>
          <button
            type="button"
            className="topbar-icon-button"
            onClick={onScrollToTop}
            title="Scroll to Top"
            aria-label="Scroll to Top"
          >
            <AppIcon name="scrollTop" />
          </button>
          <button
            type="button"
            className="topbar-icon-button"
            onClick={onToggleTheme}
            title={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <AppIcon name={themeMode === "dark" ? "sun" : "moon"} />
          </button>
          <button
            type="button"
            className={`topbar-icon-button${autoResizeEnabled ? " is-enabled" : ""}`}
            onClick={onToggleAutoResize}
            title="Toggle Auto-Resize Textareas"
            aria-label="Toggle Auto-Resize Textareas"
          >
            <AppIcon name="resizeVertical" />
          </button>
          <button
            type="button"
            className={`topbar-icon-button${trailingSpacesEnabled ? " is-enabled" : ""}`}
            onClick={onToggleTrailingSpaces}
            title="Show trailing spaces indicator in preview boxes"
            aria-label="Show trailing spaces indicator in preview boxes"
          >
            <AppIcon name="warning" />
          </button>
        </div>
      </div>
    </div>
  );
}
