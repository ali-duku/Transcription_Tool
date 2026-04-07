interface BboxRecordLike {
  page?: unknown;
  position?: unknown;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPoint(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    isFiniteNumber(value[0]) &&
    isFiniteNumber(value[1])
  );
}

function isPosition(value: unknown): value is [[number, number], [number, number]] {
  return Array.isArray(value) && value.length === 2 && isPoint(value[0]) && isPoint(value[1]);
}

export function validatePagedBboxArray(
  value: unknown[] | null,
  scopePrefix: string,
  errors: string[]
) {
  if (!Array.isArray(value) || value.length === 0) {
    return;
  }

  value.forEach((item, index) => {
    const itemNo = index + 1;
    if (!item || typeof item !== "object") {
      errors.push(`${scopePrefix} image row ${itemNo}: entry must be an object.`);
      return;
    }

    const record = item as BboxRecordLike;
    const page = record.page;
    if (!Number.isInteger(page) || Number(page) <= 0) {
      errors.push(`${scopePrefix} image row ${itemNo}: page must be a positive integer.`);
    }

    if (!isPosition(record.position)) {
      errors.push(`${scopePrefix} image row ${itemNo}: position must be [[x1,y1],[x2,y2]].`);
      return;
    }

    const [[x1, y1], [x2, y2]] = record.position;
    if (x1 >= x2) {
      errors.push(`${scopePrefix} image row ${itemNo}: x1 must be less than x2.`);
    }
    if (y1 >= y2) {
      errors.push(`${scopePrefix} image row ${itemNo}: y1 must be less than y2.`);
    }
  });
}
