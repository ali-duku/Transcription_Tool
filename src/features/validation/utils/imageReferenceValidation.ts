import type { TranscriptionDocumentState } from "../../shell/state/documentReducer";

interface ImageIndexSet {
  all: number[];
  unique: number[];
}

function extractImageIndices(text: string | null | undefined): number[] {
  const source = text ?? "";
  if (!source) {
    return [];
  }
  const indices: number[] = [];
  const pattern = /!\[[\s\S]*?\]\(\s*(\d+)\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    indices.push(Number.parseInt(match[1], 10));
  }
  return indices.filter((value) => Number.isInteger(value) && value >= 0);
}

function uniqueValues(values: number[]): number[] {
  return Array.from(new Set(values));
}

function duplicateValues(values: number[]): number[] {
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }
    seen.add(value);
  });
  return Array.from(duplicates).sort((a, b) => a - b);
}

function expectedSequence(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

function toIndexSet(values: number[]): ImageIndexSet {
  return {
    all: values,
    unique: uniqueValues(values)
  };
}

function streamOrderingErrors(
  scope: string,
  indices: ImageIndexSet,
  streamLabel: string,
  errors: string[]
) {
  if (indices.unique.length === 0) {
    return;
  }
  const sorted = [...indices.unique].sort((a, b) => a - b);
  if (sorted[0] !== 0) {
    errors.push(`${scope}: ${streamLabel} image indices must start from 0 (found ${sorted[0]}).`);
  }
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      errors.push(
        `${scope}: ${streamLabel} image index sequence has a gap between ${sorted[i - 1]} and ${sorted[i]}.`
      );
    }
  }
  const expected = expectedSequence(indices.unique.length);
  if (JSON.stringify(indices.all) !== JSON.stringify(expected)) {
    errors.push(
      `${scope}: ${streamLabel} image indices must appear in order ${JSON.stringify(expected)}; found ${JSON.stringify(indices.all)}.`
    );
  }
}

function streamConsistencyErrors(
  scope: string,
  streamLabel: string,
  indices: ImageIndexSet,
  imageRows: unknown[] | null | undefined,
  errors: string[]
) {
  const rowCount = Array.isArray(imageRows) ? imageRows.length : 0;
  const uniqueIndexSet = new Set(indices.unique);

  if (indices.all.length > 0 && rowCount === 0) {
    errors.push(`${scope}: ${streamLabel} image references exist but no image rows are defined.`);
  }

  if (rowCount > 0) {
    for (let i = 0; i < rowCount; i += 1) {
      if (!uniqueIndexSet.has(i)) {
        errors.push(
          `${scope}: Unused ${streamLabel.toLowerCase()} image row #${i + 1} (index ${i}) has no matching reference.`
        );
      }
    }
  }

  const duplicates = duplicateValues(indices.all);
  if (duplicates.length > 0) {
    errors.push(
      `${scope}: Duplicate ${streamLabel.toLowerCase()} image references found for indices ${JSON.stringify(duplicates)}.`
    );
  }

  if (indices.unique.length !== rowCount) {
    errors.push(
      `${scope}: ${streamLabel} image reference count (unique ${indices.unique.length}) does not match image rows (${rowCount}).`
    );
  }

  if (indices.all.length > 0 && rowCount > 0) {
    streamOrderingErrors(scope, indices, streamLabel, errors);
  }
}

function contentStreamIndices(section: TranscriptionDocumentState["instructional_content"][number]): ImageIndexSet {
  return toIndexSet(extractImageIndices(section.text));
}

function questionStreamIndices(
  question: TranscriptionDocumentState["practice_questions"][number]
): ImageIndexSet {
  const texts: string[] = [];
  texts.push(question.canonical.setup_text ?? "");
  texts.push(question.canonical.question ?? "");
  (question.canonical.options ?? []).forEach((option) => {
    if (option !== "---") {
      texts.push(option);
    }
  });
  const all = texts.flatMap((text) => extractImageIndices(text));
  return toIndexSet(all);
}

function guideAnswerStreamIndices(
  question: TranscriptionDocumentState["practice_questions"][number]
): ImageIndexSet {
  const all = (question.canonical.guide_answer ?? []).flatMap((entry) => extractImageIndices(entry));
  return toIndexSet(all);
}

export function validateImageReferenceConsistency(
  state: TranscriptionDocumentState,
  errors: string[]
) {
  state.instructional_content.forEach((section, index) => {
    const scope = `Content Section ${index + 1}`;
    const contentIndices = contentStreamIndices(section);
    streamConsistencyErrors(scope, "Content", contentIndices, section.images, errors);
  });

  state.practice_questions.forEach((question, index) => {
    const scope = `Question ${index + 1}`;
    const questionIndices = questionStreamIndices(question);
    streamConsistencyErrors(scope, "Question", questionIndices, question.canonical.question_images, errors);

    const guideIndices = guideAnswerStreamIndices(question);
    streamConsistencyErrors(
      scope,
      "Guide answer",
      guideIndices,
      question.canonical.guide_answer_images,
      errors
    );
  });
}
