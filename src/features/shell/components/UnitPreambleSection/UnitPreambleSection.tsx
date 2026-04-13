import { useDocumentStore } from "../../state/documentStore";
import { LiveFieldPreview } from "../../../preview/components/LiveFieldPreview";
import "./UnitPreambleSection.css";

interface UnitPreambleDraft {
  id: string;
  title: string;
  title_translation: string;
  text: string;
}

function toText(value: unknown): string {
  return value == null ? "" : String(value);
}

function toDraft(value: unknown): UnitPreambleDraft {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    id: toText(source.id),
    title: toText(source.title),
    title_translation: toText(source.title_translation),
    text: toText(source.text)
  };
}

function toPayload(draft: UnitPreambleDraft): Record<string, unknown> | null {
  const hasAnyValue = Object.values(draft).some((value) => value.trim().length > 0);
  if (!hasAnyValue) {
    return null;
  }
  return {
    id: draft.id,
    title: draft.title,
    title_translation: draft.title_translation || null,
    text: draft.text || null
  };
}

export function UnitPreambleSection() {
  const { history, applyDocumentAction } = useDocumentStore();
  const draft = toDraft(history.present.unit_preamble);

  function update<K extends keyof UnitPreambleDraft>(key: K, value: UnitPreambleDraft[K]) {
    const nextDraft: UnitPreambleDraft = { ...draft, [key]: value };
    applyDocumentAction({ type: "set_unit_preamble", value: toPayload(nextDraft) });
  }

  return (
    <div className="subtab-form">
      <h2>Unit Preamble</h2>

      <div className="form-row-grid">
        <label className="form-field">
          <span>Unit ID</span>
          <input
            data-field="unit-id"
            type="text"
            value={draft.id}
            onChange={(event) => update("id", event.target.value)}
          />
        </label>
        <label className="form-field">
          <span>Unit Title</span>
          <input
            data-field="unit-title"
            type="text"
            value={draft.title}
            onChange={(event) => update("title", event.target.value)}
          />
          <LiveFieldPreview text={draft.title} />
        </label>
      </div>

      <label className="form-field">
        <span>Unit Title Translation</span>
        <textarea
          data-field="unit-title-translation"
          value={draft.title_translation}
          onChange={(event) => update("title_translation", event.target.value)}
        />
        <LiveFieldPreview text={draft.title_translation} />
      </label>

      <label className="form-field">
        <span>Unit Text</span>
        <textarea
          data-field="unit-text"
          value={draft.text}
          onChange={(event) => update("text", event.target.value)}
        />
        <LiveFieldPreview text={draft.text} />
      </label>
    </div>
  );
}
