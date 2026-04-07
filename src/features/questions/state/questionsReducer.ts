import {
  QuestionSchemaAdapter,
  type CanonicalQuestionExport,
  type LegacyQuestionShape,
  type NormalizedQuestionPayload,
  type QuestionPayloadShape
} from "../../../domain/schema/questionSchemaAdapter";
import { generateStableUid } from "./uidIdentity";
import { cloneDeep } from "../../../shared/utils/clone";

type Direction = "up" | "down";
type PasteMode = "replace" | "insert_after";

function cloneRows<T>(rows: T[]): T[] {
  return rows.map((row) => cloneDeep(row));
}

function clampInsertIndex(index: number | undefined, length: number): number {
  if (typeof index !== "number" || Number.isNaN(index)) {
    return length;
  }
  if (index <= 0) {
    return 0;
  }
  if (index >= length) {
    return length;
  }
  return index;
}

function moveRow<T>(rows: T[], index: number, direction: Direction): T[] {
  if (index < 0 || index >= rows.length) {
    return rows;
  }

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= rows.length) {
    return rows;
  }

  const next = cloneRows(rows);
  const current = next[index];
  next[index] = next[targetIndex];
  next[targetIndex] = current;
  return next;
}

export interface QuestionState {
  uid: string;
  canonical: CanonicalQuestionExport;
  populateShape: LegacyQuestionShape;
  legacyExport: LegacyQuestionShape;
  payloadShape: QuestionPayloadShape;
  collapsed: boolean;
}

export type QuestionsAction =
  | { type: "load"; payload: unknown }
  | { type: "reset" }
  | { type: "add"; index?: number; payload?: unknown }
  | { type: "remove"; index: number }
  | { type: "duplicate"; index: number }
  | { type: "move"; index: number; direction: Direction }
  | { type: "paste"; index: number; mode: PasteMode; payload: unknown }
  | { type: "replace"; index: number; payload: unknown }
  | { type: "update_canonical"; index: number; payload: unknown };

export function createQuestionState(payload?: unknown): QuestionState {
  const normalized = QuestionSchemaAdapter.normalizeIncoming(payload ?? {});
  return fromNormalizedQuestion(normalized);
}

function fromNormalizedQuestion(normalized: NormalizedQuestionPayload): QuestionState {
  return {
    uid: generateStableUid("question"),
    canonical: cloneDeep(normalized.canonical),
    populateShape: cloneDeep(normalized.populateShape),
    legacyExport: cloneDeep(normalized.legacyExport),
    payloadShape: normalized.payloadShape,
    collapsed: false
  };
}

function duplicateQuestionState(question: QuestionState): QuestionState {
  return {
    ...cloneDeep(question),
    uid: generateStableUid("question")
  };
}

function mergeWithExistingUid(current: QuestionState, payload: unknown): QuestionState {
  const replacement = createQuestionState(payload);
  return {
    ...replacement,
    uid: current.uid,
    collapsed: current.collapsed
  };
}

export function questionsReducer(state: QuestionState[], action: QuestionsAction): QuestionState[] {
  switch (action.type) {
    case "load": {
      if (!Array.isArray(action.payload)) {
        return [];
      }
      return action.payload.map((item) => createQuestionState(item));
    }

    case "reset":
      return [];

    case "add": {
      const next = cloneRows(state);
      const row = createQuestionState(action.payload ?? {});
      const insertAt = clampInsertIndex(action.index, next.length);
      next.splice(insertAt, 0, row);
      return next;
    }

    case "remove": {
      if (action.index < 0 || action.index >= state.length) {
        return state;
      }
      const next = cloneRows(state);
      next.splice(action.index, 1);
      return next;
    }

    case "duplicate": {
      if (action.index < 0 || action.index >= state.length) {
        return state;
      }
      const next = cloneRows(state);
      next.splice(action.index + 1, 0, duplicateQuestionState(next[action.index]));
      return next;
    }

    case "move":
      return moveRow(state, action.index, action.direction);

    case "replace": {
      if (action.index < 0 || action.index >= state.length) {
        return state;
      }
      const next = cloneRows(state);
      next[action.index] = mergeWithExistingUid(next[action.index], action.payload);
      return next;
    }

    case "paste": {
      if (action.index < 0 || action.index >= state.length) {
        return state;
      }
      const next = cloneRows(state);
      if (action.mode === "replace") {
        next[action.index] = mergeWithExistingUid(next[action.index], action.payload);
        return next;
      }
      const inserted = createQuestionState(action.payload);
      next.splice(action.index + 1, 0, inserted);
      return next;
    }

    case "update_canonical": {
      if (action.index < 0 || action.index >= state.length) {
        return state;
      }
      const current = state[action.index];
      const normalized = QuestionSchemaAdapter.normalizeIncoming(action.payload);
      const next = cloneRows(state);
      next[action.index] = {
        ...fromNormalizedQuestion(normalized),
        uid: current.uid,
        collapsed: current.collapsed
      };
      return next;
    }

    default:
      return state;
  }
}
