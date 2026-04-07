import type { SerializableTranscriptionPayload } from "../../../../../shared/types/transcriptionPayload";
import type { InputScrollTarget } from "../../../../../shared/types/navigation";
import { RichTextPreview } from "../RichTextPreview";
import { MetadataListItem } from "./MetadataListItem";
import "./FinalPreviewMetadataSections.css";

interface FinalPreviewMetadataSectionsProps {
  payload: SerializableTranscriptionPayload;
  onNavigateToInput?: (target: InputScrollTarget) => void;
}

function hasAnyNonEmptyString(values: Array<string | null | undefined>): boolean {
  return values.some((value) => (value ?? "").trim().length > 0);
}

function MetadataFieldHeading({
  label,
  target,
  onNavigateToInput
}: {
  label: string;
  target: InputScrollTarget;
  onNavigateToInput?: (target: InputScrollTarget) => void;
}) {
  return (
    <div className="metadata-field-heading">
      <strong>{label}</strong>
      {onNavigateToInput ? (
        <button type="button" className="preview-jump-button preview-jump-button-inline" onClick={() => onNavigateToInput(target)}>
          Edit
        </button>
      ) : null}
    </div>
  );
}

export function FinalPreviewMetadataSections({
  payload,
  onNavigateToInput
}: FinalPreviewMetadataSectionsProps) {
  const bookMetadata = payload.book_title_page;
  const unitPreamble = payload.unit_preamble;
  const lessonPreamble = payload.lesson_preamble;

  const showBookMetadata =
    bookMetadata !== null &&
    hasAnyNonEmptyString([
      bookMetadata.title,
      bookMetadata.subtitle,
      bookMetadata.version,
      bookMetadata.lang,
      bookMetadata.subject,
      String(bookMetadata.grade ?? ""),
      String(bookMetadata.semester ?? "")
    ]);

  const showUnitPreamble =
    unitPreamble !== null &&
    hasAnyNonEmptyString([
      unitPreamble.id,
      unitPreamble.title,
      unitPreamble.title_translation,
      unitPreamble.text
    ]);

  const lessonStandards = Array.isArray(lessonPreamble?.lesson_standards)
    ? lessonPreamble.lesson_standards.filter((item) => item.trim().length > 0)
    : [];
  const terminology = Array.isArray(lessonPreamble?.terminology)
    ? lessonPreamble.terminology.filter((item) => item.trim().length > 0)
    : [];
  const showLessonPreamble =
    lessonPreamble !== null &&
    (hasAnyNonEmptyString([
      lessonPreamble.id,
      lessonPreamble.title,
      lessonPreamble.title_translation,
      lessonPreamble.text
    ]) ||
      lessonStandards.length > 0 ||
      terminology.length > 0);

  return (
    <>
      {showBookMetadata ? (
        <section className="preview-card">
          <div className="metadata-card-header">
            <h3>Book Metadata</h3>
            {onNavigateToInput ? (
              <button
                type="button"
                className="preview-jump-button"
                onClick={() =>
                  onNavigateToInput({
                    subTab: "book_metadata",
                    fieldSelector: `[data-field="book-title"]`
                  })
                }
              >
                Edit in Form
              </button>
            ) : null}
          </div>
          <ul>
            <MetadataListItem
              label="Title"
              value={bookMetadata?.title?.trim() || "(none)"}
              target={{ subTab: "book_metadata", fieldSelector: `[data-field="book-title"]` }}
              onNavigateToInput={onNavigateToInput}
            />
            <MetadataListItem
              label="Subtitle"
              value={bookMetadata?.subtitle?.trim() || "(none)"}
              target={{ subTab: "book_metadata", fieldSelector: `[data-field="book-subtitle"]` }}
              onNavigateToInput={onNavigateToInput}
            />
            <MetadataListItem
              label="Version"
              value={bookMetadata?.version?.trim() || "(none)"}
              target={{ subTab: "book_metadata", fieldSelector: `[data-field="book-version"]` }}
              onNavigateToInput={onNavigateToInput}
            />
            <MetadataListItem
              label="Grade"
              value={bookMetadata?.grade == null ? "null" : String(bookMetadata.grade)}
              target={{ subTab: "book_metadata", fieldSelector: `[data-field="book-grade"]` }}
              onNavigateToInput={onNavigateToInput}
            />
            <MetadataListItem
              label="Semester"
              value={bookMetadata?.semester == null ? "null" : String(bookMetadata.semester)}
              target={{ subTab: "book_metadata", fieldSelector: `[data-field="book-semester"]` }}
              onNavigateToInput={onNavigateToInput}
            />
            <MetadataListItem
              label="Language"
              value={bookMetadata?.lang?.trim() || "(none)"}
              target={{ subTab: "book_metadata", fieldSelector: `[data-field="book-lang"]` }}
              onNavigateToInput={onNavigateToInput}
            />
            <MetadataListItem
              label="Subject"
              value={bookMetadata?.subject?.trim() || "(none)"}
              target={{ subTab: "book_metadata", fieldSelector: `[data-field="book-subject"]` }}
              onNavigateToInput={onNavigateToInput}
            />
          </ul>
        </section>
      ) : null}

      {showUnitPreamble ? (
        <section className="preview-card">
          <div className="metadata-card-header">
            <h3>Unit Preamble</h3>
            {onNavigateToInput ? (
              <button
                type="button"
                className="preview-jump-button"
                onClick={() =>
                  onNavigateToInput({
                    subTab: "unit_preamble",
                    fieldSelector: `[data-field="unit-title"]`
                  })
                }
              >
                Edit in Form
              </button>
            ) : null}
          </div>
          <ul>
            <li>Unit ID: {unitPreamble?.id?.trim() || "(none)"}</li>
          </ul>
          <MetadataFieldHeading
            label="Unit Title"
            target={{ subTab: "unit_preamble", fieldSelector: `[data-field="unit-title"]` }}
            onNavigateToInput={onNavigateToInput}
          />
          <RichTextPreview text={unitPreamble?.title ?? ""} emptyPlaceholder="(none)" />
          <MetadataFieldHeading
            label="Unit Title Translation"
            target={{ subTab: "unit_preamble", fieldSelector: `[data-field="unit-title-translation"]` }}
            onNavigateToInput={onNavigateToInput}
          />
          <RichTextPreview text={unitPreamble?.title_translation} emptyPlaceholder="(none)" />
          <MetadataFieldHeading
            label="Unit Text"
            target={{ subTab: "unit_preamble", fieldSelector: `[data-field="unit-text"]` }}
            onNavigateToInput={onNavigateToInput}
          />
          <RichTextPreview text={unitPreamble?.text} emptyPlaceholder="(none)" />
        </section>
      ) : null}

      {showLessonPreamble ? (
        <section className="preview-card">
          <div className="metadata-card-header">
            <h3>Lesson Preamble</h3>
            {onNavigateToInput ? (
              <button
                type="button"
                className="preview-jump-button"
                onClick={() =>
                  onNavigateToInput({
                    subTab: "preamble",
                    fieldSelector: `[data-field="lesson-title"]`
                  })
                }
              >
                Edit in Form
              </button>
            ) : null}
          </div>
          <ul>
            <li>Lesson ID: {lessonPreamble?.id?.trim() || "(none)"}</li>
          </ul>
          <MetadataFieldHeading
            label="Lesson Title"
            target={{ subTab: "preamble", fieldSelector: `[data-field="lesson-title"]` }}
            onNavigateToInput={onNavigateToInput}
          />
          <RichTextPreview text={lessonPreamble?.title ?? ""} emptyPlaceholder="(none)" />
          <MetadataFieldHeading
            label="Lesson Title Translation"
            target={{ subTab: "preamble", fieldSelector: `[data-field="lesson-title-translation"]` }}
            onNavigateToInput={onNavigateToInput}
          />
          <RichTextPreview text={lessonPreamble?.title_translation} emptyPlaceholder="(none)" />
          <div className="preview-question-meta">
            <MetadataFieldHeading
              label="Lesson Standards"
              target={{ subTab: "preamble", fieldSelector: `[data-field="lesson-standards"]` }}
              onNavigateToInput={onNavigateToInput}
            />
            {lessonStandards.length === 0 ? (
              <p>(none)</p>
            ) : (
              <ul>
                {lessonStandards.map((item, itemIndex) => (
                  <li key={`lesson-standard-${itemIndex}`}>
                    <RichTextPreview text={item} emptyPlaceholder="(empty)" />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="preview-question-meta">
            <MetadataFieldHeading
              label="Terminology"
              target={{ subTab: "preamble", fieldSelector: `[data-field="lesson-terminology"]` }}
              onNavigateToInput={onNavigateToInput}
            />
            {terminology.length === 0 ? (
              <p>(none)</p>
            ) : (
              <ul>
                {terminology.map((item, itemIndex) => (
                  <li key={`lesson-terminology-${itemIndex}`}>
                    <RichTextPreview text={item} emptyPlaceholder="(empty)" />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <MetadataFieldHeading
            label="Lesson Text"
            target={{ subTab: "preamble", fieldSelector: `[data-field="lesson-text"]` }}
            onNavigateToInput={onNavigateToInput}
          />
          <RichTextPreview text={lessonPreamble?.text} emptyPlaceholder="(none)" />
        </section>
      ) : null}
    </>
  );
}
