import "./JsonWorkspacePanel.css";

interface JsonWorkspacePanelProps {
  onLoadJson: () => void;
  onRestoreLatest: () => void;
  onClearSavedData: () => void;
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
  onClearSavedData,
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

  return (
    <div className="json-workspace">
      <div className="panel-actions-row">
        <button className="tab-button" type="button" onClick={onLoadJson}>
          Load JSON/Dict
        </button>
        <button className="tab-button" type="button" onClick={onRestoreLatest}>
          Restore Latest
        </button>
        <button className="tab-button" type="button" onClick={onClearSavedData}>
          Clear Saved
        </button>
        <button
          className="tab-button"
          type="button"
          onClick={onJumpToFirstError}
          disabled={validationErrors.length === 0}
        >
          Jump to First Error
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
