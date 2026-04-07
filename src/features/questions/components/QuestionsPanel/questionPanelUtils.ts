import type { CanonicalQuestionExport } from "../../../../domain/schema/questionSchemaAdapter";
import type { QuestionState } from "../../state/questionsReducer";

const BLANK_TOKEN_PATTERN = /___\s*(\d+)\s*___/g;

export function extractBlankTokenIds(questionText: string): string[] {
  const matches = [...(questionText ?? "").matchAll(BLANK_TOKEN_PATTERN)];
  return matches.map((match) => match[1] ?? "");
}

export function syncBlankAnswersWithQuestion(questionText: string, answers: string[] | null | undefined): string[] {
  const tokenCount = extractBlankTokenIds(questionText).length;
  const normalizedAnswers = Array.isArray(answers) ? answers : [];
  return Array.from({ length: tokenCount }, (_, index) => normalizedAnswers[index] ?? "");
}

export function appendNextBlankToken(questionText: string): string {
  const tokenIds = extractBlankTokenIds(questionText)
    .map((token) => Number.parseInt(token, 10))
    .filter((value) => Number.isInteger(value));
  const nextId = tokenIds.length === 0 ? 1 : Math.max(...tokenIds) + 1;
  const token = `___${nextId}___`;
  const base = (questionText ?? "").trimEnd();
  return base.length === 0 ? token : `${base} ${token}`;
}

export function normalizeQuestionForType(
  canonical: CanonicalQuestionExport,
  questionType: string
): CanonicalQuestionExport {
  const normalized: CanonicalQuestionExport = {
    ...canonical,
    question_type: questionType
  };

  if (questionType === "multiple_choice" || questionType === "checkbox") {
    normalized.options = Array.isArray(canonical.options) && canonical.options.length > 0
      ? canonical.options
      : ["Option 1"];
    normalized.guide_answer = [];
    normalized.guide_answer_images = null;
    return normalized;
  }

  if (questionType === "fill_in_the_blanks") {
    normalized.options = null;
    normalized.guide_answer = syncBlankAnswersWithQuestion(
      canonical.question,
      Array.isArray(canonical.guide_answer) ? canonical.guide_answer : []
    );
    normalized.guide_answer_images = null;
    return normalized;
  }

  if (questionType === "matching") {
    normalized.options = Array.isArray(canonical.options) && canonical.options.length > 0
      ? canonical.options
      : ["---"];
    normalized.guide_answer = Array.isArray(canonical.guide_answer) ? canonical.guide_answer : [];
    normalized.guide_answer_images = null;
    return normalized;
  }

  normalized.options = null;
  normalized.guide_answer = canonical.guide_answer.length > 0 ? [canonical.guide_answer[0]] : [];
  normalized.guide_answer_images = Array.isArray(canonical.guide_answer_images)
    ? canonical.guide_answer_images
    : [];
  return normalized;
}

export function updateQuestionDraft(
  row: QuestionState,
  patch: Partial<CanonicalQuestionExport>
): CanonicalQuestionExport {
  return {
    ...row.canonical,
    ...patch
  };
}

export function splitMatchingOptions(options: string[] | null): { left: string[]; right: string[] } {
  const normalized = Array.isArray(options) ? options : [];
  const separator = normalized.indexOf("---");
  if (separator < 0) {
    return { left: normalized, right: [] };
  }
  return {
    left: normalized.slice(0, separator),
    right: normalized.slice(separator + 1)
  };
}

export function parseMultiline(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function parseIntegerOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}
