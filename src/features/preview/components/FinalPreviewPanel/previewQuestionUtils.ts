import type { CanonicalQuestionExport } from "../../../../domain/schema/questionSchemaAdapter";

interface BboxLike {
  page?: unknown;
  position?: unknown;
}

function isPoint(value: unknown): value is [unknown, unknown] {
  return Array.isArray(value) && value.length === 2;
}

function isPosition(value: unknown): value is [[unknown, unknown], [unknown, unknown]] {
  return Array.isArray(value) && value.length === 2 && isPoint(value[0]) && isPoint(value[1]);
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

export interface MatchingRelationshipPreview {
  raw: string;
  left: string;
  right: string;
  leftLabel: string | null;
  rightLabel: string | null;
  validLeft: boolean;
  validRight: boolean;
}

export function questionTypeLabel(questionType: string): string {
  const labels: Record<string, string> = {
    free_form: "Free Form",
    multiple_choice: "Multiple Choice",
    checkbox: "Checkbox",
    fill_in_the_blanks: "Fill in the Blanks",
    matching: "Matching",
    annotate: "Annotate",
    create_table: "Create Table"
  };
  return labels[questionType] ?? questionType;
}

export function questionAnswerSummary(question: CanonicalQuestionExport): string {
  if (question.question_type === "multiple_choice") {
    return question.guide_answer[0] ?? "(none)";
  }
  if (question.question_type === "checkbox") {
    return question.guide_answer.length > 0 ? question.guide_answer.join(" | ") : "(none)";
  }
  if (question.question_type === "fill_in_the_blanks") {
    return question.guide_answer.length > 0
      ? question.guide_answer.map((answer, index) => `${index + 1}:${answer}`).join(" | ")
      : "(none)";
  }
  if (question.question_type === "matching") {
    return question.guide_answer.length > 0 ? question.guide_answer.join(" | ") : "(none)";
  }
  return question.guide_answer[0] ?? "(none)";
}

export function parseMatchingRelationships(
  question: CanonicalQuestionExport
): MatchingRelationshipPreview[] {
  if (question.question_type !== "matching") {
    return [];
  }

  const split = splitMatchingOptions(question.options);
  const leftSet = new Set(split.left.map((item) => item.trim()));
  const rightSet = new Set(split.right.map((item) => item.trim()));

  return (Array.isArray(question.guide_answer) ? question.guide_answer : []).map((entry) => {
    const raw = String(entry ?? "");
    const separator = raw.indexOf(":");
    if (separator < 0) {
      return {
        raw,
        left: raw.trim(),
        right: "",
        leftLabel: null,
        rightLabel: null,
        validLeft: false,
        validRight: false
      };
    }

    const left = raw.slice(0, separator).trim();
    const right = raw.slice(separator + 1).trim();
    const leftIndex = split.left.findIndex((item) => item.trim() === left);
    const rightIndex = split.right.findIndex((item) => item.trim() === right);
    return {
      raw,
      left,
      right,
      leftLabel: leftIndex >= 0 ? `L${leftIndex + 1}` : null,
      rightLabel: rightIndex >= 0 ? `R${rightIndex + 1}` : null,
      validLeft: leftSet.has(left),
      validRight: rightSet.has(right)
    };
  });
}

export function usesManualGuideAnswerInput(questionType: string): boolean {
  return questionType === "free_form" || questionType === "annotate" || questionType === "create_table";
}

export function fillInBlankAnswerPreview(
  questionText: string,
  answers: string[] | null | undefined
): string {
  const normalizedQuestion = questionText ?? "";
  const normalizedAnswers = Array.isArray(answers) ? answers : [];
  if (normalizedQuestion.trim().length === 0) {
    return "";
  }

  let result = normalizedQuestion;
  normalizedAnswers.forEach((answer, index) => {
    const blankNumber = index + 1;
    const escaped = String(blankNumber).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const token = new RegExp(`___\\s*${escaped}\\s*___`, "g");
    const replacement = `[Blank ${blankNumber}: ${(answer ?? "").trim() || "(empty)"}]`;
    result = result.replace(token, replacement);
  });
  return result;
}

export function formatImageRows(value: unknown[] | null): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }

  return value.map((item, index) => {
    if (!item || typeof item !== "object") {
      return `#${index + 1}: invalid row`;
    }
    const row = item as BboxLike;
    if (!isPosition(row.position)) {
      return `#${index + 1}: page=${String(row.page ?? "?")}, invalid position`;
    }
    const [[x1, y1], [x2, y2]] = row.position;
    return `#${index + 1}: page=${String(row.page ?? "?")} [${String(x1)},${String(y1)}]->[${String(x2)},${String(y2)}]`;
  });
}
