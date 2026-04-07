import { LEGACY_TYPE_FIELDS } from "../migration/legacyAliases";
import type {
  CanonicalQuestionExport,
  LegacyQuestionShape,
  QuestionPayloadShape
} from "./questionSchemaAdapterTypes";
import {
  hasOwn,
  isChoiceBasedType,
  isPlainObject,
  normalizeGuideAnswerForType,
  normalizeGuideAnswerToArray,
  normalizeIntegerOrNull,
  normalizePositiveInteger,
  normalizeQuestionType,
  normalizeStringArray,
  supportsGuideAnswerImagesForType
} from "./questionSchemaAdapterTypes";

export function pruneDeprecatedQuestionFields(rawQuestion: unknown): LegacyQuestionShape {
  const source = isPlainObject(rawQuestion) ? (rawQuestion as LegacyQuestionShape) : {};
  const pruned: LegacyQuestionShape = { ...source };
  delete pruned.related_question;
  return pruned;
}

export function normalizeQuestionKeyAliases(rawQuestion: unknown): LegacyQuestionShape {
  const source = pruneDeprecatedQuestionFields(rawQuestion);
  const normalized: LegacyQuestionShape = { ...source };

  if ((normalized.question === undefined || normalized.question === null) && normalized.question_text !== undefined) {
    normalized.question = normalized.question_text;
  }

  if ((normalized.setup_text === undefined || normalized.setup_text === null) && normalized.set_up_text !== undefined) {
    normalized.setup_text = normalized.set_up_text;
  }

  delete normalized.question_text;
  delete normalized.set_up_text;
  return normalized;
}

export function classifyPayloadShape(rawQuestion: unknown): QuestionPayloadShape {
  const source = isPlainObject(rawQuestion) ? rawQuestion : {};
  const hasLegacyTypeFields = LEGACY_TYPE_FIELDS.some((field) => hasOwn(source, field));
  const hasLegacyGuideAnswer = typeof source.guide_answer === "string";
  const hasNewGuideAnswer = Array.isArray(source.guide_answer);
  const hasNewOptions = hasOwn(source, "options");
  const hasNewDifficulty = hasOwn(source, "difficulty");
  const hasLegacySignals = hasLegacyTypeFields || hasLegacyGuideAnswer;
  const hasNewSignals = hasNewGuideAnswer || hasNewOptions || hasNewDifficulty;

  if (hasLegacySignals && hasNewSignals) {
    return "mixed";
  }
  if (hasNewSignals) {
    return "new";
  }
  if (hasLegacySignals) {
    return "legacy";
  }
  return "unknown";
}

function normalizeLegacyBlankValues(valuesLike: unknown): string[] {
  if (!Array.isArray(valuesLike)) {
    return [];
  }
  return valuesLike.map((item) => (item == null ? "" : String(item)));
}

export function normalizeLegacyMatchingSide(itemsLike: unknown): string[] {
  if (!Array.isArray(itemsLike)) {
    return [];
  }
  return itemsLike.map((item) => (item == null ? "" : String(item)));
}

export function splitMatchingOptions(optionsLike: unknown): { left: string[]; right: string[] } {
  if (!Array.isArray(optionsLike)) {
    return { left: [], right: [] };
  }
  const normalizedOptions = optionsLike.map((item) => (item == null ? "" : String(item)));
  const separatorIndex = normalizedOptions.indexOf("---");
  if (separatorIndex < 0) {
    return { left: normalizedOptions, right: [] };
  }
  return {
    left: normalizedOptions.slice(0, separatorIndex),
    right: normalizedOptions.slice(separatorIndex + 1)
  };
}

function buildMatchingOptionsFromSides(leftItems: unknown, rightItems: unknown): string[] {
  const left = Array.isArray(leftItems) ? leftItems.map((item) => (item == null ? "" : String(item))) : [];
  const right = Array.isArray(rightItems)
    ? rightItems.map((item) => (item == null ? "" : String(item)))
    : [];

  if (left.length === 0 && right.length === 0) {
    return [];
  }
  return [...left, "---", ...right];
}

function buildGuideAnswerForFillInTheBlanks(source: LegacyQuestionShape): string[] {
  if (Array.isArray(source.guide_answer)) {
    return normalizeGuideAnswerForType(source.guide_answer, "fill_in_the_blanks");
  }
  return normalizeLegacyBlankValues(source.values);
}

function buildGuideAnswerForMatching(source: LegacyQuestionShape, options: string[] | null): string[] {
  if (Array.isArray(source.guide_answer)) {
    return normalizeGuideAnswerToArray(source.guide_answer);
  }

  if (!Array.isArray(source.relationship)) {
    return [];
  }

  const sidesFromOptions = splitMatchingOptions(options);
  const hasOptionsSides = sidesFromOptions.left.length > 0 || sidesFromOptions.right.length > 0;
  const left = hasOptionsSides ? sidesFromOptions.left : normalizeLegacyMatchingSide(source.left);
  const right = hasOptionsSides ? sidesFromOptions.right : normalizeLegacyMatchingSide(source.right);
  const pairs: string[] = [];

  source.relationship.forEach((rel) => {
    if (!Array.isArray(rel) || rel.length !== 2) {
      return;
    }
    const leftIndex = normalizePositiveInteger(rel[0]);
    const rightIndex = normalizePositiveInteger(rel[1]);
    if (!leftIndex || !rightIndex) {
      return;
    }
    if (leftIndex > left.length || rightIndex > right.length) {
      return;
    }
    pairs.push(`${left[leftIndex - 1]}:${right[rightIndex - 1]}`);
  });

  return pairs;
}

function normalizeLegacyChoices(choicesLike: unknown): Array<{ text: string; checked: boolean }> {
  if (!Array.isArray(choicesLike)) {
    return [];
  }

  return choicesLike
    .map((choice) => {
      if (isPlainObject(choice)) {
        return {
          text: choice.text == null ? "" : String(choice.text).trim(),
          checked:
            choice.checked === true ||
            choice.checked === 1 ||
            choice.checked === "1" ||
            choice.checked === "true"
        };
      }
      return {
        text: String(choice == null ? "" : choice).trim(),
        checked: false
      };
    })
    .filter((choice) => choice.text !== "");
}

function normalizeOptionsForType(source: LegacyQuestionShape, questionType: string): string[] | null {
  if (isChoiceBasedType(questionType)) {
    if (Array.isArray(source.options)) {
      return source.options
        .map((item) => String(item == null ? "" : item).trim())
        .filter((item) => item !== "");
    }
    const legacyChoices = normalizeLegacyChoices(source.choices);
    return legacyChoices.map((choice) => choice.text);
  }

  if (questionType === "matching") {
    if (Array.isArray(source.options)) {
      return source.options.map((item) => (item == null ? "" : String(item)));
    }
    return buildMatchingOptionsFromSides(source.left, source.right);
  }

  if (questionType === "fill_in_the_blanks") {
    return null;
  }

  return normalizeStringArray(source.options);
}

function buildGuideAnswerForChoiceType(
  source: LegacyQuestionShape,
  questionType: string,
  options: string[] | null
): string[] {
  const normalizedOptions = Array.isArray(options) ? options : [];
  const hasNewGuideAnswer = Array.isArray(source.guide_answer);

  if (questionType === "multiple_choice") {
    if (hasNewGuideAnswer) {
      const normalizedArray = normalizeGuideAnswerToArray(source.guide_answer);
      return normalizedArray.length === 0 ? [] : [normalizedArray[0]];
    }
    const correctIndex = normalizePositiveInteger(
      hasOwn(source, "correct_answer_index") ? source.correct_answer_index : source.value
    );
    if (correctIndex && correctIndex <= normalizedOptions.length) {
      return [normalizedOptions[correctIndex - 1]];
    }
    return [];
  }

  if (hasNewGuideAnswer) {
    const normalizedArray = normalizeGuideAnswerToArray(source.guide_answer);
    if (normalizedOptions.length === 0) {
      return normalizedArray;
    }
    const optionSet = new Set(normalizedOptions);
    return normalizedArray.filter((answer) => optionSet.has(answer));
  }

  if (Array.isArray(source.values)) {
    const sourceValues = source.values;
    if (sourceValues.length === 0) {
      return [];
    }
    const selected: string[] = [];
    normalizedOptions.forEach((text, index) => {
      const value = sourceValues[index];
      if (value === true || value === 1 || value === "1" || value === "true") {
        selected.push(text);
      }
    });
    return selected;
  }

  const legacyChoices = normalizeLegacyChoices(source.choices);
  return legacyChoices.filter((choice) => choice.checked).map((choice) => choice.text);
}

export function buildCanonicalDraftFromSource(rawSource: unknown): CanonicalQuestionExport {
  const source = normalizeQuestionKeyAliases(rawSource);
  const questionType = normalizeQuestionType(source.question_type);
  const options = normalizeOptionsForType(source, questionType);

  let guideAnswer: string[];
  if (isChoiceBasedType(questionType)) {
    guideAnswer = buildGuideAnswerForChoiceType(source, questionType, options);
  } else if (questionType === "fill_in_the_blanks") {
    guideAnswer = buildGuideAnswerForFillInTheBlanks(source);
  } else if (questionType === "matching") {
    guideAnswer = buildGuideAnswerForMatching(source, options);
  } else {
    guideAnswer = normalizeGuideAnswerForType(source.guide_answer, questionType);
  }

  const guideAnswerImages = supportsGuideAnswerImagesForType(questionType)
    ? (Array.isArray(source.guide_answer_images) ? source.guide_answer_images : null)
    : null;

  return {
    id: source.id == null ? "" : String(source.id),
    question_type: questionType,
    question: source.question == null ? "" : String(source.question),
    setup_text:
      source.setup_text === undefined || source.setup_text === null || source.setup_text === ""
        ? null
        : String(source.setup_text),
    question_images: Array.isArray(source.question_images) ? source.question_images : null,
    guide_pdf_page: normalizeIntegerOrNull(source.guide_pdf_page),
    guide_answer_images: guideAnswerImages,
    guide_answer: guideAnswer,
    options,
    difficulty: null
  };
}

export function buildCanonicalDraft(questionLike: unknown): CanonicalQuestionExport {
  return buildCanonicalDraftFromSource(questionLike);
}
