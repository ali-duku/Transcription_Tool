import {
  QuestionSchemaAdapter,
  type CanonicalQuestionExport
} from "../schema/questionSchemaAdapter";

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return !!(value && typeof value === "object" && !Array.isArray(value));
}

export function normalizeQuestionKeysOnLoad<T>(data: T): T {
  if (!isPlainObject(data)) {
    return data;
  }

  const questions = Array.isArray(data.practice_questions) ? data.practice_questions : [];
  questions.forEach((question, index) => {
    if (!isPlainObject(question)) {
      return;
    }
    const normalized = QuestionSchemaAdapter.normalizeIncoming(question);
    questions[index] = normalized.canonical;
  });

  return data;
}

export function normalizeQuestionArrayToCanonical(questions: unknown): CanonicalQuestionExport[] {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .filter((question) => isPlainObject(question))
    .map((question) => QuestionSchemaAdapter.normalizeIncoming(question).canonical);
}
