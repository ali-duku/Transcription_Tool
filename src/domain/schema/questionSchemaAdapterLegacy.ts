import type { CanonicalQuestionExport, LegacyQuestionShape, PlainObject } from "./questionSchemaAdapterTypes";
import {
  isPlainObject,
  normalizeGuideAnswerForType,
  normalizeGuideAnswerToArray,
  normalizePositiveInteger,
  usesManualGuideAnswerInput
} from "./questionSchemaAdapterTypes";
import {
  buildCanonicalDraft,
  normalizeLegacyMatchingSide,
  normalizeQuestionKeyAliases,
  pruneDeprecatedQuestionFields,
  splitMatchingOptions
} from "./questionSchemaAdapterIncoming";

function buildLegacyMatchingRelationships(
  guideAnswer: unknown,
  left: string[],
  right: string[]
): Array<[number, number]> {
  const leftIndexByText = new Map<string, number>();
  const rightIndexByText = new Map<string, number>();

  left.forEach((text, index) => {
    if (!leftIndexByText.has(text)) {
      leftIndexByText.set(text, index + 1);
    }
    const trimmed = String(text == null ? "" : text).trim();
    if (trimmed !== "" && !leftIndexByText.has(trimmed)) {
      leftIndexByText.set(trimmed, index + 1);
    }
  });

  right.forEach((text, index) => {
    if (!rightIndexByText.has(text)) {
      rightIndexByText.set(text, index + 1);
    }
    const trimmed = String(text == null ? "" : text).trim();
    if (trimmed !== "" && !rightIndexByText.has(trimmed)) {
      rightIndexByText.set(trimmed, index + 1);
    }
  });

  const relationships: Array<[number, number]> = [];
  normalizeGuideAnswerToArray(guideAnswer).forEach((pair) => {
    const rawPair = String(pair == null ? "" : pair);
    const separatorIndex = rawPair.indexOf(":");
    if (separatorIndex < 0) {
      return;
    }
    const leftText = rawPair.slice(0, separatorIndex).trim();
    const rightText = rawPair.slice(separatorIndex + 1).trim();
    const leftIndex = leftIndexByText.get(leftText);
    const rightIndex = rightIndexByText.get(rightText);
    if (leftIndex && rightIndex) {
      relationships.push([leftIndex, rightIndex]);
    }
  });

  return relationships;
}

function guideAnswerArrayToLegacyString(guideAnswer: unknown, questionType = "free_form"): string {
  const normalized = normalizeGuideAnswerToArray(guideAnswer);
  if (normalized.length === 0) {
    return "";
  }
  return questionType === "matching" ? normalized.join("\n") : normalized[0];
}

function buildLegacyChoiceRowsFromOptions(
  options: string[] | null,
  checkedSet: Set<string> | null = null
): Array<{ text: string; checked?: boolean }> {
  const rows: Array<{ text: string; checked?: boolean }> = [];
  const normalizedOptions = Array.isArray(options) ? options : [];

  normalizedOptions.forEach((text) => {
    const row: { text: string; checked?: boolean } = { text };
    if (checkedSet) {
      row.checked = checkedSet.has(text);
    }
    rows.push(row);
  });

  return rows;
}

export function buildLegacyBridgeFromCanonical(
  rawSource: unknown,
  canonical: CanonicalQuestionExport
): LegacyQuestionShape {
  const source = normalizeQuestionKeyAliases(rawSource);
  const legacyExport: LegacyQuestionShape = { ...source };

  legacyExport.id = canonical.id;
  legacyExport.question_type = canonical.question_type;
  legacyExport.question = canonical.question;
  legacyExport.setup_text = canonical.setup_text;
  legacyExport.guide_pdf_page = canonical.guide_pdf_page;
  legacyExport.question_images = Array.isArray(source.question_images)
    ? source.question_images
    : Array.isArray(canonical.question_images)
      ? canonical.question_images
      : [];
  legacyExport.guide_answer_images = usesManualGuideAnswerInput(canonical.question_type)
    ? Array.isArray(source.guide_answer_images)
      ? source.guide_answer_images
      : Array.isArray(canonical.guide_answer_images)
        ? canonical.guide_answer_images
        : []
    : [];
  legacyExport.guide_answer = usesManualGuideAnswerInput(canonical.question_type)
    ? guideAnswerArrayToLegacyString(canonical.guide_answer, canonical.question_type)
    : "";

  if (canonical.question_type === "multiple_choice") {
    const options = Array.isArray(canonical.options) ? canonical.options : [];
    legacyExport.choices = buildLegacyChoiceRowsFromOptions(options);
    const correctText =
      Array.isArray(canonical.guide_answer) && canonical.guide_answer.length > 0
        ? canonical.guide_answer[0]
        : "";
    const correctIndex = correctText ? options.indexOf(correctText) : -1;
    legacyExport.value = correctIndex >= 0 ? correctIndex + 1 : null;
    delete legacyExport.values;
  } else if (canonical.question_type === "checkbox") {
    const options = Array.isArray(canonical.options) ? canonical.options : [];
    const selectedSet = new Set(normalizeGuideAnswerToArray(canonical.guide_answer));
    const boolValues = options.map((text) => selectedSet.has(text));
    legacyExport.values = boolValues.some(Boolean) ? boolValues : [];
    legacyExport.choices = buildLegacyChoiceRowsFromOptions(options, selectedSet);
    delete legacyExport.value;
  } else if (canonical.question_type === "fill_in_the_blanks") {
    legacyExport.values = normalizeGuideAnswerForType(canonical.guide_answer, canonical.question_type);
    delete legacyExport.choices;
    delete legacyExport.value;
    delete legacyExport.left;
    delete legacyExport.right;
    delete legacyExport.relationship;
  } else if (canonical.question_type === "matching") {
    const hasNewMatchingSignals = Array.isArray(source.options) || Array.isArray(source.guide_answer);
    if (
      !hasNewMatchingSignals &&
      Array.isArray(source.left) &&
      Array.isArray(source.right) &&
      Array.isArray(source.relationship)
    ) {
      legacyExport.left = normalizeLegacyMatchingSide(source.left);
      legacyExport.right = normalizeLegacyMatchingSide(source.right);
      legacyExport.relationship = source.relationship
        .filter((rel) => Array.isArray(rel) && rel.length === 2)
        .map((rel) => [normalizePositiveInteger(rel[0]) || 0, normalizePositiveInteger(rel[1]) || 0])
        .filter(([leftIdx, rightIdx]) => leftIdx > 0 && rightIdx > 0);
    } else {
      const sides = splitMatchingOptions(canonical.options);
      legacyExport.left = sides.left;
      legacyExport.right = sides.right;
      legacyExport.relationship = buildLegacyMatchingRelationships(
        canonical.guide_answer,
        sides.left,
        sides.right
      );
    }
    delete legacyExport.choices;
    delete legacyExport.value;
    delete legacyExport.values;
  }

  legacyExport.difficulty = null;
  return pruneDeprecatedQuestionFields(legacyExport);
}

export function toLegacyExport(input: unknown): LegacyQuestionShape {
  if (!isPlainObject(input)) {
    return {};
  }

  const inputRecord = input as PlainObject;
  if (isPlainObject(inputRecord.legacyExport) && isPlainObject(inputRecord.canonical)) {
    return buildLegacyBridgeFromCanonical(
      inputRecord.legacyExport,
      inputRecord.canonical as unknown as CanonicalQuestionExport
    );
  }

  const canonical = buildCanonicalDraft(input);
  return buildLegacyBridgeFromCanonical({}, canonical);
}
