import type {
  BookTitlePage,
  LessonPreamble,
  PageRange,
  PageType,
  UnitPreamble
} from "../../domain/schema/contracts";
import type { CanonicalQuestionExport } from "../../domain/schema/questionSchemaAdapter";

export interface SerializableInstructionalContent {
  section_title: string;
  text: string;
  images: unknown[];
}

export interface SerializableTranscriptionPayload {
  textbook_page: number | null;
  textbook_pdf_page: number | null;
  guidebook_pdf_pages: PageRange | null;
  page_type: PageType | null;
  book_title_page: BookTitlePage | null;
  unit_preamble: UnitPreamble | null;
  lesson_preamble: LessonPreamble | null;
  instructional_content: SerializableInstructionalContent[];
  practice_questions: CanonicalQuestionExport[];
  _save_timestamp?: string;
}
