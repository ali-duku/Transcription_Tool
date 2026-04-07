import { normalizeLineEndings, removeMathExpressions } from "./textValidationShared";

function isBlockquoteLine(rawLine: string): boolean {
  const withoutMath = removeMathExpressions(rawLine.trim());
  return /^\s*>/.test(withoutMath);
}

function hasExactSingleSpaceAfterMarker(rawLine: string): boolean {
  const leadingSpace = rawLine.match(/^(\s*)/);
  const prefixLength = leadingSpace ? leadingSpace[1].length : 0;
  const afterLeading = rawLine.slice(prefixLength);
  if (!afterLeading.startsWith(">")) {
    return true;
  }
  const afterMarker = afterLeading.slice(1);
  if (afterMarker.length === 0) {
    return true;
  }
  if (!afterMarker.startsWith(" ")) {
    return false;
  }
  if (afterMarker.length > 1 && afterMarker[1] === " ") {
    return false;
  }
  return true;
}

export function validateBlockquoteMarkdownStructure(content: string, locationLabel: string): string[] {
  const text = normalizeLineEndings(content);
  if (text.trim().length === 0) {
    return [];
  }

  const lines = text.split("\n");
  const errors: string[] = [];
  let inBlockquote = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    const isQuote = isBlockquoteLine(line);
    const isBlank = trimmed.length === 0;
    const isOnlyMarker = trimmed === ">";

    if (isQuote) {
      if (!isOnlyMarker && !hasExactSingleSpaceAfterMarker(line)) {
        errors.push(
          `${locationLabel}: Blockquote lines must use exactly one space after ">".`
        );
      }
      inBlockquote = true;
      continue;
    }

    if (inBlockquote) {
      if (isBlank) {
        inBlockquote = false;
      } else {
        errors.push(
          `${locationLabel}: Blockquote must be followed by an empty line before other content.`
        );
        inBlockquote = false;
      }
    }
  }

  return errors;
}
