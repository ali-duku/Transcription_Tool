import type { ValidationSummary } from "../../../domain/serializers/generateJson";
import type { TranscriptionDocumentState } from "../../shell/state/documentReducer";
import { validateImageReferenceConsistency } from "../utils/imageReferenceValidation";
import { validatePagedBboxArray } from "../utils/pagedBboxValidation";
import { validateTextContent } from "../utils/textContentValidation";
import { validateQuestions } from "./questionValidationRules";

function isWholeNumber(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed);
}

function hasAnyBookMetadataValue(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  return Object.values(value).some((item) => String(item ?? "").trim().length > 0);
}

function validateBookMetadata(state: TranscriptionDocumentState, errors: string[]) {
  const metadata = state.book_title_page as Record<string, unknown> | null;
  const isTitlePage = state.page_type === "title_page";
  const hasAnyValue = hasAnyBookMetadataValue(metadata);

  if (!isTitlePage && hasAnyValue) {
    errors.push(
      "Book Metadata can only be filled when Page Type is Title Page. Clear Book Metadata fields or switch Page Type to Title Page."
    );
    return;
  }
  if (!isTitlePage) {
    return;
  }

  const requiredFields = ["title", "subtitle", "version", "grade", "semester", "lang", "subject"];
  requiredFields.forEach((field) => {
    const value = metadata?.[field];
    if (value == null || String(value).trim().length === 0) {
      errors.push(`Book metadata field "${field}" is required for title pages.`);
    }
  });
  if (metadata?.grade != null && metadata.grade !== "" && !isWholeNumber(metadata.grade)) {
    errors.push("Book metadata grade must be a whole number.");
  }
  if (metadata?.semester != null && metadata.semester !== "" && !isWholeNumber(metadata.semester)) {
    errors.push("Book metadata semester must be a whole number.");
  }
}

function appendTextContentValidation(
  content: string | null | undefined,
  locationLabel: string,
  errors: string[],
  warnings: string[]
) {
  const result = validateTextContent(content ?? "", locationLabel);
  errors.push(...result.errors);
  warnings.push(...result.warnings);
}

function containsMarkdownTable(content: string): boolean {
  return /(^|\n)\s*\|.+\|\s*\n\s*\|[\s:-|]+\|/.test(content);
}

function containsImageReference(content: string): boolean {
  return /!\[[\s\S]*?\]\(\s*\d+\s*\)/.test(content);
}

function validateTopLevel(state: TranscriptionDocumentState, errors: string[]) {
  if (state.textbook_page == null) {
    errors.push("Textbook page is required.");
  } else if (!isWholeNumber(state.textbook_page)) {
    errors.push("Textbook page must be a whole number.");
  }

  if (state.textbook_pdf_page == null) {
    errors.push("Textbook PDF page is required.");
  } else if (!isWholeNumber(state.textbook_pdf_page)) {
    errors.push("Textbook PDF page must be a whole number.");
  }

  if (!state.page_type) {
    errors.push("Page type is required.");
  }

  if (state.guidebook_pdf_pages) {
    const [start, end] = state.guidebook_pdf_pages;
    if (!isWholeNumber(start)) {
      errors.push("Guidebook start page must be a whole number.");
    }
    if (!isWholeNumber(end)) {
      errors.push("Guidebook end page must be a whole number.");
    }
    if (isWholeNumber(start) && isWholeNumber(end) && Number(start) > Number(end)) {
      errors.push("Guidebook start page cannot be greater than end page.");
    }
  }
}

function validateContentSections(state: TranscriptionDocumentState, errors: string[], warnings: string[]) {
  state.instructional_content.forEach((section, index) => {
    if (!section.section_title.trim()) {
      warnings.push(`Content Section ${index + 1}: section title is empty.`);
    }
    if (!section.text.trim() || /^\d+$/.test(section.text.trim())) {
      errors.push(`Content Section ${index + 1}: content text is required.`);
    }

    appendTextContentValidation(
      section.section_title,
      `Content Section ${index + 1}: section title`,
      errors,
      warnings
    );
    appendTextContentValidation(
      section.text,
      `Content Section ${index + 1}: content text`,
      errors,
      warnings
    );

    validatePagedBboxArray(section.images, `Content Section ${index + 1}: Images`, errors);
  });
}

function validatePreambles(state: TranscriptionDocumentState, errors: string[], warnings: string[]) {
  const unit = state.unit_preamble;
  if (unit) {
    appendTextContentValidation(unit.title, "Unit Preamble: Unit title", errors, warnings);
    appendTextContentValidation(unit.title_translation, "Unit Preamble: Unit title translation", errors, warnings);
    appendTextContentValidation(unit.text, "Unit Preamble: Unit text", errors, warnings);
    if (unit.text && containsMarkdownTable(unit.text)) {
      errors.push("Unit Preamble: Tables are not allowed in unit/lesson preamble text.");
    }
    if (unit.text && containsImageReference(unit.text)) {
      errors.push("Unit Preamble: Images are not allowed in unit/lesson preamble text.");
    }
  }

  const lesson = state.lesson_preamble;
  if (lesson) {
    appendTextContentValidation(lesson.title, "Lesson Preamble: Lesson title", errors, warnings);
    appendTextContentValidation(
      lesson.title_translation,
      "Lesson Preamble: Lesson title translation",
      errors,
      warnings
    );
    appendTextContentValidation(lesson.text, "Lesson Preamble: Lesson text", errors, warnings);
    lesson.lesson_standards.forEach((item, index) => {
      appendTextContentValidation(
        item,
        `Lesson Preamble: Lesson standard ${index + 1}`,
        errors,
        warnings
      );
    });
    lesson.terminology.forEach((item, index) => {
      appendTextContentValidation(
        item,
        `Lesson Preamble: Terminology ${index + 1}`,
        errors,
        warnings
      );
    });
    if (lesson.text && containsMarkdownTable(lesson.text)) {
      errors.push("Lesson Preamble: Tables are not allowed in unit/lesson preamble text.");
    }
    if (lesson.text && containsImageReference(lesson.text)) {
      errors.push("Lesson Preamble: Images are not allowed in unit/lesson preamble text.");
    }
  }
}

export function validateDocumentForGenerate(state: TranscriptionDocumentState): ValidationSummary {
  const errors: string[] = [];
  const warnings: string[] = [];

  validateTopLevel(state, errors);
  validateBookMetadata(state, errors);
  validatePreambles(state, errors, warnings);
  validateContentSections(state, errors, warnings);
  validateQuestions(state, errors, warnings);
  validateImageReferenceConsistency(state, errors);

  return { errors, warnings };
}

export function validateDocumentForSave(state: TranscriptionDocumentState): ValidationSummary {
  // Save path intentionally returns the same validation inventory, but caller keeps non-blocking semantics.
  return validateDocumentForGenerate(state);
}
