import { useEffect, useState } from "react";
import { useDocumentStore } from "../../state/documentStore";
import type { PageType } from "../../../../domain/schema/contracts";
import "./BasicInfoSection.css";

const PAGE_TYPE_OPTIONS: Array<{ value: PageType; label: string }> = [
  { value: "content", label: "Content" },
  { value: "title_page", label: "Title Page" },
  { value: "table_of_content", label: "Table of Content" },
  { value: "unit_table_of_content", label: "Unit Table of Content" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "project", label: "Project" },
  { value: "other", label: "Other" }
];

function toText(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

export function BasicInfoSection() {
  const { history, applyDocumentAction } = useDocumentStore();
  const document = history.present;
  const [guideStart, setGuideStart] = useState(toText(document.guidebook_pdf_pages?.[0] ?? null));
  const [guideEnd, setGuideEnd] = useState(toText(document.guidebook_pdf_pages?.[1] ?? null));

  useEffect(() => {
    setGuideStart(toText(document.guidebook_pdf_pages?.[0] ?? null));
    setGuideEnd(toText(document.guidebook_pdf_pages?.[1] ?? null));
  }, [document.guidebook_pdf_pages]);

  function updateGuidebookRange(nextStart: string, nextEnd: string) {
    const start = nextStart.trim();
    const end = nextEnd.trim();
    if (!start && !end) {
      applyDocumentAction({ type: "set_guidebook_pdf_pages", value: null });
      return;
    }

    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);
    if (!Number.isNaN(startNum) && !Number.isNaN(endNum)) {
      applyDocumentAction({ type: "set_guidebook_pdf_pages", value: [startNum, endNum] });
      return;
    }

    // Keep partial/invalid states non-committed to canonical payload until both numbers are valid.
    applyDocumentAction({ type: "set_guidebook_pdf_pages", value: null });
  }

  return (
    <div className="subtab-form">
      <h2>Basic Info</h2>
      <div className="form-row-grid">
        <label className="form-field">
          <span>Textbook Page</span>
          <input
            data-field="basic-textbook-page"
            type="number"
            value={document.textbook_page ?? ""}
            onChange={(event) =>
              applyDocumentAction({ type: "set_textbook_page", value: event.target.value })
            }
          />
        </label>

        <label className="form-field">
          <span>Textbook PDF Page</span>
          <input
            data-field="basic-textbook-pdf-page"
            type="number"
            value={document.textbook_pdf_page ?? ""}
            onChange={(event) =>
              applyDocumentAction({ type: "set_textbook_pdf_page", value: event.target.value })
            }
          />
        </label>
      </div>

      <div className="form-row-grid">
        <label className="form-field">
          <span>Guidebook Start</span>
          <input
            data-field="basic-guidebook-start"
            type="number"
            value={guideStart}
            onChange={(event) => {
              const next = event.target.value;
              setGuideStart(next);
              updateGuidebookRange(next, guideEnd);
            }}
          />
        </label>

        <label className="form-field">
          <span>Guidebook End</span>
          <input
            data-field="basic-guidebook-end"
            type="number"
            value={guideEnd}
            onChange={(event) => {
              const next = event.target.value;
              setGuideEnd(next);
              updateGuidebookRange(guideStart, next);
            }}
          />
        </label>
      </div>

      <label className="form-field">
        <span>Page Type</span>
        <select
          data-field="basic-page-type"
          value={document.page_type ?? "content"}
          onChange={(event) => applyDocumentAction({ type: "set_page_type", value: event.target.value })}
        >
          {PAGE_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
