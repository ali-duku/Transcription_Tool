import { removeMathExpressions, stripBlockquotePrefix } from "./textValidationShared";

function pipeCount(line: string): number {
  return (line.match(/\|/g) ?? []).length;
}

function isTableCandidate(line: string): boolean {
  const withoutMath = removeMathExpressions(line);
  return withoutMath.includes("|") && withoutMath.split("|").length >= 3;
}

function isSeparatorLine(line: string): boolean {
  return /^[\s|:-]+$/.test(line) && line.includes("-");
}

interface TableState {
  rows: string[];
  hasSeparator: boolean;
  expectedPipeCount: number | null;
  hasRowFormatError: boolean;
}

function freshTableState(): TableState {
  return {
    rows: [],
    hasSeparator: false,
    expectedPipeCount: null,
    hasRowFormatError: false
  };
}

function appendTableClosureErrors(state: TableState, errors: string[], locationLabel: string, nextLine: string) {
  if (state.rows.length === 0) {
    return;
  }
  if (!state.hasSeparator) {
    errors.push(
      `${locationLabel}: Table is missing a separator row (add |---|---| after the header).`
    );
  }
  if (state.rows.length < 2) {
    errors.push(
      `${locationLabel}: Table has fewer than 2 rows (header + separator minimum).`
    );
  }
  if (nextLine.trim().length > 0 && !state.hasRowFormatError) {
    errors.push(
      `${locationLabel}: Content appears immediately after a table without an empty line.`
    );
  }
}

export function validateTableMarkdownStructure(content: string, locationLabel: string): string[] {
  const text = content ?? "";
  if (text.trim().length === 0) {
    return [];
  }

  const lines = text.split("\n");
  const errors: string[] = [];
  let inTable = false;
  let tableState = freshTableState();

  for (let i = 0; i < lines.length; i += 1) {
    const originalLine = lines[i];
    const trimmed = originalLine.trim();
    const isBlockquote = /^\s*>/.test(originalLine);
    const line = isBlockquote ? stripBlockquotePrefix(trimmed) : trimmed;
    const rowLike = line.length > 0 && isTableCandidate(line);

    if (rowLike) {
      if (!inTable) {
        inTable = true;
        tableState = freshTableState();
      }

      tableState.rows.push(line);
      const startsWithPipe = line.startsWith("|");
      const endsWithPipe = line.endsWith("|");
      const count = pipeCount(removeMathExpressions(line));

      if (!startsWithPipe || !endsWithPipe) {
        tableState.hasRowFormatError = true;
        errors.push(
          `${locationLabel}: Table rows must start and end with "|" on the same line.`
        );
      }

      if (isSeparatorLine(line)) {
        if (tableState.hasSeparator) {
          errors.push(`${locationLabel}: Table contains multiple separator rows.`);
        }
        tableState.hasSeparator = true;
      }

      if (tableState.expectedPipeCount == null) {
        tableState.expectedPipeCount = count;
      } else if (count !== tableState.expectedPipeCount) {
        errors.push(
          `${locationLabel}: Inconsistent table column count (expected ${tableState.expectedPipeCount} pipes, found ${count}).`
        );
      }
      continue;
    }

    if (inTable) {
      appendTableClosureErrors(tableState, errors, locationLabel, line);
      inTable = false;
      tableState = freshTableState();
    }
  }

  if (inTable) {
    appendTableClosureErrors(tableState, errors, locationLabel, "");
  }

  return errors;
}
