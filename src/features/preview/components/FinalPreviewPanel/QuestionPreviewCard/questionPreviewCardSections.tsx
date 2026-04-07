import type { CanonicalQuestionExport } from "../../../../../domain/schema/questionSchemaAdapter";
import type { InputScrollTarget } from "../../../../../shared/types/navigation";
import {
  parseMatchingRelationships,
  questionAnswerSummary,
  splitMatchingOptions,
  usesManualGuideAnswerInput
} from "../previewQuestionUtils";
import { RichTextPreview } from "../RichTextPreview";
import { PreviewSectionHeading } from "./PreviewSectionHeading";
import "./questionPreviewCardSections.css";
export {
  renderFillInTheBlanksSection,
  renderOptionsSection
} from "./questionPreviewCardChoiceFitbSections";

export function renderMatchingSection(
  question: CanonicalQuestionExport,
  index: number,
  onNavigateToInput?: (target: InputScrollTarget) => void
) {
  if (question.question_type !== "matching") {
    return null;
  }
  const split = splitMatchingOptions(question.options);
  const relationships = parseMatchingRelationships(question);

  return (
    <div className="preview-question-meta">
      {split.left.length > 0 ? (
        <>
          <PreviewSectionHeading
            label="Left Items"
            onEdit={
              onNavigateToInput
                ? () =>
                    onNavigateToInput({
                      subTab: "questions",
                      questionIndex: index + 1,
                      fieldSelector: `[data-field="matching-left"]`
                    })
                : undefined
            }
          />
          <ul>
            {split.left.map((item, itemIndex) => (
              <li key={`matching-left-${itemIndex}`}>
                <div className="preview-matching-item-label">L{itemIndex + 1}</div>
                <RichTextPreview text={item} images={question.question_images} emptyPlaceholder="(empty)" />
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {split.right.length > 0 ? (
        <>
          <PreviewSectionHeading
            label="Right Items"
            onEdit={
              onNavigateToInput
                ? () =>
                    onNavigateToInput({
                      subTab: "questions",
                      questionIndex: index + 1,
                      fieldSelector: `[data-field="matching-right"]`
                    })
                : undefined
            }
          />
          <ul>
            {split.right.map((item, itemIndex) => (
              <li key={`matching-right-${itemIndex}`}>
                <div className="preview-matching-item-label">R{itemIndex + 1}</div>
                <RichTextPreview text={item} images={question.question_images} emptyPlaceholder="(empty)" />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <PreviewSectionHeading
        label="Relationships"
        onEdit={
          onNavigateToInput
            ? () =>
                onNavigateToInput({
                  subTab: "questions",
                  questionIndex: index + 1,
                  fieldSelector: `[data-field="matching-relationships"]`
                })
            : undefined
        }
      />
      {relationships.length === 0 ? (
        <p>No relationships defined yet.</p>
      ) : (
        <ul>
          {relationships.map((relationship, relationshipIndex) => (
            <li key={`relationship-${relationshipIndex}`}>
              <div className="preview-relationship-row">
                <div>
                  <span className="preview-relationship-label">
                    {relationship.leftLabel ?? "(missing left)"} -&gt; {relationship.rightLabel ?? "(missing right)"}
                  </span>
                  <span className="preview-relationship-text">
                    {relationship.left || "(missing left)"} -&gt; {relationship.right || "(missing right)"}
                  </span>
                  {!relationship.validLeft || !relationship.validRight ? " (invalid mapping)" : ""}
                </div>
                {onNavigateToInput ? (
                  <button
                    type="button"
                    className="preview-jump-button preview-jump-button-inline"
                    onClick={() =>
                      onNavigateToInput({
                        subTab: "questions",
                        questionIndex: index + 1,
                        fieldSelector: `[data-field="matching-relationships"]`
                      })
                    }
                  >
                    Edit
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function renderManualGuideAnswerSection(
  question: CanonicalQuestionExport,
  index: number,
  onNavigateToInput?: (target: InputScrollTarget) => void
) {
  if (!usesManualGuideAnswerInput(question.question_type)) {
    return null;
  }
  const answer = questionAnswerSummary(question);
  if (!answer || answer.trim().length === 0 || answer === "(none)") {
    return null;
  }

  return (
    <>
      <PreviewSectionHeading
        label="Guide Answer"
        onEdit={
          onNavigateToInput
            ? () =>
                onNavigateToInput({
                  subTab: "questions",
                  questionIndex: index + 1,
                  fieldSelector: `[data-field="guide-answer"]`
                })
            : undefined
        }
      />
      <RichTextPreview text={answer} images={question.guide_answer_images} emptyPlaceholder="(none)" />
    </>
  );
}
