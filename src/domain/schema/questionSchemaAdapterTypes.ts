export type PlainObject = Record<string, unknown>;

export type QuestionPayloadShape = "legacy" | "new" | "mixed" | "unknown";

export interface CanonicalQuestionExport {
  id: string;
  difficulty: null;
  question_type: string;
  guide_pdf_page: number | null;
  setup_text: string | null;
  question: string;
  options: string[] | null;
  question_images: unknown[] | null;
  guide_answer: string[];
  guide_answer_images: unknown[] | null;
}

export type LegacyQuestionShape = PlainObject & {
  id?: unknown;
  question_type?: unknown;
  question?: unknown;
  question_text?: unknown;
  setup_text?: unknown;
  set_up_text?: unknown;
  guide_pdf_page?: unknown;
  guide_answer?: unknown;
  guide_answer_images?: unknown;
  question_images?: unknown;
  choices?: unknown;
  value?: unknown;
  values?: unknown;
  left?: unknown;
  right?: unknown;
  relationship?: unknown;
  options?: unknown;
  correct_answer_index?: unknown;
  difficulty?: unknown;
  related_question?: unknown;
};

export interface NormalizedQuestionPayload {
  canonical: CanonicalQuestionExport;
  populateShape: LegacyQuestionShape;
  legacyExport: LegacyQuestionShape;
  payloadShape: QuestionPayloadShape;
}

export function isPlainObject(value: unknown): value is PlainObject {
  return !!(value && typeof value === "object" && !Array.isArray(value));
}

export function hasOwn(obj: unknown, key: string): boolean {
  return isPlainObject(obj) && Object.prototype.hasOwnProperty.call(obj, key);
}

export function isChoiceBasedType(questionType: string): boolean {
  return questionType === "multiple_choice" || questionType === "checkbox";
}

export function usesManualGuideAnswerInput(questionType: string): boolean {
  return questionType === "free_form" || questionType === "annotate" || questionType === "create_table";
}

export function supportsGuideAnswerImagesForType(questionType: string): boolean {
  return usesManualGuideAnswerInput(questionType);
}

export function normalizeIntegerOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}

export function normalizePositiveInteger(value: unknown): number | null {
  const parsed = normalizeIntegerOrNull(value);
  return typeof parsed === "number" && parsed > 0 ? parsed : null;
}

export function normalizeQuestionType(value: unknown): string {
  return value == null || value === "" ? "free_form" : String(value);
}

export function normalizeGuideAnswerToArray(guideAnswer: unknown): string[] {
  if (Array.isArray(guideAnswer)) {
    const normalized = guideAnswer
      .map((item) => (item == null ? "" : String(item).trim()))
      .filter((item) => item !== "");
    return normalized.length > 0 ? normalized : [];
  }

  if (guideAnswer === undefined || guideAnswer === null) {
    return [];
  }

  const text = String(guideAnswer).trim();
  return text ? [text] : [];
}

export function normalizeGuideAnswerForType(guideAnswer: unknown, questionType: string): string[] {
  if (questionType === "fill_in_the_blanks") {
    if (!Array.isArray(guideAnswer)) {
      return [];
    }
    return guideAnswer.map((item) => (item == null ? "" : String(item)));
  }
  return normalizeGuideAnswerToArray(guideAnswer);
}

export function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.map((item) => (item == null ? "" : String(item)));
}
