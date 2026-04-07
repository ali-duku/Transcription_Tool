import { generateStableUid } from "../../questions/state/uidIdentity";
import { cloneDeep } from "../../../shared/utils/clone";

type Direction = "up" | "down";
type PasteMode = "replace" | "insert_after";

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return !!(value && typeof value === "object" && !Array.isArray(value));
}

function toStringOrEmpty(value: unknown): string {
  return value == null ? "" : String(value);
}

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

function toArrayOrEmpty(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return cloneDeep(value);
}

export interface ContentSectionState {
  uid: string;
  section_title: string;
  text: string;
  images: unknown[];
  collapsed: boolean;
}

export type ContentSectionsAction =
  | { type: "load"; payload: unknown }
  | { type: "reset" }
  | { type: "add"; index?: number; payload?: unknown }
  | { type: "remove"; index: number }
  | { type: "duplicate"; index: number }
  | { type: "move"; index: number; direction: Direction }
  | { type: "paste"; index: number; mode: PasteMode; payload: unknown }
  | { type: "replace"; index: number; payload: unknown };

export function createContentSectionState(input?: unknown): ContentSectionState {
  const source = isPlainObject(input) ? input : {};

  const uid = typeof source.uid === "string" && source.uid.trim().length > 0
    ? source.uid
    : generateStableUid("content_section");

  return {
    uid,
    section_title: toStringOrEmpty(source.section_title),
    text: toStringOrEmpty(source.text),
    images: toArrayOrEmpty(source.images),
    collapsed: source.collapsed === true
  };
}

export function createEmptyContentSection(): ContentSectionState {
  return createContentSectionState({});
}

function duplicateContentSection(section: ContentSectionState): ContentSectionState {
  return {
    ...cloneDeep(section),
    uid: generateStableUid("content_section")
  };
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

export function contentSectionsReducer(
  state: ContentSectionState[],
  action: ContentSectionsAction
): ContentSectionState[] {
  switch (action.type) {
    case "load": {
      if (!Array.isArray(action.payload)) {
        return [];
      }
      return action.payload.map((item) => createContentSectionState(item));
    }

    case "reset":
      return [];

    case "add": {
      const next = cloneRows(state);
      const row = createContentSectionState(action.payload);
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
      const duplicate = duplicateContentSection(next[action.index]);
      next.splice(action.index + 1, 0, duplicate);
      return next;
    }

    case "move":
      return moveRow(state, action.index, action.direction);

    case "replace": {
      if (action.index < 0 || action.index >= state.length) {
        return state;
      }
      const next = cloneRows(state);
      const current = next[action.index];
      const payload = isPlainObject(action.payload) ? action.payload : {};
      const replacement = createContentSectionState({
        ...payload,
        uid: current.uid
      });
      next[action.index] = replacement;
      return next;
    }

    case "paste": {
      if (action.index < 0 || action.index >= state.length) {
        return state;
      }

      const next = cloneRows(state);
      const incoming = createContentSectionState(action.payload);
      if (action.mode === "replace") {
        next[action.index] = {
          ...incoming,
          uid: next[action.index].uid
        };
        return next;
      }

      const duplicate = {
        ...incoming,
        uid: generateStableUid("content_section")
      };
      next.splice(action.index + 1, 0, duplicate);
      return next;
    }

    default:
      return state;
  }
}
