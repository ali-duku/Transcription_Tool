export type PageType =
  | "content"
  | "title_page"
  | "table_of_content"
  | "unit_table_of_content"
  | "vocabulary"
  | "project"
  | "other";

export type QuestionType =
  | "free_form"
  | "multiple_choice"
  | "checkbox"
  | "fill_in_the_blanks"
  | "annotate"
  | "matching"
  | "create_table";

export type ThemePreference = "light" | "dark";
export type MigrationPhase = "global_scaffold" | "canonical_output";

export type Point = [number, number];
export type Bbox = [Point, Point];
export type PageRange = [number, number];

export interface PagedBbox {
  page: number;
  position: Bbox;
}

export interface BookTitlePage {
  title: string;
  subtitle: string;
  version: string;
  grade: number;
  semester: number;
  lang: string;
  subject: string;
}

export interface UnitPreamble {
  id: string;
  title: string;
  title_translation: string | null;
  text: string | null;
}

export interface LessonPreamble {
  id: string;
  title: string;
  title_translation: string | null;
  lesson_standards: string[];
  terminology: string[];
  text: string | null;
}

export interface InstructionalContent {
  section_title: string;
  text: string;
  images: PagedBbox[] | null;
}

export interface PracticeQuestion {
  id: string;
  difficulty: "easy" | "medium" | "hard" | null;
  question_type: QuestionType;
  guide_pdf_page: number | null;
  setup_text: string | null;
  question: string;
  options: string[] | null;
  question_images: PagedBbox[] | null;
  guide_answer: string[];
  guide_answer_images: PagedBbox[] | null;
}

export interface TranscriptDocument {
  textbook_page: number;
  textbook_pdf_page: number;
  guidebook_pdf_pages: PageRange | null;
  page_type: PageType;
  book_title_page: BookTitlePage | null;
  unit_preamble: UnitPreamble | null;
  lesson_preamble: LessonPreamble | null;
  instructional_content: InstructionalContent[] | null;
  practice_questions: PracticeQuestion[] | null;
}
