import { useDocumentStore } from "../../state/documentStore";
import { LiveFieldPreview } from "../../../preview/components/LiveFieldPreview";
import "./LessonPreambleSection.css";

interface LessonPreambleDraft {
  id: string;
  title: string;
  title_translation: string;
  lesson_standards: string[];
  terminology: string[];
  text: string;
}

function toText(value: unknown): string {
  return value == null ? "" : String(value);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => toText(item));
}

function toDraft(value: unknown): LessonPreambleDraft {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    id: toText(source.id),
    title: toText(source.title),
    title_translation: toText(source.title_translation),
    lesson_standards: toStringArray(source.lesson_standards),
    terminology: toStringArray(source.terminology),
    text: toText(source.text)
  };
}

function toPayload(draft: LessonPreambleDraft): Record<string, unknown> | null {
  const lessonStandards = draft.lesson_standards.map((item) => item.trim()).filter((item) => item.length > 0);
  const terminology = draft.terminology.map((item) => item.trim()).filter((item) => item.length > 0);
  const hasAnyValue =
    draft.id.trim().length > 0 ||
    draft.title.trim().length > 0 ||
    draft.title_translation.trim().length > 0 ||
    lessonStandards.length > 0 ||
    terminology.length > 0 ||
    draft.text.trim().length > 0;
  if (!hasAnyValue) {
    return null;
  }
  return {
    id: draft.id,
    title: draft.title,
    title_translation: draft.title_translation || null,
    lesson_standards: lessonStandards,
    terminology,
    text: draft.text || null
  };
}

function moveItem(list: string[], index: number, direction: "up" | "down"): string[] {
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= list.length) {
    return list;
  }
  const copy = [...list];
  const current = copy[index];
  copy[index] = copy[nextIndex];
  copy[nextIndex] = current;
  return copy;
}

function replaceAt(list: string[], index: number, value: string): string[] {
  const copy = [...list];
  copy[index] = value;
  return copy;
}

function insertAt(list: string[], index: number, value: string): string[] {
  const copy = [...list];
  copy.splice(index, 0, value);
  return copy;
}

function removeAt(list: string[], index: number): string[] {
  return list.filter((_, itemIndex) => itemIndex !== index);
}

export function LessonPreambleSection() {
  const { history, applyDocumentAction } = useDocumentStore();
  const draft = toDraft(history.present.lesson_preamble);

  function apply(nextDraft: LessonPreambleDraft) {
    applyDocumentAction({ type: "set_lesson_preamble", value: toPayload(nextDraft) });
  }

  function update<K extends keyof LessonPreambleDraft>(key: K, value: LessonPreambleDraft[K]) {
    apply({ ...draft, [key]: value });
  }

  function renderArrayEditor(field: "lesson_standards" | "terminology", label: string) {
    const values = draft[field];
    return (
      <div className="form-field">
        <span>{label}</span>
        {values.length === 0 ? (
          <p className="muted-text">No items yet.</p>
        ) : (
          values.map((value, index) => (
            <div key={`${field}-${index}`} className="preamble-array-row">
              <textarea
                data-field={field === "lesson_standards" ? "lesson-standards" : "lesson-terminology"}
                value={value}
                onChange={(event) => update(field, replaceAt(values, index, event.target.value))}
              />
              <div className="preamble-array-actions">
                <button type="button" className="tab-button" onClick={() => update(field, insertAt(values, index, ""))}>
                  Before
                </button>
                <button type="button" className="tab-button" onClick={() => update(field, insertAt(values, index + 1, ""))}>
                  After
                </button>
                <button type="button" className="tab-button" onClick={() => update(field, moveItem(values, index, "up"))}>
                  Up
                </button>
                <button type="button" className="tab-button" onClick={() => update(field, moveItem(values, index, "down"))}>
                  Down
                </button>
                <button type="button" className="tab-button" onClick={() => update(field, removeAt(values, index))}>
                  Remove
                </button>
              </div>
              <LiveFieldPreview text={value} />
            </div>
          ))
        )}
        <button type="button" className="tab-button" onClick={() => update(field, [...values, ""])}>
          Add {field === "lesson_standards" ? "Standard" : "Term"}
        </button>
      </div>
    );
  }

  return (
    <div className="subtab-form">
      <h2>Lesson Preamble</h2>

      <label className="form-field">
        <span>Lesson ID</span>
        <input
          data-field="lesson-id"
          type="text"
          value={draft.id}
          onChange={(event) => update("id", event.target.value)}
        />
      </label>

      <label className="form-field">
        <span>Lesson Title</span>
        <input
          data-field="lesson-title"
          type="text"
          value={draft.title}
          onChange={(event) => update("title", event.target.value)}
        />
        <LiveFieldPreview text={draft.title} />
      </label>

      <label className="form-field">
        <span>Lesson Title Translation</span>
        <textarea
          data-field="lesson-title-translation"
          value={draft.title_translation}
          onChange={(event) => update("title_translation", event.target.value)}
        />
        <LiveFieldPreview text={draft.title_translation} />
      </label>

      {renderArrayEditor("lesson_standards", "Lesson Standards")}
      {renderArrayEditor("terminology", "Terminology")}

      <label className="form-field">
        <span>Lesson Text</span>
        <textarea
          data-field="lesson-text"
          value={draft.text}
          onChange={(event) => update("text", event.target.value)}
        />
        <LiveFieldPreview text={draft.text} />
      </label>
    </div>
  );
}
