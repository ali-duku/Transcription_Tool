import type { CanonicalQuestionExport } from "../../../../../domain/schema/questionSchemaAdapter";
import type { InputScrollTarget } from "../../../../../shared/types/navigation";
import { questionTypeLabel } from "../previewQuestionUtils";
import { RichTextPreview } from "../RichTextPreview";
import { PreviewSectionHeading } from "./PreviewSectionHeading";
import {
  renderFillInTheBlanksSection,
  renderManualGuideAnswerSection,
  renderMatchingSection,
  renderOptionsSection
} from "./questionPreviewCardSections";
import "./QuestionPreviewCard.css";

interface QuestionPreviewCardProps {
  question: CanonicalQuestionExport;
  index: number;
  onNavigateToInput?: (target: InputScrollTarget) => void;
}

export function QuestionPreviewCard({ question, index, onNavigateToInput }: QuestionPreviewCardProps) {
  const questionLabel = question.id && question.id.trim().length > 0 ? `Question ${question.id}` : `Question ${index + 1}`;

  return (
    <li className="question-preview-card">
      <div className="preview-item-header">
        <strong>{questionLabel}</strong>
        <span className="preview-question-type-badge">{questionTypeLabel(question.question_type)}</span>
        {onNavigateToInput ? (
          <button
            type="button"
            className="preview-jump-button"
            onClick={() =>
              onNavigateToInput({
                subTab: "questions",
                questionIndex: index + 1,
                fieldSelector: `[data-field="question-text"]`
              })
            }
          >
            Edit Question
          </button>
        ) : null}
      </div>

      <div className="preview-guide-page-row">
        <span>Guide PDF Page: {question.guide_pdf_page ?? "(not set)"}</span>
        {onNavigateToInput ? (
          <button
            type="button"
            className="preview-jump-button preview-jump-button-inline"
            onClick={() =>
              onNavigateToInput({
                subTab: "questions",
                questionIndex: index + 1,
                fieldSelector: `[data-field="guide-page"]`
              })
            }
          >
            Edit
          </button>
        ) : null}
      </div>

      {question.setup_text && question.setup_text.trim().length > 0 ? (
        <>
          <PreviewSectionHeading
            label="Setup Text"
            onEdit={
              onNavigateToInput
                ? () =>
                    onNavigateToInput({
                      subTab: "questions",
                      questionIndex: index + 1,
                      fieldSelector: `[data-field="setup-text"]`
                    })
                : undefined
            }
          />
          <RichTextPreview text={question.setup_text} images={question.question_images} emptyPlaceholder="(none)" />
        </>
      ) : null}

      {question.question.length > 0 ? (
        <>
          <PreviewSectionHeading
            label="Question Text"
            onEdit={
              onNavigateToInput
                ? () =>
                    onNavigateToInput({
                      subTab: "questions",
                      questionIndex: index + 1,
                      fieldSelector: `[data-field="question-text"]`
                    })
                : undefined
            }
          />
          <RichTextPreview text={question.question} images={question.question_images} emptyPlaceholder="(none)" />
        </>
      ) : null}

      {renderOptionsSection(question, index, onNavigateToInput)}
      {renderFillInTheBlanksSection(question, index, onNavigateToInput)}
      {renderMatchingSection(question, index, onNavigateToInput)}
      {renderManualGuideAnswerSection(question, index, onNavigateToInput)}
    </li>
  );
}
