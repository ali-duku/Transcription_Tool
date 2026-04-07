import type { CanonicalQuestionExport } from "../../../../../domain/schema/questionSchemaAdapter";
import type { InputScrollTarget } from "../../../../../shared/types/navigation";
import { fillInBlankAnswerPreview } from "../previewQuestionUtils";
import { RichTextPreview } from "../RichTextPreview";
import { PreviewSectionHeading } from "./PreviewSectionHeading";
import "./questionPreviewCardChoiceFitbSections.css";

function extractOrderedBlankNumbers(text: string): number[] {
  const matches = [...(text ?? "").matchAll(/___(\d+)___/g)];
  return matches.map((match) => Number.parseInt(match[1], 10)).filter((value) => Number.isInteger(value));
}

export function renderOptionsSection(
  question: CanonicalQuestionExport,
  index: number,
  onNavigateToInput?: (target: InputScrollTarget) => void
) {
  if (question.question_type !== "multiple_choice" && question.question_type !== "checkbox") {
    return null;
  }
  const options = Array.isArray(question.options) ? question.options : [];
  if (options.length === 0) {
    return null;
  }
  const correctAnswers = new Set(question.guide_answer);
  const typeLabel =
    question.question_type === "multiple_choice"
      ? "Multiple Choice"
      : "Checkbox (Multiple Answers)";

  return (
    <>
      <PreviewSectionHeading
        label={`Choices (${typeLabel})`}
        onEdit={
          onNavigateToInput
            ? () =>
                onNavigateToInput({
                  subTab: "questions",
                  questionIndex: index + 1,
                  fieldSelector: `[data-field="choice-option"]`
                })
            : undefined
        }
      />
      <ul>
        {options.map((option, optionIndex) => (
          <li key={`option-${optionIndex}`} className={correctAnswers.has(option) ? "preview-option-correct" : ""}>
            <div className="preview-option-header">
              <span>{correctAnswers.has(option) ? "Correct" : "Option"}</span>
              {onNavigateToInput ? (
                <button
                  type="button"
                  className="preview-jump-button preview-jump-button-inline"
                  onClick={() =>
                    onNavigateToInput({
                      subTab: "questions",
                      questionIndex: index + 1,
                      fieldSelector: `[data-field="choice-option"][data-option-index="${optionIndex + 1}"]`
                    })
                  }
                >
                  Edit
                </button>
              ) : null}
            </div>
            <RichTextPreview text={option} images={question.question_images} emptyPlaceholder="(empty option)" />
          </li>
        ))}
      </ul>
    </>
  );
}

export function renderFillInTheBlanksSection(
  question: CanonicalQuestionExport,
  index: number,
  onNavigateToInput?: (target: InputScrollTarget) => void
) {
  if (question.question_type !== "fill_in_the_blanks") {
    return null;
  }
  const answers = Array.isArray(question.guide_answer) ? question.guide_answer : [];
  const blankNumbers = extractOrderedBlankNumbers(question.question ?? "");
  const hasAllAnswersFilled =
    blankNumbers.length > 0 &&
    blankNumbers.every((_, answerIndex) => {
      const value = answers[answerIndex] ?? "";
      return value.trim().length > 0;
    });

  return (
    <>
      {answers.length > 0 ? (
        <div className="preview-question-meta">
          <PreviewSectionHeading
            label="Answers"
            onEdit={
              onNavigateToInput
                ? () =>
                    onNavigateToInput({
                      subTab: "questions",
                      questionIndex: index + 1,
                      fieldSelector: `[data-field="fitb-answer"]`
                    })
                : undefined
            }
          />
          <ul>
            {answers.map((answer, answerIndex) => (
              <li key={`blank-answer-${answerIndex}`}>
                <div className="preview-answer-row">
                  <span>
                    Blank {answerIndex + 1}: {answer || "(empty)"}
                  </span>
                  {onNavigateToInput ? (
                    <button
                      type="button"
                      className="preview-jump-button preview-jump-button-inline"
                      onClick={() =>
                        onNavigateToInput({
                          subTab: "questions",
                          questionIndex: index + 1,
                          fieldSelector: `[data-field="fitb-answer"][data-blank-index="${answerIndex + 1}"]`
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
        </div>
      ) : null}
      {hasAllAnswersFilled ? (
        <div className="preview-question-meta">
          <PreviewSectionHeading
            label="Preview with Answers"
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
          <RichTextPreview
            text={fillInBlankAnswerPreview(question.question, question.guide_answer)}
            images={question.question_images}
            emptyPlaceholder="(none)"
          />
        </div>
      ) : null}
    </>
  );
}
