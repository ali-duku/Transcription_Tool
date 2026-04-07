import type { CanonicalQuestionExport } from "../../../../domain/schema/questionSchemaAdapter";
import { appendImageReferenceToken } from "../../../../shared/utils/imageReference";
import { useDocumentStore } from "../../../shell/state/documentStore";
import { questionScopedMessages } from "../../../validation/utils/messageScopes";
import type { QuestionState } from "../../state/questionsReducer";
import { PagedBboxListEditor } from "./PagedBboxListEditor";
import { QuestionTypeEditor } from "./QuestionTypeEditor";
import { QUESTION_TYPE_OPTIONS } from "./constants";
import {
  appendNextBlankToken,
  normalizeQuestionForType,
  parseIntegerOrNull,
  syncBlankAnswersWithQuestion,
  updateQuestionDraft
} from "./questionPanelUtils";
import "./QuestionsPanel.css";

export function QuestionsPanel() {
  const { history, persistence, applyDocumentAction } = useDocumentStore();
  const rows = history.present.practice_questions;

  function replaceQuestion(index: number, payload: CanonicalQuestionExport) {
    applyDocumentAction({
      type: "questions",
      action: {
        type: "replace",
        index,
        payload
      }
    });
  }

  function updateQuestion(index: number, row: QuestionState, patch: Partial<CanonicalQuestionExport>) {
    const next = updateQuestionDraft(row, patch);
    if (next.question_type === "fill_in_the_blanks" && patch.question !== undefined) {
      next.guide_answer = syncBlankAnswersWithQuestion(next.question, next.guide_answer);
    }
    replaceQuestion(index, next);
  }

  function updateQuestionType(index: number, row: QuestionState, nextType: string) {
    const normalized = normalizeQuestionForType(row.canonical, nextType);
    replaceQuestion(index, normalized);
  }

  function questionImageCount(row: QuestionState): number {
    return Array.isArray(row.canonical.question_images) ? row.canonical.question_images.length : 0;
  }

  function insertQuestionImageRef(index: number, row: QuestionState, field: "question" | "setup_text") {
    const imageCount = questionImageCount(row);
    if (imageCount <= 0) {
      return;
    }
    if (field === "question") {
      updateQuestion(index, row, {
        question: appendImageReferenceToken(row.canonical.question, imageCount)
      });
      return;
    }
    updateQuestion(index, row, {
      setup_text: appendImageReferenceToken(row.canonical.setup_text ?? "", imageCount)
    });
  }

  return (
    <div className="subtab-form">
      <div className="subtab-header-row">
        <h2>Questions</h2>
        <button type="button" className="tab-button" onClick={() => applyDocumentAction({ type: "add_question" })}>
          Add Question
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="muted-text">No questions yet. Click "Add Question" to begin.</p>
      ) : (
        rows.map((row, index) => (
          <div key={row.uid} className="array-card" data-question-index={index + 1}>
            {(() => {
              const scopedErrors = questionScopedMessages(persistence.lastValidationErrorSet, index);
              const scopedWarnings = questionScopedMessages(persistence.lastValidationWarningSet, index);
              if (scopedErrors.length === 0 && scopedWarnings.length === 0) {
                return null;
              }
              return (
                <div className="question-validation-summary">
                  {scopedErrors.length > 0 ? (
                    <div className="question-validation-errors">
                      <strong>Errors</strong>
                      <ul>
                        {scopedErrors.map((message, messageIndex) => (
                          <li key={`q-error-${index}-${messageIndex}`}>{message}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {scopedWarnings.length > 0 ? (
                    <div className="question-validation-warnings">
                      <strong>Warnings</strong>
                      <ul>
                        {scopedWarnings.map((message, messageIndex) => (
                          <li key={`q-warning-${index}-${messageIndex}`}>{message}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })()}

            <div className="array-card-header">
              <strong>Question {index + 1}</strong>
              <div className="array-card-actions">
                <button
                  type="button"
                  className="tab-button"
                  onClick={() => applyDocumentAction({ type: "move_question", index, direction: "up" })}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="tab-button"
                  onClick={() => applyDocumentAction({ type: "move_question", index, direction: "down" })}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="tab-button"
                  onClick={() => applyDocumentAction({ type: "duplicate_question", index })}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="tab-button"
                  onClick={() => applyDocumentAction({ type: "remove_question", index })}
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="form-row-grid">
              <label className="form-field">
                <span>Question ID</span>
                <input
                  data-field="question-id"
                  type="text"
                  value={row.canonical.id}
                  onChange={(event) => updateQuestion(index, row, { id: event.target.value })}
                />
              </label>

              <label className="form-field">
                <span>Question Type</span>
                <select
                  value={row.canonical.question_type}
                  onChange={(event) => updateQuestionType(index, row, event.target.value)}
                >
                  {QUESTION_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Guide PDF Page</span>
                <input
                  data-field="guide-page"
                  type="number"
                  value={row.canonical.guide_pdf_page ?? ""}
                  onChange={(event) =>
                    updateQuestion(index, row, { guide_pdf_page: parseIntegerOrNull(event.target.value) })
                  }
                />
              </label>
            </div>

            <label className="form-field">
              <span className="question-field-header">
                <span>Set-up Text</span>
                <button
                  type="button"
                  className="tab-button"
                  disabled={questionImageCount(row) <= 0}
                  onClick={() => insertQuestionImageRef(index, row, "setup_text")}
                >
                  Insert Image Ref
                </button>
              </span>
              <textarea
                data-field="setup-text"
                value={row.canonical.setup_text ?? ""}
                onChange={(event) => updateQuestion(index, row, { setup_text: event.target.value || null })}
              />
            </label>

            <label className="form-field">
              <span className="question-field-header">
                <span>Question Text</span>
                {row.canonical.question_type === "fill_in_the_blanks" ? (
                  <button
                    type="button"
                    className="tab-button"
                    onClick={() =>
                      updateQuestion(index, row, {
                        question: appendNextBlankToken(row.canonical.question)
                      })
                    }
                  >
                    Add Blank Token
                  </button>
                ) : null}
                <button
                  type="button"
                  className="tab-button"
                  disabled={questionImageCount(row) <= 0}
                  onClick={() => insertQuestionImageRef(index, row, "question")}
                >
                  Insert Image Ref
                </button>
              </span>
              <textarea
                data-field="question-text"
                value={row.canonical.question}
                onChange={(event) => updateQuestion(index, row, { question: event.target.value })}
              />
            </label>

            <PagedBboxListEditor
              label="Question Images"
              value={row.canonical.question_images}
              onCommit={(next) => updateQuestion(index, row, { question_images: next })}
            />

            <QuestionTypeEditor row={row} onChange={(next) => replaceQuestion(index, next)} />
          </div>
        ))
      )}
    </div>
  );
}
