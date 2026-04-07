interface DraftBboxRow {
  page: string;
  x1: string;
  y1: string;
  x2: string;
  y2: string;
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
    return { page: "", x1: "", y1: "", x2: "", y2: "" };
  }

  const record = value as Record<string, unknown>;
  const position = record.position;
  if (!isPosition(position)) {
    return {
      page: toText(record.page),
      x1: "",
      y1: "",
      x2: "",
      y2: ""
    };
  }

  return {
    page: toText(record.page),
    x1: toText(position[0][0]),
    y1: toText(position[0][1]),
    x2: toText(position[1][0]),
    y2: toText(position[1][1])
  };
}

export function toDraftRows(value: unknown[] | null): DraftBboxRow[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }
  return value.map((item) => toDraftRow(item));
}

export function createEmptyDraftRow(): DraftBboxRow {
  return { page: "", x1: "", y1: "", x2: "", y2: "" };
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
    const x1 = toNumber(row.x1);
    const y1 = toNumber(row.y1);
    const x2 = toNumber(row.x2);
    const y2 = toNumber(row.y2);

    if (page == null) {
      errors.push(`Row ${rowNo}: page must be a positive integer.`);
    }
    if (x1 == null || y1 == null || x2 == null || y2 == null) {
      errors.push(`Row ${rowNo}: coordinates must be valid numbers.`);
    } else {
      if (x1 >= x2) {
        errors.push(`Row ${rowNo}: x1 must be less than x2.`);
      }
      if (y1 >= y2) {
        errors.push(`Row ${rowNo}: y1 must be less than y2.`);
      }
    }

    if (page != null && x1 != null && y1 != null && x2 != null && y2 != null && x1 < x2 && y1 < y2) {
      payload.push({
        page,
        position: [
          [x1, y1],
          [x2, y2]
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
