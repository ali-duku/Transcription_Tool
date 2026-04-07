import { useMemo } from "react";
import { collectFormDataWithoutValidation } from "../../../../domain/serializers/collectFormData";
import type { SerializableTranscriptionPayload } from "../../../../shared/types/transcriptionPayload";
import type { InputScrollTarget } from "../../../../shared/types/navigation";
import type { TranscriptionDocumentState } from "../../../shell/state/documentReducer";
import { FinalPreviewMetadataSections } from "./FinalPreviewMetadataSections";
import { QuestionPreviewCard } from "./QuestionPreviewCard";
import { RichTextPreview } from "./RichTextPreview";
import "./FinalPreviewPanel.css";
interface FinalPreviewPanelProps {
  document: TranscriptionDocumentState;
  onNavigateToInput?: (target: InputScrollTarget) => void;
}

function hasAnyNonEmptyString(values: Array<string | null | undefined>): boolean {
  return values.some((value) => (value ?? "").trim().length > 0);
}

function hasBookMetadata(payload: SerializableTranscriptionPayload): boolean {
  const value = payload.book_title_page;
  return (
    value !== null &&
    hasAnyNonEmptyString([
      value.title,
      value.subtitle,
      value.version,
      value.lang,
      value.subject,
      String(value.grade ?? ""),
      String(value.semester ?? "")
    ])
  );
}

function hasUnitPreamble(payload: SerializableTranscriptionPayload): boolean {
  const value = payload.unit_preamble;
  return (
    value !== null &&
    hasAnyNonEmptyString([value.id, value.title, value.title_translation, value.text])
  );
}

function hasLessonPreamble(payload: SerializableTranscriptionPayload): boolean {
  const value = payload.lesson_preamble;
  if (!value) {
    return false;
  }
  const lessonStandards = Array.isArray(value.lesson_standards)
    ? value.lesson_standards.filter((item) => item.trim().length > 0)
    : [];
  const terminology = Array.isArray(value.terminology)
    ? value.terminology.filter((item) => item.trim().length > 0)
    : [];
  return (
    hasAnyNonEmptyString([value.id, value.title, value.title_translation, value.text]) ||
    lessonStandards.length > 0 ||
    terminology.length > 0
  );
}

function hasBasicInfo(payload: SerializableTranscriptionPayload): boolean {
  return (
    payload.textbook_page !== null ||
    payload.textbook_pdf_page !== null ||
    payload.page_type !== null ||
    payload.guidebook_pdf_pages !== null
  );
}

function PreviewCardHeading({
  title,
  target,
  onNavigateToInput
}: {
  title: string;
  target?: InputScrollTarget;
  onNavigateToInput?: (target: InputScrollTarget) => void;
}) {
  return (
    <div className="preview-card-header">
      <h3>{title}</h3>
      {target && onNavigateToInput ? (
        <button type="button" className="preview-jump-button" onClick={() => onNavigateToInput(target)}>
          Edit in Form
        </button>
      ) : null}
    </div>
  );
}
export function FinalPreviewPanel({ document, onNavigateToInput }: FinalPreviewPanelProps) {
  const payload = useMemo(() => collectFormDataWithoutValidation(document), [document]);
  const showBookMetadata = hasBookMetadata(payload);
  const showUnitPreamble = hasUnitPreamble(payload);
  const showLessonPreamble = hasLessonPreamble(payload);
  const showBasicInfo = hasBasicInfo(payload);
  const showContentSections = payload.instructional_content.length > 0;
  const showQuestions = payload.practice_questions.length > 0;
  const hasAnyPreviewContent =
    showBookMetadata ||
    showUnitPreamble ||
    showLessonPreamble ||
    showBasicInfo ||
    showContentSections ||
    showQuestions;

  return (
    <div className="final-preview-panel">
      <div className="final-preview-header">
        <h2>Final Preview</h2>
        <p>Live canonical snapshot of the current transcription state.</p>
      </div>
      {showBookMetadata || showUnitPreamble || showLessonPreamble ? (
        <FinalPreviewMetadataSections payload={payload} onNavigateToInput={onNavigateToInput} />
      ) : null}
      {showBasicInfo ? (
        <section className="preview-card">
          <PreviewCardHeading
            title="Basic Info"
            target={{ subTab: "basic", fieldSelector: `[data-field="basic-textbook-page"]` }}
            onNavigateToInput={onNavigateToInput}
          />
          <ul>
            {payload.textbook_page !== null ? <li>Textbook Page Number: {payload.textbook_page}</li> : null}
            {payload.textbook_pdf_page !== null ? <li>PDF Page Number: {payload.textbook_pdf_page}</li> : null}
            {payload.guidebook_pdf_pages ? (
              <li>Guidebook PDF Pages (Start - End): {payload.guidebook_pdf_pages[0]} - {payload.guidebook_pdf_pages[1]}</li>
            ) : null}
            {payload.page_type !== null ? <li>Page Type: {payload.page_type}</li> : null}
          </ul>
        </section>
      ) : null}
      {showContentSections ? (
        <section className="preview-card">
          <PreviewCardHeading
            title="Content Sections"
            target={{ subTab: "content" }}
            onNavigateToInput={onNavigateToInput}
          />
          <ol>
            {payload.instructional_content.map((section, index) => (
              <li key={`section-${index}`}>
                <div className="preview-item-header">
                  <strong>{section.section_title || "(Untitled Section)"}</strong>
                  {onNavigateToInput ? (
                    <button
                      type="button"
                      className="preview-jump-button"
                      onClick={() =>
                        onNavigateToInput({
                          subTab: "content",
                          contentIndex: index + 1,
                          fieldSelector: `[data-field="section-title"]`
                        })
                      }
                    >
                      Edit Section
                    </button>
                  ) : null}
                </div>
                <RichTextPreview text={section.text} images={section.images} emptyPlaceholder="(Empty text)" />
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {showQuestions ? (
        <section className="preview-card">
          <PreviewCardHeading
            title="Questions"
            target={{ subTab: "questions" }}
            onNavigateToInput={onNavigateToInput}
          />
          <ol>
            {payload.practice_questions.map((question, index) => (
              <QuestionPreviewCard
                key={`question-${index}`}
                question={question}
                index={index}
                onNavigateToInput={onNavigateToInput}
              />
            ))}
          </ol>
        </section>
      ) : null}
      {!hasAnyPreviewContent ? (
        <section className="preview-card">
          <p className="preview-muted">
            No content sections or questions to preview. Add some content in the Input Form tab.
          </p>
        </section>
      ) : null}
    </div>
  );
}
