import type { CanonicalQuestionExport } from "../../../../domain/schema/questionSchemaAdapter";
import type { QuestionState } from "../../state/questionsReducer";

export interface QuestionTypeEditorProps {
  row: QuestionState;
  onChange: (next: CanonicalQuestionExport) => void;
}

export interface ChoiceEditorProps extends QuestionTypeEditorProps {
  isCheckbox: boolean;
}
