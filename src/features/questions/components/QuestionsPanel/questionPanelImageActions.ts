import type { CanonicalQuestionExport } from "../../../../domain/schema/questionSchemaAdapter";
import {
  appendImageReferenceToken,
  appendImageReferenceTokenAtIndex
} from "../../../../shared/utils/imageReference";
import { appendLoosePagedBboxRow } from "../../../../shared/utils/pagedBbox";
import type { QuestionState } from "../../state/questionsReducer";

type ImageTextField = "question" | "setup_text";

export function questionImageCount(row: QuestionState): number {
  return Array.isArray(row.canonical.question_images) ? row.canonical.question_images.length : 0;
}

export function buildQuestionImageRefPatch(
  row: QuestionState,
  field: ImageTextField
): Partial<CanonicalQuestionExport> | null {
  const imageCount = questionImageCount(row);
  if (imageCount <= 0) {
    return null;
  }
  if (field === "question") {
    return {
      question: appendImageReferenceToken(row.canonical.question, imageCount)
    };
  }
  return {
    setup_text: appendImageReferenceToken(row.canonical.setup_text ?? "", imageCount)
  };
}

export function buildQuestionImageInsertPatch(
  row: QuestionState,
  field: ImageTextField,
  description: string,
  preferredPage: number | null
): Partial<CanonicalQuestionExport> {
  const nextIndex = questionImageCount(row);
  const nextImages = appendLoosePagedBboxRow(row.canonical.question_images, preferredPage);
  if (field === "question") {
    return {
      question: appendImageReferenceTokenAtIndex(row.canonical.question, nextIndex, description),
      question_images: nextImages
    };
  }
  return {
    setup_text: appendImageReferenceTokenAtIndex(row.canonical.setup_text ?? "", nextIndex, description),
    question_images: nextImages
  };
}
