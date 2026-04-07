import type { TranscriptionDocumentState } from "../../shell/state/documentReducer";
import { validatePagedBboxArray } from "../utils/pagedBboxValidation";
import { validateTextContent } from "../utils/textContentValidation";

function isWholeNumber(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return false;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed);
}

function parseBlankTokens(questionText: string): string[] {
  const matches = questionText.match(/___\d+___/g);
  return matches ?? [];
}

function parseStrictBlankTokens(questionText: string): {
  allMarkers: string[];
  tokenNumbers: number[];
  invalidMarkers: string[];
} {
  const allMarkers = [...questionText.matchAll(/___(.*?)___/g)].map((match) => match[1] ?? "");
  const tokenNumbers: number[] = [];
  const invalidMarkers: string[] = [];

  allMarkers.forEach((marker) => {
    if (/^\d+$/.test(marker)) {
      tokenNumbers.push(Number.parseInt(marker, 10));
      return;
    }
    invalidMarkers.push(marker);
  });

  return { allMarkers, tokenNumbers, invalidMarkers };
}

function findDuplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((value) => {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }
    if (seen.has(normalized)) {
      duplicates.add(normalized);
      return;
    }
    seen.add(normalized);
  });
  return Array.from(duplicates);
}

function splitMatchingOptions(options: string[] | null): { left: string[]; right: string[]; hasSingleSeparator: boolean } {
  if (!Array.isArray(options)) {
    return { left: [], right: [], hasSingleSeparator: false };
  }
  const separatorIndices = options
    .map((item, index) => ({ item, index }))
    .filter((entry) => entry.item === "---")
    .map((entry) => entry.index);

  if (separatorIndices.length !== 1) {
    return { left: [], right: [], hasSingleSeparator: false };
  }

  const separator = separatorIndices[0];
  return {
    left: options.slice(0, separator),
    right: options.slice(separator + 1),
    hasSingleSeparator: true
  };
}

function usesManualGuideAnswerInput(questionType: string): boolean {
  return questionType === "free_form" || questionType === "annotate" || questionType === "create_table";
}

function hasGuidebookRange(state: TranscriptionDocumentState): state is TranscriptionDocumentState & {
  guidebook_pdf_pages: [number, number];
} {
  return Array.isArray(state.guidebook_pdf_pages) && state.guidebook_pdf_pages.length === 2;
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

export function validateQuestions(
  state: TranscriptionDocumentState,
  errors: string[],
  warnings: string[]
) {
  const duplicateIdMap = new Map<string, number>();
  const guideRange = hasGuidebookRange(state) ? state.guidebook_pdf_pages : null;

  state.practice_questions.forEach((question, index) => {
    const questionNumber = index + 1;
    const canonical = question.canonical;
    const questionType = canonical.question_type;
    const questionId = canonical.id.trim();
    const questionText = canonical.question.trim();

    if (guideRange) {
      const guidePage = canonical.guide_pdf_page;
      if (guidePage == null) {
        errors.push(`Question ${questionNumber}: Guide PDF page is required when guidebook range is set.`);
      } else if (!isWholeNumber(guidePage)) {
        errors.push(`Question ${questionNumber}: Guide PDF page must be a whole number.`);
      } else if (guidePage < guideRange[0] || guidePage > guideRange[1]) {
        errors.push(
          `Question ${questionNumber}: Guide PDF page (${guidePage}) must be within guidebook range (${guideRange[0]}-${guideRange[1]}).`
        );
      }

      if (usesManualGuideAnswerInput(questionType) && canonical.guide_answer.length === 0) {
        errors.push(`Question ${questionNumber}: Guide answer is required for ${questionType} when guidebook range is set.`);
      }
    }

    if (!questionId) {
      errors.push(`Question ${questionNumber}: Question ID is required.`);
    } else if (duplicateIdMap.has(questionId)) {
      errors.push(
        `Duplicate Question ID "${questionId}" found in Question ${questionNumber} (also in Question ${duplicateIdMap.get(questionId)}).`
      );
    } else {
      duplicateIdMap.set(questionId, questionNumber);
    }

    if (!questionText || /^\d+$/.test(questionText)) {
      warnings.push(`Question ${questionNumber}: Question text is empty or numeric-only.`);
    }
    appendTextContentValidation(canonical.question, `Question ${questionNumber}: Question text`, errors, warnings);
    appendTextContentValidation(canonical.setup_text, `Question ${questionNumber}: Set-up text`, errors, warnings);

    validatePagedBboxArray(canonical.question_images, `Question ${questionNumber}: Question`, errors);
    if (usesManualGuideAnswerInput(questionType)) {
      validatePagedBboxArray(
        canonical.guide_answer_images,
        `Question ${questionNumber}: Guide Answer`,
        errors
      );
    }

    if (questionType === "multiple_choice" || questionType === "checkbox") {
      const options = canonical.options ?? [];
      if (!Array.isArray(options) || options.length === 0) {
        errors.push(`Question ${questionNumber}: ${questionType === "multiple_choice" ? "Multiple choice" : "Checkbox"} must have at least one option.`);
      }
      const emptyOptions = options.filter((option) => option.trim().length === 0);
      if (emptyOptions.length > 0) {
        errors.push(`Question ${questionNumber}: Choice options cannot be empty.`);
      }
      const duplicateOptions = findDuplicateValues(options);
      duplicateOptions.forEach((duplicate) => {
        errors.push(`Question ${questionNumber}: Duplicate choice option "${duplicate}" is not allowed.`);
      });
      options.forEach((option, optionIndex) => {
        appendTextContentValidation(
          option,
          `Question ${questionNumber}: Option ${optionIndex + 1}`,
          errors,
          warnings
        );
      });
      if (questionType === "multiple_choice") {
        if (canonical.guide_answer.length !== 1) {
          errors.push(`Question ${questionNumber}: Multiple choice must have exactly one correct answer.`);
        } else if (!options.includes(canonical.guide_answer[0])) {
          errors.push(`Question ${questionNumber}: Correct answer must match an existing option.`);
        }
      } else {
        canonical.guide_answer.forEach((answer) => {
          if (!options.includes(answer)) {
            errors.push(`Question ${questionNumber}: Checkbox answer "${answer}" is not in options.`);
          }
        });
        if (guideRange && canonical.guide_answer.length === 0) {
          errors.push(`Question ${questionNumber}: Checkbox requires at least one correct answer when guidebook range is set.`);
        }
      }
      return;
    }

    if (questionType === "fill_in_the_blanks") {
      if (!questionText || /^\d+$/.test(questionText)) {
        // Legacy behavior: empty/numeric-only FITB question text is warning-only.
        return;
      }

      const tokens = parseBlankTokens(canonical.question);
      const strictTokens = parseStrictBlankTokens(canonical.question);
      if (tokens.length === 0) {
        errors.push(`Question ${questionNumber}: Fill in the blanks requires ___n___ markers in question text.`);
      }
      if (strictTokens.invalidMarkers.length > 0) {
        errors.push(`Question ${questionNumber}: Fill in the blanks markers must use exact ___n___ format.`);
      }
      const uniqueNumbers = new Set(strictTokens.tokenNumbers);
      if (uniqueNumbers.size !== strictTokens.tokenNumbers.length) {
        errors.push(`Question ${questionNumber}: Fill in the blanks marker numbers must be unique.`);
      }
      strictTokens.tokenNumbers.forEach((token, tokenIndex) => {
        const expected = tokenIndex + 1;
        if (token !== expected) {
          errors.push(`Question ${questionNumber}: Fill in the blanks marker order must be ___1___, ___2___, ... with no gaps.`);
        }
      });
      if (canonical.guide_answer.length !== tokens.length) {
        errors.push(
          `Question ${questionNumber}: Number of blank answers (${canonical.guide_answer.length}) must match tokens (${tokens.length}).`
        );
      }
      return;
    }

    if (questionType === "matching") {
      const split = splitMatchingOptions(canonical.options ?? []);
      if (!split.hasSingleSeparator) {
        errors.push(`Question ${questionNumber}: Matching options must contain exactly one '---' separator.`);
      }
      if (split.left.length === 0) {
        errors.push(`Question ${questionNumber}: Matching requires at least one left item.`);
      }
      if (split.right.length === 0) {
        errors.push(`Question ${questionNumber}: Matching requires at least one right item.`);
      }
      if (guideRange && canonical.guide_answer.length === 0) {
        errors.push(`Question ${questionNumber}: Matching requires at least one relationship when guidebook range is set.`);
      }
      split.left.forEach((item, itemIndex) => {
        appendTextContentValidation(
          item,
          `Question ${questionNumber}: Matching left item ${itemIndex + 1}`,
          errors,
          warnings
        );
      });
      split.right.forEach((item, itemIndex) => {
        appendTextContentValidation(
          item,
          `Question ${questionNumber}: Matching right item ${itemIndex + 1}`,
          errors,
          warnings
        );
      });
      canonical.guide_answer.forEach((pair) => {
        appendTextContentValidation(
          pair,
          `Question ${questionNumber}: Matching relationship`,
          errors,
          warnings
        );
        const separator = pair.indexOf(":");
        if (separator < 0) {
          errors.push(`Question ${questionNumber}: Matching relationship "${pair}" must be in left:right format.`);
          return;
        }
        const left = pair.slice(0, separator).trim();
        const right = pair.slice(separator + 1).trim();
        if (left.length === 0 || right.length === 0) {
          errors.push(`Question ${questionNumber}: Matching relationship "${pair}" cannot have empty left/right values.`);
          return;
        }
        if (!split.left.includes(left) || !split.right.includes(right)) {
          errors.push(
            `Question ${questionNumber}: Matching relationship "${pair}" must map existing left/right items.`
          );
        }
      });
      return;
    }

    if (usesManualGuideAnswerInput(questionType)) {
      appendTextContentValidation(
        canonical.guide_answer[0] ?? "",
        `Question ${questionNumber}: Guide answer`,
        errors,
        warnings
      );
    }
  });
}
