import { useEffect, useMemo, useRef, useState } from "react";
import { AppIcon } from "../../../../../shared/ui/AppIcon";
import { BboxDrawModal } from "../BboxDrawModal";
import { PagedBboxRowActions } from "./PagedBboxRowActions";
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

function parseClipboardBbox(rawText: string): DraftBboxRow | null {
  try {
    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const page = parsed.page;
    const position = parsed.position;
    if (!Array.isArray(position) || position.length !== 2) {
      return null;
    }
    const first = position[0];
    const second = position[1];
    if (!Array.isArray(first) || !Array.isArray(second) || first.length !== 2 || second.length !== 2) {
      return null;
    }
    return {
      page: page == null ? "" : String(page),
      x0: String(first[0] ?? ""),
      y0: String(first[1] ?? ""),
      x1: String(second[0] ?? ""),
      y1: String(second[1] ?? "")
    };
  } catch {
    return null;
  }
}

export function PagedBboxListEditor({ label, value, onCommit }: PagedBboxListEditorProps) {
  const modalInitialSource = inferInitialSource(label);
  const [rows, setRows] = useState<DraftBboxRow[]>(() => toDraftRows(value));
  const [errors, setErrors] = useState<string[]>([]);
  const [drawRowIndex, setDrawRowIndex] = useState<number | null>(null);
  const commitRef = useRef(onCommit);
  const lastCommittedHashRef = useRef("");

  useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    setRows(toDraftRows(value));
    setErrors([]);
  }, [value]);

  useEffect(() => {
    const result = validateAndBuildPayload(rows);
    setErrors(result.errors);
    const payloadHash = JSON.stringify(result.payload ?? null);
    if (payloadHash === lastCommittedHashRef.current) {
      return;
    }
    lastCommittedHashRef.current = payloadHash;
    commitRef.current(result.payload);
  }, [rows]);

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

  function replaceRow(index: number, nextRow: DraftBboxRow) {
    setRows((current) => {
      const copy = [...current];
      copy[index] = nextRow;
      return copy;
    });
  }

  function insertAt(index: number) {
    setRows((current) => {
      const copy = [...current];
      copy.splice(index, 0, createEmptyDraftRow());
      return copy;
    });
  }

  function addRow() {
    insertAt(rows.length);
  }

  function duplicateRow(index: number) {
    setRows((current) => {
      const copy = [...current];
      copy.splice(index + 1, 0, { ...copy[index] });
      return copy;
    });
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

  async function copyRow(index: number) {
    const result = validateAndBuildPayload([rows[index]]);
    if (!result.ok || !result.payload || result.payload.length === 0) {
      return;
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.payload[0]));
    } catch {
      // Keep runtime resilient when clipboard access is blocked.
    }
  }

  async function pasteRow(index: number) {
    try {
      const raw = await navigator.clipboard.readText();
      const parsed = parseClipboardBbox(raw);
      if (!parsed) {
        return;
      }
      setRows((current) => {
        const copy = [...current];
        copy[index] = parsed;
        return copy;
      });
    } catch {
      // Keep runtime resilient when clipboard access is blocked.
    }
  }

  const drawRow = drawRowIndex != null ? rows[drawRowIndex] : null;

  const drawInitialRect = useMemo(() => {
    if (!drawRow) {
      return null;
    }
    const x0 = toNumberOrNull(drawRow.x0);
    const y0 = toNumberOrNull(drawRow.y0);
    const x1 = toNumberOrNull(drawRow.x1);
    const y1 = toNumberOrNull(drawRow.y1);
    if (x0 == null || y0 == null || x1 == null || y1 == null) {
      return null;
    }
    return { x1: Math.min(x0, x1), y1: Math.min(y0, y1), x2: Math.max(x0, x1), y2: Math.max(y0, y1) };
  }, [drawRow]);

  const drawInitialPage = useMemo(() => {
    const fromRow = drawRow ? toPositiveIntegerOrNull(drawRow.page) : null;
    return fromRow ?? 1;
  }, [drawRow]);

  return (
    <div className="bbox-editor">
      <div className="bbox-editor-header">
        <strong>{label}</strong>
        <div className="bbox-editor-actions">
          <button type="button" className="tab-button" onClick={addRow}>
            <AppIcon name="add" />
            <span>Add Image</span>
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
              <span>X0</span>
              <input
                data-field="bbox-x0"
                type="number"
                value={row.x0}
                onChange={(event) => updateRow(index, "x0", event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>Y0</span>
              <input
                data-field="bbox-y0"
                type="number"
                value={row.y0}
                onChange={(event) => updateRow(index, "y0", event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>X1</span>
              <input
                data-field="bbox-x1"
                type="number"
                value={row.x1}
                onChange={(event) => updateRow(index, "x1", event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>Y1</span>
              <input
                data-field="bbox-y1"
                type="number"
                value={row.y1}
                onChange={(event) => updateRow(index, "y1", event.target.value)}
              />
            </label>
          </div>

          <PagedBboxRowActions
            onMoveUp={() => moveRow(index, "up")}
            onMoveDown={() => moveRow(index, "down")}
            onInsertBefore={() => insertAt(index)}
            onInsertAfter={() => insertAt(index + 1)}
            onDraw={() => setDrawRowIndex(index)}
            onPaste={() => void pasteRow(index)}
            onCopy={() => void copyRow(index)}
            onDuplicate={() => duplicateRow(index)}
            onRemove={() => removeRow(index)}
          />
        </div>
      ))}

      {errors.length > 0 ? (
        <div className="bbox-editor-errors">
          <strong>BBox validation errors:</strong>
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
          replaceRow(drawRowIndex, {
            page: String(page),
            x0: formatCoord(rect.x2),
            y0: formatCoord(rect.y1),
            x1: formatCoord(rect.x1),
            y1: formatCoord(rect.y2)
          });
          setErrors([]);
        }}
      />
    </div>
  );
}
