import type { InputScrollTarget, InputSubTabKey } from "../../../shared/types/navigation";

function resolveTargetFieldSelector(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("image row") && normalized.includes("page")) return `[data-field="bbox-page"]`;
  if (normalized.includes("image row") && normalized.includes("x0")) return `[data-field="bbox-x0"]`;
  if (normalized.includes("image row") && normalized.includes("y0")) return `[data-field="bbox-y0"]`;
  if (normalized.includes("image row") && normalized.includes("x1")) return `[data-field="bbox-x1"]`;
  if (normalized.includes("image row") && normalized.includes("y1")) return `[data-field="bbox-y1"]`;
  if (normalized.includes("image row") && normalized.includes("x2")) return `[data-field="bbox-x2"]`;
  if (normalized.includes("image row") && normalized.includes("y2")) return `[data-field="bbox-y2"]`;
  if (normalized.includes("image row")) return `[data-field="bbox-page"]`;

  if (normalized.includes("question id")) return `[data-field="question-id"]`;
  if (normalized.includes("guide pdf page")) return `[data-field="guide-page"]`;
  if (normalized.includes("guide answer image")) return `[data-field="guide-answer"]`;
  if (normalized.includes("question image")) return `[data-field="question-text"]`;
  if (normalized.includes("content image")) return `[data-field="section-text"]`;
  if (
    normalized.includes("question text") ||
    normalized.includes("___n___") ||
    normalized.includes("fill in the blanks marker")
  ) {
    return `[data-field="question-text"]`;
  }
  if (normalized.includes("set-up text")) return `[data-field="setup-text"]`;
  if (
    normalized.includes("option ") ||
    normalized.includes("at least one option") ||
    normalized.includes("choice option") ||
    normalized.includes("correct answer") ||
    normalized.includes("checkbox answer")
  ) {
    return `[data-field="choice-option"]`;
  }
  if (normalized.includes("matching left item") || normalized.includes("at least one left item")) return `[data-field="matching-left"]`;
  if (normalized.includes("matching right item") || normalized.includes("at least one right item")) return `[data-field="matching-right"]`;
  if (normalized.includes("matching relationship") || normalized.includes("at least one relationship")) return `[data-field="matching-relationships"]`;
  if (normalized.includes("matching options")) return `[data-field="matching-left"]`;
  if (normalized.includes("guide answer")) return `[data-field="guide-answer"]`;
  if (normalized.includes("blank answers") || normalized.includes("number of blank answers")) return `[data-field="fitb-answer"]`;
  if (normalized.includes("section title")) return `[data-field="section-title"]`;
  if (normalized.includes("content text")) return `[data-field="section-text"]`;
  return "";
}

function resolveGlobalFieldSelector(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.startsWith("book metadata fields are only allowed when page type is title page.") ||
    normalized.startsWith(
      "book metadata can only be filled when page type is title page. clear book metadata fields or switch page type to title page."
    )
  ) {
    return `[data-field="basic-page-type"]`;
  }
  if (normalized.startsWith('book metadata field "title"')) return `[data-field="book-title"]`;
  if (normalized.startsWith('book metadata field "subtitle"')) return `[data-field="book-subtitle"]`;
  if (normalized.startsWith('book metadata field "version"')) return `[data-field="book-version"]`;
  if (normalized.startsWith('book metadata field "grade"') || normalized.includes("book metadata grade")) return `[data-field="book-grade"]`;
  if (normalized.startsWith('book metadata field "semester"') || normalized.includes("book metadata semester")) return `[data-field="book-semester"]`;
  if (normalized.startsWith('book metadata field "lang"')) return `[data-field="book-lang"]`;
  if (normalized.startsWith('book metadata field "subject"')) return `[data-field="book-subject"]`;
  if (normalized.startsWith("unit preamble: unit title translation")) return `[data-field="unit-title-translation"]`;
  if (normalized.startsWith("unit preamble: unit title")) return `[data-field="unit-title"]`;
  if (normalized.startsWith("unit preamble: unit text")) return `[data-field="unit-text"]`;
  if (
    normalized.startsWith("unit preamble: tables are not allowed in unit/lesson preamble text.") ||
    normalized.startsWith("unit preamble: images are not allowed in unit/lesson preamble text.")
  ) {
    return `[data-field="unit-text"]`;
  }
  if (normalized.startsWith("lesson preamble: lesson title translation")) return `[data-field="lesson-title-translation"]`;
  if (normalized.startsWith("lesson preamble: lesson title")) return `[data-field="lesson-title"]`;
  if (normalized.startsWith("lesson preamble: lesson text")) return `[data-field="lesson-text"]`;
  if (normalized.startsWith("lesson preamble: lesson standard")) return `[data-field="lesson-standards"]`;
  if (normalized.startsWith("lesson preamble: terminology")) return `[data-field="lesson-terminology"]`;
  if (
    normalized.startsWith("lesson preamble: tables are not allowed in unit/lesson preamble text.") ||
    normalized.startsWith("lesson preamble: images are not allowed in unit/lesson preamble text.")
  ) {
    return `[data-field="lesson-text"]`;
  }
  if (normalized.startsWith("textbook page")) return `[data-field="basic-textbook-page"]`;
  if (normalized.startsWith("textbook pdf page")) return `[data-field="basic-textbook-pdf-page"]`;
  if (normalized.startsWith("guidebook start page")) return `[data-field="basic-guidebook-start"]`;
  if (normalized.startsWith("guidebook end page")) return `[data-field="basic-guidebook-end"]`;
  if (normalized.startsWith("page type")) return `[data-field="basic-page-type"]`;
  return "";
}

export function mapValidationMessageToSubTab(message: string): InputSubTabKey {
  const normalized = message.toLowerCase();

  if (
    normalized.startsWith("book metadata fields are only allowed when page type is title page.") ||
    normalized.startsWith(
      "book metadata can only be filled when page type is title page. clear book metadata fields or switch page type to title page."
    )
  ) {
    return "basic";
  }
  if (normalized.startsWith("book metadata")) return "book_metadata";
  if (normalized.startsWith("unit preamble")) return "unit_preamble";
  if (normalized.startsWith("lesson preamble")) return "preamble";
  if (normalized.startsWith("content section")) return "content";
  if (normalized.startsWith("question") || normalized.startsWith("duplicate question id")) return "questions";
  if (normalized.startsWith("textbook") || normalized.startsWith("guidebook") || normalized.startsWith("page type")) return "basic";
  return "basic";
}

export function resolveInputTargetFromValidationMessage(message: string): InputScrollTarget | null {
  const duplicateQuestionMatch = message.match(/Duplicate Question ID \"[^\"]+\" found in Question\s+(\d+)/);
  if (duplicateQuestionMatch) {
    const questionIndex = Number.parseInt(duplicateQuestionMatch[1], 10);
    if (!Number.isNaN(questionIndex) && questionIndex > 0) {
      return {
        subTab: "questions",
        questionIndex,
        fieldSelector: `[data-field="question-id"]`
      };
    }
  }

  const questionMatch = message.match(/^Question\s+(\d+):/);
  if (questionMatch) {
    const questionIndex = Number.parseInt(questionMatch[1], 10);
    if (!Number.isNaN(questionIndex) && questionIndex > 0) {
      return {
        subTab: "questions",
        questionIndex,
        fieldSelector: resolveTargetFieldSelector(message) || undefined
      };
    }
  }

  const contentMatch = message.match(/^Content Section\s+(\d+):/);
  if (contentMatch) {
    const contentIndex = Number.parseInt(contentMatch[1], 10);
    if (!Number.isNaN(contentIndex) && contentIndex > 0) {
      return {
        subTab: "content",
        contentIndex,
        fieldSelector: resolveTargetFieldSelector(message) || undefined
      };
    }
  }

  const globalSelector = resolveGlobalFieldSelector(message);
  if (!globalSelector) {
    return null;
  }
  return {
    subTab: mapValidationMessageToSubTab(message),
    fieldSelector: globalSelector
  };
}
