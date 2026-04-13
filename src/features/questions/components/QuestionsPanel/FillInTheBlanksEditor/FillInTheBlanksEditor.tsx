import { extractBlankTokenIds, syncBlankAnswersWithQuestion } from "../questionPanelUtils";
import { LiveFieldPreview } from "../../../../preview/components/LiveFieldPreview";
import type { QuestionTypeEditorProps } from "../types";
import "./FillInTheBlanksEditor.css";

export function FillInTheBlanksEditor({ row, onChange }: QuestionTypeEditorProps) {
  const blankTokenIds = extractBlankTokenIds(row.canonical.question);
  const answers = syncBlankAnswersWithQuestion(row.canonical.question, row.canonical.guide_answer);
  const filledQuestionPreview = blankTokenIds.reduce((result, tokenId, index) => {
    const answer = (answers[index] ?? "").trim();
    const token = new RegExp(`___\\s*${tokenId}\\s*___`, "g");
    return result.replace(token, answer.length > 0 ? answer : `___${tokenId}___`);
  }, row.canonical.question);

  function updateAnswerAt(index: number, value: string) {
    const nextAnswers = [...answers];
    nextAnswers[index] = value;
    onChange({
      ...row.canonical,
      options: null,
      guide_answer: nextAnswers
    });
  }

  return (
    <div className="nested-editor">
      <div className="subtab-header-row">
        <strong>Blank Answers</strong>
      </div>

      {blankTokenIds.length === 0 ? (
        <p className="fitb-helper-text">
          No blank tokens detected in question text. Add tokens like `___1___`, `___2___` in Question Text.
        </p>
      ) : (
        <>
          <p className="fitb-helper-text">
            Answers are auto-synced to blank tokens from question text in detected order.
          </p>
          {blankTokenIds.map((tokenId, index) => (
            <div key={`${row.uid}-blank-${index}`} className="choice-row">
              <label className="fitb-answer-label" htmlFor={`${row.uid}-fitb-${index}`}>
                Blank ___{tokenId}___
              </label>
              <input
                data-field="fitb-answer"
                data-blank-index={index + 1}
                id={`${row.uid}-fitb-${index}`}
                type="text"
                value={answers[index] ?? ""}
                onChange={(event) => updateAnswerAt(index, event.target.value)}
              />
            </div>
          ))}
          <div className="fitb-preview-block">
            <strong>Preview with Answers</strong>
            <LiveFieldPreview text={filledQuestionPreview} emptyPlaceholder="Preview will appear here." />
          </div>
        </>
      )}
    </div>
  );
}
