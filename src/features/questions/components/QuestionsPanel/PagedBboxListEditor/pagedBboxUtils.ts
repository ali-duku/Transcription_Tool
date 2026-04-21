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

function toLoosePageValue(value: string): number | string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return trimmed;
  }
  return parsed;
}

function toLooseCoordValue(value: string): number | string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return trimmed;
  }
  return parsed;
}

function toLoosePayloadRow(row: DraftBboxRow): unknown {
  return {
    page: toLoosePageValue(row.page),
    position: [
      [toLooseCoordValue(row.x0), toLooseCoordValue(row.y0)],
      [toLooseCoordValue(row.x1), toLooseCoordValue(row.y1)]
    ]
  };
}

export function validateAndBuildPayload(rows: DraftBboxRow[]): ValidateResult {
  if (rows.length === 0) {
    return { ok: true, errors: [], payload: null };
  }

  const errors: string[] = [];
  const payload: unknown[] = rows.map((row) => toLoosePayloadRow(row));

  rows.forEach((row, index) => {
    const rowNo = index + 1;
    const isCompletelyEmpty = [row.page, row.x0, row.y0, row.x1, row.y1].every(
      (value) => value.trim().length === 0
    );
    if (isCompletelyEmpty) {
      return;
    }
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

  });

  return {
    ok: errors.length === 0,
    errors,
    payload
  };
}

export type { DraftBboxRow };
