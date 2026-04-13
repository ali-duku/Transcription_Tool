import { useDocumentStore } from "../../state/documentStore";
import { LiveFieldPreview } from "../../../preview/components/LiveFieldPreview";
import "./BookMetadataSection.css";

interface BookMetadataDraft {
  title: string;
  subtitle: string;
  version: string;
  grade: string;
  semester: string;
  lang: string;
  subject: string;
}

function toText(value: unknown): string {
  return value == null ? "" : String(value);
}

function toDraft(value: unknown): BookMetadataDraft {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    title: toText(source.title),
    subtitle: toText(source.subtitle),
    version: toText(source.version),
    grade: toText(source.grade),
    semester: toText(source.semester),
    lang: toText(source.lang),
    subject: toText(source.subject)
  };
}

function toPayload(draft: BookMetadataDraft): Record<string, unknown> | null {
  const hasAnyValue = Object.values(draft).some((value) => value.trim().length > 0);
  if (!hasAnyValue) {
    return null;
  }

  const grade = draft.grade.trim();
  const semester = draft.semester.trim();
  return {
    title: draft.title,
    subtitle: draft.subtitle,
    version: draft.version,
    grade: grade === "" ? null : Number.parseInt(grade, 10),
    semester: semester === "" ? null : Number.parseInt(semester, 10),
    lang: draft.lang,
    subject: draft.subject
  };
}

export function BookMetadataSection() {
  const { history, applyDocumentAction } = useDocumentStore();
  const draft = toDraft(history.present.book_title_page);

  function update<K extends keyof BookMetadataDraft>(key: K, value: BookMetadataDraft[K]) {
    const nextDraft: BookMetadataDraft = { ...draft, [key]: value };
    applyDocumentAction({ type: "set_book_title_page", value: toPayload(nextDraft) });
  }

  return (
    <div className="subtab-form">
      <h2>Book Metadata</h2>

      <div className="form-row-grid">
        <label className="form-field">
          <span>Title</span>
          <input
            data-field="book-title"
            type="text"
            value={draft.title}
            onChange={(event) => update("title", event.target.value)}
          />
          <LiveFieldPreview text={draft.title} />
        </label>

        <label className="form-field">
          <span>Subtitle</span>
          <input
            data-field="book-subtitle"
            type="text"
            value={draft.subtitle}
            onChange={(event) => update("subtitle", event.target.value)}
          />
          <LiveFieldPreview text={draft.subtitle} />
        </label>
      </div>

      <div className="form-row-grid">
        <label className="form-field">
          <span>Version</span>
          <input
            data-field="book-version"
            type="text"
            value={draft.version}
            onChange={(event) => update("version", event.target.value)}
          />
          <LiveFieldPreview text={draft.version} />
        </label>

        <label className="form-field">
          <span>Grade</span>
          <input
            data-field="book-grade"
            type="number"
            value={draft.grade}
            onChange={(event) => update("grade", event.target.value)}
          />
        </label>
      </div>

      <div className="form-row-grid">
        <label className="form-field">
          <span>Semester</span>
          <input
            data-field="book-semester"
            type="number"
            value={draft.semester}
            onChange={(event) => update("semester", event.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Language</span>
          <input
            data-field="book-lang"
            type="text"
            value={draft.lang}
            onChange={(event) => update("lang", event.target.value)}
          />
          <LiveFieldPreview text={draft.lang} />
        </label>
      </div>

      <label className="form-field">
        <span>Subject</span>
        <input
          data-field="book-subject"
          type="text"
          value={draft.subject}
          onChange={(event) => update("subject", event.target.value)}
        />
        <LiveFieldPreview text={draft.subject} />
      </label>
    </div>
  );
}
