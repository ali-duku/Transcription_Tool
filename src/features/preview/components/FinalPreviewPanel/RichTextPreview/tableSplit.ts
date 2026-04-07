function isEscaped(text: string, index: number): boolean {
  if (index <= 0) {
    return false;
  }

  let backslashes = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === "\\"; cursor -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

export function splitTableRowSafe(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) {
    return [];
  }

  let body = trimmed;
  if (body.startsWith("|")) {
    body = body.slice(1);
  }
  if (body.endsWith("|")) {
    body = body.slice(0, -1);
  }

  const cells: string[] = [];
  let current = "";
  let inCode = false;
  let inMath = false;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    const escaped = isEscaped(body, index);

    if (char === "`" && !escaped) {
      inCode = !inCode;
      current += char;
      continue;
    }
    if (char === "$" && !escaped && !inCode) {
      inMath = !inMath;
      current += char;
      continue;
    }
    if (char === "|" && !escaped && !inCode && !inMath) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}
