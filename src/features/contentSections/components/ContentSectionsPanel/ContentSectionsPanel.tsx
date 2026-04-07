import { useDocumentStore } from "../../../shell/state/documentStore";
import { appendImageReferenceToken } from "../../../../shared/utils/imageReference";
import { PagedBboxListEditor } from "../../../questions/components/QuestionsPanel/PagedBboxListEditor";
import { contentScopedMessages } from "../../../validation/utils/messageScopes";
import type { ContentSectionState } from "../../state/contentSectionsReducer";
import "./ContentSectionsPanel.css";

function updateContentRow(
  row: ContentSectionState,
  patch: Partial<Pick<ContentSectionState, "section_title" | "text" | "images">>
) {
  return {
    section_title: patch.section_title ?? row.section_title,
    text: patch.text ?? row.text,
    images: patch.images ?? row.images
  };
}

export function ContentSectionsPanel() {
  const { history, persistence, applyDocumentAction } = useDocumentStore();
  const rows = history.present.instructional_content;

  function imageCount(row: ContentSectionState): number {
    return Array.isArray(row.images) ? row.images.length : 0;
  }

  return (
    <div className="subtab-form">
      <div className="subtab-header-row">
        <h2>Content Sections</h2>
        <button
          type="button"
          className="tab-button"
          onClick={() => applyDocumentAction({ type: "add_content_section" })}
        >
          Add Section
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="muted-text">No content sections yet. Click "Add Section" to begin.</p>
      ) : (
        rows.map((row, index) => (
          <div key={row.uid} className="array-card" data-content-index={index + 1}>
            {(() => {
              const scopedErrors = contentScopedMessages(persistence.lastValidationErrorSet, index);
              const scopedWarnings = contentScopedMessages(persistence.lastValidationWarningSet, index);
              if (scopedErrors.length === 0 && scopedWarnings.length === 0) {
                return null;
              }
              return (
                <div className="content-validation-summary">
                  {scopedErrors.length > 0 ? (
                    <div className="content-validation-errors">
                      <strong>Errors</strong>
                      <ul>
                        {scopedErrors.map((message, messageIndex) => (
                          <li key={`c-error-${index}-${messageIndex}`}>{message}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {scopedWarnings.length > 0 ? (
                    <div className="content-validation-warnings">
                      <strong>Warnings</strong>
                      <ul>
                        {scopedWarnings.map((message, messageIndex) => (
                          <li key={`c-warning-${index}-${messageIndex}`}>{message}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })()}

            <div className="array-card-header">
              <strong>Section {index + 1}</strong>
              <div className="array-card-actions">
                <button
                  type="button"
                  className="tab-button"
                  onClick={() => applyDocumentAction({ type: "move_content_section", index, direction: "up" })}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="tab-button"
                  onClick={() =>
                    applyDocumentAction({ type: "move_content_section", index, direction: "down" })
                  }
                >
                  Down
                </button>
                <button
                  type="button"
                  className="tab-button"
                  onClick={() => applyDocumentAction({ type: "duplicate_content_section", index })}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="tab-button"
                  onClick={() => applyDocumentAction({ type: "remove_content_section", index })}
                >
                  Remove
                </button>
              </div>
            </div>

            <label className="form-field">
              <span>Section Title</span>
              <input
                data-field="section-title"
                type="text"
                value={row.section_title}
                onChange={(event) =>
                  applyDocumentAction({
                    type: "content",
                    action: {
                      type: "replace",
                      index,
                      payload: updateContentRow(row, { section_title: event.target.value })
                    }
                  })
                }
              />
            </label>

            <label className="form-field">
              <span className="content-field-header">
                <span>Content (Markdown + LaTeX)</span>
                <button
                  type="button"
                  className="tab-button"
                  disabled={imageCount(row) <= 0}
                  onClick={() =>
                    applyDocumentAction({
                      type: "content",
                      action: {
                        type: "replace",
                        index,
                        payload: updateContentRow(row, {
                          text: appendImageReferenceToken(row.text, imageCount(row))
                        })
                      }
                    })
                  }
                >
                  Insert Image Ref
                </button>
              </span>
              <textarea
                data-field="section-text"
                value={row.text}
                onChange={(event) =>
                  applyDocumentAction({
                    type: "content",
                    action: {
                      type: "replace",
                      index,
                      payload: updateContentRow(row, { text: event.target.value })
                    }
                  })
                }
              />
            </label>

            <PagedBboxListEditor
              label="Content Images"
              value={Array.isArray(row.images) ? row.images : null}
              onCommit={(next) =>
                applyDocumentAction({
                  type: "content",
                  action: {
                    type: "replace",
                    index,
                    payload: updateContentRow(row, { images: next ?? [] })
                  }
                })
              }
            />
          </div>
        ))
      )}
    </div>
  );
}
