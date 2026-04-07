import { useEffect, useMemo, useState } from "react";
import { usePdfViewerStore } from "../../../../pdf/mainViewer/state/pdfViewerStore";
import { BboxDrawModal } from "../BboxDrawModal";
import {
  createEmptyDraftRow,
  toDraftRows,
  validateAndBuildPayload,
  type DraftBboxRow
} from "./pagedBboxUtils";
import "./PagedBboxListEditor.css";

interface PagedBboxListEditorProps {
  label: string;
  value: unknown[] | null;
  onCommit: (next: unknown[] | null) => void;
}

function inferInitialSource(label: string): "textbook" | "guide" {
  return label.toLowerCase().includes("guide") ? "guide" : "textbook";
}

function toNumberOrNull(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPositiveIntegerOrNull(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function formatCoord(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function PagedBboxListEditor({ label, value, onCommit }: PagedBboxListEditorProps) {
  const { state: pdfViewerState, activeDoc } = usePdfViewerStore();
  const modalInitialSource = inferInitialSource(label);
  const [rows, setRows] = useState<DraftBboxRow[]>(() => toDraftRows(value));
  const [errors, setErrors] = useState<string[]>([]);
  const [drawRowIndex, setDrawRowIndex] = useState<number | null>(null);

  useEffect(() => {
    setRows(toDraftRows(value));
    setErrors([]);
  }, [value]);

  function updateRow(index: number, key: keyof DraftBboxRow, nextValue: string) {
    setRows((current) => {
      const copy = [...current];
      copy[index] = {
        ...copy[index],
        [key]: nextValue
      };
      return copy;
    });
  }

  function addRow() {
    setRows((current) => [...current, createEmptyDraftRow()]);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  function moveRow(index: number, direction: "up" | "down") {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= rows.length) {
      return;
    }
    setRows((current) => {
      const copy = [...current];
      const currentRow = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = currentRow;
      return copy;
    });
  }

  function applyChanges() {
    const result = validateAndBuildPayload(rows);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    onCommit(result.payload);
  }

  function resetFromSaved() {
    setRows(toDraftRows(value));
    setErrors([]);
  }

  const drawRow = drawRowIndex != null ? rows[drawRowIndex] : null;

  const drawInitialRect = useMemo(() => {
    if (!drawRow) {
      return null;
    }
    const x1 = toNumberOrNull(drawRow.x1);
    const y1 = toNumberOrNull(drawRow.y1);
    const x2 = toNumberOrNull(drawRow.x2);
    const y2 = toNumberOrNull(drawRow.y2);
    if (x1 == null || y1 == null || x2 == null || y2 == null) {
      return null;
    }
    return { x1, y1, x2, y2 };
  }, [drawRow]);

  const drawInitialPage = useMemo(() => {
    const fromRow = drawRow ? toPositiveIntegerOrNull(drawRow.page) : null;
    return fromRow ?? activeDoc.currentPage;
  }, [activeDoc.currentPage, drawRow]);

  return (
    <div className="bbox-editor">
      <div className="bbox-editor-header">
        <strong>{label}</strong>
        <div className="bbox-editor-actions">
          <button type="button" className="tab-button" onClick={addRow}>
            Add Row
          </button>
          <button type="button" className="tab-button" onClick={resetFromSaved}>
            Reset
          </button>
          <button type="button" className="tab-button" onClick={applyChanges}>
            Apply
          </button>
        </div>
      </div>

      {rows.length === 0 ? <p className="bbox-editor-muted">No image rows. Add one to begin.</p> : null}

      {rows.map((row, index) => (
        <div key={`bbox-row-${index}`} className="bbox-editor-row">
          <div className="bbox-editor-grid">
            <label className="form-field">
              <span>Page</span>
              <input
                data-field="bbox-page"
                type="number"
                value={row.page}
                onChange={(event) => updateRow(index, "page", event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>x1</span>
              <input
                data-field="bbox-x1"
                type="number"
                value={row.x1}
                onChange={(event) => updateRow(index, "x1", event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>y1</span>
              <input
                data-field="bbox-y1"
                type="number"
                value={row.y1}
                onChange={(event) => updateRow(index, "y1", event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>x2</span>
              <input
                data-field="bbox-x2"
                type="number"
                value={row.x2}
                onChange={(event) => updateRow(index, "x2", event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>y2</span>
              <input
                data-field="bbox-y2"
                type="number"
                value={row.y2}
                onChange={(event) => updateRow(index, "y2", event.target.value)}
              />
            </label>
          </div>

          <div className="bbox-editor-row-actions">
            <button type="button" className="tab-button" disabled={!activeDoc.exists} onClick={() => setDrawRowIndex(index)}>
              Draw
            </button>
            <button
              type="button"
              className="tab-button"
              disabled={!activeDoc.exists}
              onClick={() => updateRow(index, "page", String(activeDoc.currentPage))}
            >
              Use {pdfViewerState.source} page
            </button>
            <button type="button" className="tab-button" onClick={() => moveRow(index, "up")}>
              Up
            </button>
            <button type="button" className="tab-button" onClick={() => moveRow(index, "down")}>
              Down
            </button>
            <button type="button" className="tab-button" onClick={() => removeRow(index)}>
              Remove
            </button>
          </div>
        </div>
      ))}

      {errors.length > 0 ? (
        <div className="bbox-editor-errors">
          <strong>Cannot apply:</strong>
          <ul>
            {errors.map((message, index) => (
              <li key={`bbox-error-${index}`}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <BboxDrawModal
        open={drawRowIndex !== null}
        initialSource={modalInitialSource}
        initialPage={drawInitialPage}
        initialRect={drawInitialRect}
        onClose={() => setDrawRowIndex(null)}
        onConfirm={({ page, rect }) => {
          if (drawRowIndex == null) {
            return;
          }
          updateRow(drawRowIndex, "page", String(page));
          updateRow(drawRowIndex, "x1", formatCoord(rect.x1));
          updateRow(drawRowIndex, "y1", formatCoord(rect.y1));
          updateRow(drawRowIndex, "x2", formatCoord(rect.x2));
          updateRow(drawRowIndex, "y2", formatCoord(rect.y2));
          setErrors([]);
        }}
      />
    </div>
  );
}
