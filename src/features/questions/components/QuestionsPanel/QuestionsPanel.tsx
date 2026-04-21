import { useState } from "react";
import type { CanonicalQuestionExport } from "../../../../domain/schema/questionSchemaAdapter";
import { LiveFieldPreview } from "../../../preview/components/LiveFieldPreview";
import { useDocumentStore } from "../../../shell/state/documentStore";
import { questionScopedMessages } from "../../../validation/utils/messageScopes";
import type { QuestionState } from "../../state/questionsReducer";
import { PagedBboxListEditor } from "./PagedBboxListEditor";
import { QuestionValidationSummary } from "./QuestionValidationSummary";
import { QuestionTypeEditor } from "./QuestionTypeEditor";
import { QUESTION_TYPE_OPTIONS } from "./constants";
import {
  appendNextBlankToken,
  normalizeQuestionForType,
  parseIntegerOrNull,
  syncBlankAnswersWithQuestion,
  updateQuestionDraft
} from "./questionPanelUtils";
import {
  buildQuestionImageInsertPatch,
  buildQuestionImageRefPatch,
  questionImageCount
} from "./questionPanelImageActions";
import "./QuestionsPanel.css";

export function QuestionsPanel() {
  const { history, persistence, applyDocumentAction } = useDocumentStore();
  const rows = history.present.practice_questions;
  const [copiedQuestion, setCopiedQuestion] = useState<CanonicalQuestionExport | null>(null);

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

  function insertQuestionImageRef(index: number, row: QuestionState, field: "question" | "setup_text") {
    const patch = buildQuestionImageRefPatch(row, field);
    if (!patch) {
      return;
    }
    updateQuestion(index, row, patch);
  }

  function insertQuestionImage(index: number, row: QuestionState, field: "question" | "setup_text") {
    const description = window.prompt("Enter image description:");
    if (description === null) {
      return;
    }
    const patch = buildQuestionImageInsertPatch(row, field, description, history.present.textbook_pdf_page);
    updateQuestion(index, row, patch);
  }

  return (
    <div className="subtab-form">
      <div className="subtab-header-row">
        <h2>Questions</h2>
        <div className="array-card-actions">
          <button type="button" className="tab-button" onClick={() => applyDocumentAction({ type: "add_question" })}>
            Add Question
          </button>
          <button
            type="button"
            className="tab-button"
            disabled={!copiedQuestion}
            onClick={() => copiedQuestion && applyDocumentAction({ type: "add_question", payload: copiedQuestion })}
          >
            Paste Question
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="muted-text">No questions yet. Click "Add Question" to begin.</p>
      ) : (
        rows.map((row, index) => (
          <div key={row.uid} className="array-card" data-question-index={index + 1}>
            <QuestionValidationSummary
              errors={questionScopedMessages(persistence.lastValidationErrorSet, index)}
              warnings={questionScopedMessages(persistence.lastValidationWarningSet, index)}
            />

            <div className="array-card-header">
              <strong>Question {index + 1}</strong>
              <div className="array-card-actions">
                <button
                  type="button"
                  className="tab-button"
                  onClick={() => applyDocumentAction({ type: "add_question", index })}
                >
                  Before
                </button>
                <button
                  type="button"
                  className="tab-button"
                  onClick={() => applyDocumentAction({ type: "add_question", index: index + 1 })}
                >
                  After
                </button>
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
                  onClick={() => setCopiedQuestion(row.canonical)}
                >
                  Copy
                </button>
                <button
                  type="button"
                  className="tab-button"
                  disabled={!copiedQuestion}
                  onClick={() =>
                    copiedQuestion &&
                    applyDocumentAction({
                      type: "paste_question",
                      index,
                      mode: "replace",
                      payload: copiedQuestion
                    })
                  }
                >
                  Paste Replace
                </button>
                <button
                  type="button"
                  className="tab-button"
                  disabled={!copiedQuestion}
                  onClick={() =>
                    copiedQuestion &&
                    applyDocumentAction({
                      type: "paste_question",
                      index,
                      mode: "insert_after",
                      payload: copiedQuestion
                    })
                  }
                >
                  Paste After
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
                  onClick={() => insertQuestionImage(index, row, "setup_text")}
                >
                  Insert Image
                </button>
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
              <LiveFieldPreview text={row.canonical.setup_text ?? ""} images={row.canonical.question_images} />
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
                  onClick={() => insertQuestionImage(index, row, "question")}
                >
                  Insert Image
                </button>
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
              <LiveFieldPreview text={row.canonical.question} images={row.canonical.question_images} />
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
