import { QUESTION_SCHEMA_MIGRATION_PHASE } from "../../shared/constants/appConstants";
import {
  buildCanonicalDraft,
  buildCanonicalDraftFromSource,
  classifyPayloadShape,
  normalizeQuestionKeyAliases
} from "./questionSchemaAdapterIncoming";
import { buildLegacyBridgeFromCanonical, toLegacyExport } from "./questionSchemaAdapterLegacy";
import type {
  CanonicalQuestionExport,
  LegacyQuestionShape,
  NormalizedQuestionPayload
} from "./questionSchemaAdapterTypes";
import {
  isPlainObject,
  normalizeGuideAnswerForType,
  normalizeGuideAnswerToArray,
  normalizeQuestionType,
  supportsGuideAnswerImagesForType
} from "./questionSchemaAdapterTypes";

export type {
  CanonicalQuestionExport,
  LegacyQuestionShape,
  NormalizedQuestionPayload,
  QuestionPayloadShape
} from "./questionSchemaAdapterTypes";

function toSchemaExport(input: unknown): CanonicalQuestionExport {
  const canonical =
    isPlainObject(input) && isPlainObject(input.canonical)
      ? (input.canonical as unknown as CanonicalQuestionExport)
      : buildCanonicalDraft(input);

  const questionType = normalizeQuestionType(canonical.question_type);
  const normalizedGuideAnswer = normalizeGuideAnswerForType(canonical.guide_answer, questionType);
  const normalizedOptions =
    questionType === "multiple_choice" || questionType === "checkbox" || questionType === "matching"
      ? Array.isArray(canonical.options)
        ? canonical.options
        : []
      : null;

  const normalizedQuestionImages = Array.isArray(canonical.question_images) ? canonical.question_images : null;
  const normalizedGuideAnswerImages = supportsGuideAnswerImagesForType(questionType)
    ? Array.isArray(canonical.guide_answer_images)
      ? canonical.guide_answer_images
      : null
    : null;

  return {
    id: canonical.id,
    difficulty: null,
    question_type: questionType,
    guide_pdf_page: canonical.guide_pdf_page,
    setup_text: canonical.setup_text,
    question: canonical.question,
    options: normalizedOptions,
    question_images: normalizedQuestionImages,
    guide_answer: normalizedGuideAnswer,
    guide_answer_images: normalizedGuideAnswerImages
  };
}

function toPopulateShape(input: unknown): LegacyQuestionShape {
  const canonical =
    isPlainObject(input) && isPlainObject(input.canonical)
      ? (input.canonical as unknown as CanonicalQuestionExport)
      : buildCanonicalDraft(input);

  return buildLegacyBridgeFromCanonical({}, canonical);
}

function toPhaseExport(input: unknown): LegacyQuestionShape | CanonicalQuestionExport {
  if (QUESTION_SCHEMA_MIGRATION_PHASE === "global_scaffold") {
    return toLegacyExport(input);
  }
  return toSchemaExport(input);
}

function normalizeIncoming(rawQuestion: unknown): NormalizedQuestionPayload {
  const source = normalizeQuestionKeyAliases(rawQuestion);
  const payloadShape = classifyPayloadShape(source);
  const canonical = buildCanonicalDraftFromSource(source);
  const populateShape = buildLegacyBridgeFromCanonical(source, canonical);

  return {
    canonical,
    populateShape,
    legacyExport: populateShape,
    payloadShape
  };
}

function fromUI(legacyQuestionLike: unknown): NormalizedQuestionPayload {
  const normalized = normalizeIncoming(legacyQuestionLike);
  return {
    canonical: normalized.canonical,
    populateShape: normalized.populateShape,
    legacyExport: normalized.populateShape,
    payloadShape: normalized.payloadShape
  };
}

export const QuestionSchemaAdapter = {
  fromUI,
  normalizeIncoming,
  toLegacyExport,
  toSchemaExport,
  toPopulateShape,
  toPhaseExport,
  classifyPayloadShape,
  normalizeGuideAnswerToArray,
  normalizeQuestionKeyAliases
};
