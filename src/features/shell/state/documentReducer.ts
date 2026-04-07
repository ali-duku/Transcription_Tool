import type {
  BookTitlePage,
  LessonPreamble,
  PageRange,
  PageType,
  UnitPreamble
} from "../../../domain/schema/contracts";
import {
  contentSectionsReducer,
  createContentSectionState,
  type ContentSectionsAction,
  type ContentSectionState
} from "../../contentSections/state/contentSectionsReducer";
import {
  createQuestionState,
  questionsReducer,
  type QuestionState,
  type QuestionsAction
} from "../../questions/state/questionsReducer";

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return !!(value && typeof value === "object" && !Array.isArray(value));
}

function parseIntegerOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parsePageRange(value: unknown): PageRange | null {
  if (!Array.isArray(value) || value.length !== 2) {
    return null;
  }
  const start = parseIntegerOrNull(value[0]);
  const end = parseIntegerOrNull(value[1]);
  if (start == null || end == null) {
    return null;
  }
  return [start, end];
}

function parsePageType(value: unknown): PageType | null {
  if (typeof value !== "string") {
    return null;
  }
  const allowed: PageType[] = [
    "content",
    "title_page",
    "table_of_content",
    "unit_table_of_content",
    "vocabulary",
    "project",
    "other"
  ];
  return allowed.includes(value as PageType) ? (value as PageType) : null;
}

function parseOptionalObject<T>(value: unknown): T | null {
  return isPlainObject(value) ? (value as unknown as T) : null;
}

export interface TranscriptionDocumentState {
  textbook_page: number | null;
  textbook_pdf_page: number | null;
  guidebook_pdf_pages: PageRange | null;
  page_type: PageType | null;
  book_title_page: BookTitlePage | null;
  unit_preamble: UnitPreamble | null;
  lesson_preamble: LessonPreamble | null;
  instructional_content: ContentSectionState[];
  practice_questions: QuestionState[];
}

export type DocumentAction =
  | { type: "load_document"; payload: unknown }
  | { type: "reset_document" }
  | { type: "set_textbook_page"; value: unknown }
  | { type: "set_textbook_pdf_page"; value: unknown }
  | { type: "set_guidebook_pdf_pages"; value: unknown }
  | { type: "set_page_type"; value: unknown }
  | { type: "set_book_title_page"; value: unknown }
  | { type: "set_unit_preamble"; value: unknown }
  | { type: "set_lesson_preamble"; value: unknown }
  | { type: "content"; action: ContentSectionsAction }
  | { type: "questions"; action: QuestionsAction }
  | { type: "add_content_section"; index?: number; payload?: unknown }
  | { type: "remove_content_section"; index: number }
  | { type: "duplicate_content_section"; index: number }
  | { type: "move_content_section"; index: number; direction: "up" | "down" }
  | { type: "paste_content_section"; index: number; mode: "replace" | "insert_after"; payload: unknown }
  | { type: "add_question"; index?: number; payload?: unknown }
  | { type: "remove_question"; index: number }
  | { type: "duplicate_question"; index: number }
  | { type: "move_question"; index: number; direction: "up" | "down" }
  | { type: "paste_question"; index: number; mode: "replace" | "insert_after"; payload: unknown };

export function createInitialDocumentState(): TranscriptionDocumentState {
  return {
    textbook_page: null,
    textbook_pdf_page: null,
    guidebook_pdf_pages: null,
    page_type: "content",
    book_title_page: null,
    unit_preamble: null,
    lesson_preamble: null,
    instructional_content: [],
    practice_questions: []
  };
}

export function normalizeLoadedDocumentState(payload: unknown): TranscriptionDocumentState {
  if (!isPlainObject(payload)) {
    return createInitialDocumentState();
  }

  const source = payload;
  const contentRows = Array.isArray(source.instructional_content)
    ? source.instructional_content.map((row) => createContentSectionState(row))
    : [];
  const questionRows = Array.isArray(source.practice_questions)
    ? source.practice_questions.map((row) => createQuestionState(row))
    : [];

  return {
    textbook_page: parseIntegerOrNull(source.textbook_page),
    textbook_pdf_page: parseIntegerOrNull(source.textbook_pdf_page),
    guidebook_pdf_pages: parsePageRange(source.guidebook_pdf_pages),
    page_type: parsePageType(source.page_type),
    book_title_page: parseOptionalObject<BookTitlePage>(source.book_title_page),
    unit_preamble: parseOptionalObject<UnitPreamble>(source.unit_preamble),
    lesson_preamble: parseOptionalObject<LessonPreamble>(source.lesson_preamble),
    instructional_content: contentRows,
    practice_questions: questionRows
  };
}

export function documentReducer(
  state: TranscriptionDocumentState,
  action: DocumentAction
): TranscriptionDocumentState {
  switch (action.type) {
    case "load_document":
      return normalizeLoadedDocumentState(action.payload);

    case "reset_document":
      return createInitialDocumentState();

    case "set_textbook_page":
      return { ...state, textbook_page: parseIntegerOrNull(action.value) };

    case "set_textbook_pdf_page":
      return { ...state, textbook_pdf_page: parseIntegerOrNull(action.value) };

    case "set_guidebook_pdf_pages":
      return { ...state, guidebook_pdf_pages: parsePageRange(action.value) };

    case "set_page_type":
      return { ...state, page_type: parsePageType(action.value) };

    case "set_book_title_page":
      return { ...state, book_title_page: parseOptionalObject<BookTitlePage>(action.value) };

    case "set_unit_preamble":
      return { ...state, unit_preamble: parseOptionalObject<UnitPreamble>(action.value) };

    case "set_lesson_preamble":
      return { ...state, lesson_preamble: parseOptionalObject<LessonPreamble>(action.value) };

    case "content":
      return {
        ...state,
        instructional_content: contentSectionsReducer(state.instructional_content, action.action)
      };

    case "questions":
      return {
        ...state,
        practice_questions: questionsReducer(state.practice_questions, action.action)
      };

    case "add_content_section":
      return {
        ...state,
        instructional_content: contentSectionsReducer(state.instructional_content, {
          type: "add",
          index: action.index,
          payload: action.payload
        })
      };

    case "remove_content_section":
      return {
        ...state,
        instructional_content: contentSectionsReducer(state.instructional_content, {
          type: "remove",
          index: action.index
        })
      };

    case "duplicate_content_section":
      return {
        ...state,
        instructional_content: contentSectionsReducer(state.instructional_content, {
          type: "duplicate",
          index: action.index
        })
      };

    case "move_content_section":
      return {
        ...state,
        instructional_content: contentSectionsReducer(state.instructional_content, {
          type: "move",
          index: action.index,
          direction: action.direction
        })
      };

    case "paste_content_section":
      return {
        ...state,
        instructional_content: contentSectionsReducer(state.instructional_content, {
          type: "paste",
          index: action.index,
          mode: action.mode,
          payload: action.payload
        })
      };

    case "add_question":
      return {
        ...state,
        practice_questions: questionsReducer(state.practice_questions, {
          type: "add",
          index: action.index,
          payload: action.payload
        })
      };

    case "remove_question":
      return {
        ...state,
        practice_questions: questionsReducer(state.practice_questions, {
          type: "remove",
          index: action.index
        })
      };

    case "duplicate_question":
      return {
        ...state,
        practice_questions: questionsReducer(state.practice_questions, {
          type: "duplicate",
          index: action.index
        })
      };

    case "move_question":
      return {
        ...state,
        practice_questions: questionsReducer(state.practice_questions, {
          type: "move",
          index: action.index,
          direction: action.direction
        })
      };

    case "paste_question":
      return {
        ...state,
        practice_questions: questionsReducer(state.practice_questions, {
          type: "paste",
          index: action.index,
          mode: action.mode,
          payload: action.payload
        })
      };

    default:
      return state;
  }
}
