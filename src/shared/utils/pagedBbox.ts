interface LoosePagedBboxRow {
  page: number | "";
  position: [[number | string, number | string], [number | string, number | string]];
}

function toValidPage(value: unknown): number | null {
  if (!Number.isInteger(value)) {
    return null;
  }
  const page = Number(value);
  return page > 0 ? page : null;
}

function preferredPageFromRows(value: unknown[] | null | undefined): number | null {
  if (!Array.isArray(value)) {
    return null;
  }
  for (let index = value.length - 1; index >= 0; index -= 1) {
    const row = value[index];
    if (!row || typeof row !== "object") {
      continue;
    }
    const page = toValidPage((row as { page?: unknown }).page);
    if (page != null) {
      return page;
    }
  }
  return null;
}

export function createLoosePagedBboxRow(page: number | null = null): LoosePagedBboxRow {
  return {
    page: toValidPage(page) ?? "",
    position: [
      ["", ""],
      ["", ""]
    ]
  };
}

export function appendLoosePagedBboxRow(
  value: unknown[] | null | undefined,
  preferredPage: number | null = null
): unknown[] {
  const existing = Array.isArray(value) ? [...value] : [];
  const fallbackPage = preferredPageFromRows(existing) ?? toValidPage(preferredPage);
  return [...existing, createLoosePagedBboxRow(fallbackPage)];
}
