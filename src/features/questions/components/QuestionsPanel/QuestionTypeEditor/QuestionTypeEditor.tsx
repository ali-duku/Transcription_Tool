import { ChoiceEditor } from "../ChoiceEditor";
import { FillInTheBlanksEditor } from "../FillInTheBlanksEditor";
import { ManualGuideAnswerEditor } from "../ManualGuideAnswerEditor";
import { MatchingEditor } from "../MatchingEditor";
import type { QuestionTypeEditorProps } from "../types";
import "./QuestionTypeEditor.css";

export function QuestionTypeEditor({ row, onChange }: QuestionTypeEditorProps) {
  const type = row.canonical.question_type;

  if (type === "multiple_choice" || type === "checkbox") {
    return <ChoiceEditor row={row} isCheckbox={type === "checkbox"} onChange={onChange} />;
  }

  if (type === "fill_in_the_blanks") {
    return <FillInTheBlanksEditor row={row} onChange={onChange} />;
  }

  if (type === "matching") {
    return <MatchingEditor row={row} onChange={onChange} />;
  }

  return <ManualGuideAnswerEditor row={row} onChange={onChange} />;
}
