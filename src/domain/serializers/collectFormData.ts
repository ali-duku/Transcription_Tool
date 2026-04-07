import { QuestionSchemaAdapter } from "../schema/questionSchemaAdapter";
import type { TranscriptionDocumentState } from "../../features/shell/state/documentReducer";
import type { SerializableTranscriptionPayload } from "../../shared/types/transcriptionPayload";

export interface CollectFormDataOptions {
  includeSaveTimestamp?: boolean;
}

function cloneQuestionForPayload(question: TranscriptionDocumentState["practice_questions"][number]) {
  return QuestionSchemaAdapter.toSchemaExport(question.canonical);
}

export function collectFormDataWithoutValidation(
  state: TranscriptionDocumentState,
  options: CollectFormDataOptions = {}
): SerializableTranscriptionPayload {
  const payload: SerializableTranscriptionPayload = {
    textbook_page: state.textbook_page,
    textbook_pdf_page: state.textbook_pdf_page,
    guidebook_pdf_pages: state.guidebook_pdf_pages,
    page_type: state.page_type,
    book_title_page: state.book_title_page,
    unit_preamble: state.unit_preamble,
    lesson_preamble: state.lesson_preamble,
    instructional_content: state.instructional_content.map((section) => ({
      section_title: section.section_title,
      text: section.text,
      images: Array.isArray(section.images) ? section.images : []
    })),
    practice_questions: state.practice_questions.map((question) => cloneQuestionForPayload(question))
  };

  if (options.includeSaveTimestamp) {
    payload._save_timestamp = new Date().toISOString();
  }

  return payload;
}
