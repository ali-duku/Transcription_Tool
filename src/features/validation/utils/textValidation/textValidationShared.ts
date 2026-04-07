export interface SimpleValidationSummary {
  errors: string[];
  warnings: string[];
}

export function countUnescaped(content: string, char: string): number {
  const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?<!\\\\)${escaped}`, "g");
  return (content.match(pattern) ?? []).length;
}

export function removeMathExpressions(text: string): string {
  if (!text) {
    return "";
  }
  let result = text.replace(/\$\$[\s\S]*?\$\$/g, "");
  result = result.replace(/\$[^$\n]*?\$/g, "");
  return result;
}

export function stripBlockquotePrefix(line: string): string {
  return (line ?? "").replace(/^>\s?/, "").trim();
}

export function hasMixedSpacesAndTabs(indent: string): boolean {
  return indent.includes(" ") && indent.includes("\t");
}

export function isValidIndentUnit(indent: string, spacePerLevel: number, tabPerLevel: number): boolean {
  if (!indent) {
    return true;
  }
  if (hasMixedSpacesAndTabs(indent)) {
    return false;
  }
  if (indent.includes("\t")) {
    return indent.length % tabPerLevel === 0;
  }
  return indent.length % spacePerLevel === 0;
}

export function findLatexSegments(content: string): string[] {
  const segments: string[] = [];
  segments.push(...(content.match(/\$\$[\s\S]*?\$\$/g) ?? []));
  segments.push(...(content.match(/\$[^$\n]*?\$/g) ?? []));
  return segments;
}

export function normalizeLineEndings(value: string): string {
  return (value ?? "").replace(/\r\n?/g, "\n");
}
