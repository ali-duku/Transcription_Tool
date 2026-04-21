import { AppIcon } from "../../../../../shared/ui/AppIcon";
import "./JsonWorkspacePanel.css";

interface JsonWorkspacePanelProps {
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

function ValidationMessageBlock({
  title,
  messages,
  className,
  onMessageClick
}: {
  title: string;
  messages: string[];
  className: string;
  onMessageClick: (message: string) => void;
}) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className={`validation-block ${className}`}>
      <strong>
        {title} ({messages.length})
      </strong>
      <ul>
        {messages.map((message, index) => (
          <li key={`${title}-${index}`}>
            <button type="button" className="validation-message-button" onClick={() => onMessageClick(message)}>
              {message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JsonWorkspacePanel({
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
}: JsonWorkspacePanelProps) {
  const outputText = jsonOutput.trim().length > 0 ? jsonOutput : "// JSON will be generated here...";

  async function handleCopyJson() {
    if (!jsonOutput.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(jsonOutput);
    } catch {
      // Keep UX silent if clipboard is blocked.
    }
  }

  return (
    <div className="json-workspace">
      <div className="panel-actions-row">
        <button className="tab-button" type="button" onClick={onLoadJson}>
          <AppIcon name="json" />
          <span>Load JSON/Dict</span>
        </button>
        <button className="tab-button" type="button" onClick={onRestoreLatest}>
          <AppIcon name="reload" />
          <span>Restore Latest</span>
        </button>
        <button className="tab-button" type="button" onClick={onClearForm}>
          <AppIcon name="close" />
          <span>Clear Form</span>
        </button>
        <button className="tab-button" type="button" onClick={onClearCurrentSubtab}>
          <AppIcon name="close" />
          <span>Clear Current Subtab</span>
        </button>
        <button className="tab-button" type="button" onClick={onUploadPdfs}>
          <AppIcon name="upload" />
          <span>Upload PDFs</span>
        </button>
      </div>
      <div className="panel-actions-row">
        <button className="tab-button" type="button" onClick={handleCopyJson} disabled={!jsonOutput.trim()}>
          <AppIcon name="copy" />
          <span>Copy JSON</span>
        </button>
        <button
          className="tab-button"
          type="button"
          onClick={onJumpToFirstError}
          disabled={validationErrors.length === 0}
        >
          <AppIcon name="warning" />
          <span>Jump to First Error</span>
        </button>
      </div>
      <textarea
        className="json-textarea"
        placeholder="Paste JSON or Python dict here..."
        value={jsonInput}
        onChange={(event) => onJsonInputChange(event.target.value)}
      />
      <pre className="json-output-box">{outputText}</pre>
      <div className="json-status-row">{jsonStatus}</div>
      <ValidationMessageBlock
        title="Validation Errors"
        messages={validationErrors}
        className="validation-errors-block"
        onMessageClick={onValidationMessageClick}
      />
      <ValidationMessageBlock
        title="Validation Warnings"
        messages={validationWarnings}
        className="validation-warnings-block"
        onMessageClick={onValidationMessageClick}
      />
    </div>
  );
}
