interface DraftBboxRow {
  page: string;
  x0: string;
  y0: string;
  x1: string;
  y1: string;
}

export interface ValidateResult {
  ok: boolean;
  errors: string[];
  payload: unknown[] | null;
}

function toText(value: unknown): string {
  return value == null ? "" : String(value);
}

function toNumber(value: string): number | null {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function toPositiveInteger(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function isPoint(value: unknown): value is [unknown, unknown] {
  return Array.isArray(value) && value.length === 2;
}

function isPosition(value: unknown): value is [[unknown, unknown], [unknown, unknown]] {
  return Array.isArray(value) && value.length === 2 && isPoint(value[0]) && isPoint(value[1]);
}

function toDraftRow(value: unknown): DraftBboxRow {
  if (!value || typeof value !== "object") {
    return { page: "", x0: "", y0: "", x1: "", y1: "" };
  }

  const record = value as Record<string, unknown>;
  const position = record.position;
  if (!isPosition(position)) {
    return {
      page: toText(record.page),
      x0: "",
      y0: "",
      x1: "",
      y1: ""
    };
  }

  return {
    page: toText(record.page),
    x0: toText(position[0][0]),
    y0: toText(position[0][1]),
    x1: toText(position[1][0]),
    y1: toText(position[1][1])
  };
}

export function toDraftRows(value: unknown[] | null): DraftBboxRow[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }
  return value.map((item) => toDraftRow(item));
}

export function createEmptyDraftRow(): DraftBboxRow {
  return { page: "", x0: "", y0: "", x1: "", y1: "" };
}

export function validateAndBuildPayload(rows: DraftBboxRow[]): ValidateResult {
  if (rows.length === 0) {
    return { ok: true, errors: [], payload: null };
  }

  const errors: string[] = [];
  const payload: unknown[] = [];

  rows.forEach((row, index) => {
    const rowNo = index + 1;
    const page = toPositiveInteger(row.page);
    const x0 = toNumber(row.x0);
    const y0 = toNumber(row.y0);
    const x1 = toNumber(row.x1);
    const y1 = toNumber(row.y1);

    if (page == null) {
      errors.push(`Row ${rowNo}: page must be a positive integer.`);
    }
    if (x0 == null || y0 == null || x1 == null || y1 == null) {
      errors.push(`Row ${rowNo}: coordinates must be valid numbers.`);
    } else {
      if (x0 <= x1) {
        errors.push(`Row ${rowNo}: x0 must be greater than x1.`);
      }
      if (y0 >= y1) {
        errors.push(`Row ${rowNo}: y0 must be less than y1.`);
      }
    }

    if (page != null && x0 != null && y0 != null && x1 != null && y1 != null && x0 > x1 && y0 < y1) {
      payload.push({
        page,
        position: [
          [x0, y0],
          [x1, y1]
        ]
      });
    }
  });

  return {
    ok: errors.length === 0,
    errors,
    payload: errors.length === 0 ? payload : null
  };
}

export type { DraftBboxRow };
