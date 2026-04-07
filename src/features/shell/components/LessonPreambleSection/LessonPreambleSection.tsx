import { useDocumentStore } from "../../state/documentStore";
import "./LessonPreambleSection.css";

interface LessonPreambleDraft {
  id: string;
  title: string;
  title_translation: string;
  lesson_standards_text: string;
  terminology_text: string;
  text: string;
}

function toText(value: unknown): string {
  return value == null ? "" : String(value);
}

function toMultiline(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => toText(item)).join("\n");
  }
  return toText(value);
}

function toDraft(value: unknown): LessonPreambleDraft {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    id: toText(source.id),
    title: toText(source.title),
    title_translation: toText(source.title_translation),
    lesson_standards_text: toMultiline(source.lesson_standards),
    terminology_text: toMultiline(source.terminology),
    text: toText(source.text)
  };
}

function parseMultilineList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function toPayload(draft: LessonPreambleDraft): Record<string, unknown> | null {
  const hasAnyValue = Object.values(draft).some((value) => value.trim().length > 0);
  if (!hasAnyValue) {
    return null;
  }
  return {
    id: draft.id,
    title: draft.title,
    title_translation: draft.title_translation || null,
    lesson_standards: parseMultilineList(draft.lesson_standards_text),
    terminology: parseMultilineList(draft.terminology_text),
    text: draft.text || null
  };
}

export function LessonPreambleSection() {
  const { history, applyDocumentAction } = useDocumentStore();
  const draft = toDraft(history.present.lesson_preamble);

  function update<K extends keyof LessonPreambleDraft>(key: K, value: LessonPreambleDraft[K]) {
    const nextDraft: LessonPreambleDraft = { ...draft, [key]: value };
    applyDocumentAction({ type: "set_lesson_preamble", value: toPayload(nextDraft) });
  }

  return (
    <div className="subtab-form">
      <h2>Lesson Preamble</h2>

      <div className="form-row-grid">
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
        </label>
      </div>

      <label className="form-field">
        <span>Lesson Title Translation</span>
        <textarea
          data-field="lesson-title-translation"
          value={draft.title_translation}
          onChange={(event) => update("title_translation", event.target.value)}
        />
      </label>

      <div className="form-row-grid">
        <label className="form-field">
          <span>Lesson Standards (one per line)</span>
          <textarea
            data-field="lesson-standards"
            value={draft.lesson_standards_text}
            onChange={(event) => update("lesson_standards_text", event.target.value)}
          />
        </label>
        <label className="form-field">
          <span>Terminology (one per line)</span>
          <textarea
            data-field="lesson-terminology"
            value={draft.terminology_text}
            onChange={(event) => update("terminology_text", event.target.value)}
          />
        </label>
      </div>

      <label className="form-field">
        <span>Lesson Text</span>
        <textarea
          data-field="lesson-text"
          value={draft.text}
          onChange={(event) => update("text", event.target.value)}
        />
      </label>
    </div>
  );
}
