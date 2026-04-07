import { isValidIndentUnit, normalizeLineEndings } from "./textValidationShared";

interface ListMarkerInfo {
  kind: "bullet" | "ordered";
  indent: string;
}

function parseBulletLine(line: string): ListMarkerInfo | null {
  const match = line.match(/^([ \t]*)([*+-])([ \t]+|$)/);
  if (!match) {
    return null;
  }
  return { kind: "bullet", indent: match[1] };
}

function parseOrderedLine(line: string): ListMarkerInfo | null {
  const match = line.match(/^([ \t]*)(\d+\.)[ \t]+/);
  if (!match) {
    return null;
  }
  return { kind: "ordered", indent: match[1] };
}

function parseListMarker(line: string): ListMarkerInfo | null {
  return parseBulletLine(line) ?? parseOrderedLine(line);
}

function invalidIndentMessage(info: ListMarkerInfo): string | null {
  if (info.kind === "bullet") {
    if (!isValidIndentUnit(info.indent, 2, 1)) {
      return "Bullet list indentation must use 2 spaces or 1 tab per nesting level.";
    }
    return null;
  }
  if (!isValidIndentUnit(info.indent, 4, 2)) {
    return "Ordered list indentation must use 4 spaces or 2 tabs per nesting level.";
  }
  return null;
}

export function validateListMarkdownStructure(content: string, locationLabel: string): string[] {
  const text = normalizeLineEndings(content);
  if (text.trim().length === 0) {
    return [];
  }

  const lines = text.split("\n");
  const errors: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    const marker = parseListMarker(line);
    const isBlank = trimmed.length === 0;

    if (marker) {
      const invalidIndent = invalidIndentMessage(marker);
      if (invalidIndent) {
        errors.push(`${locationLabel}: ${invalidIndent}`);
      }

      if (!inList) {
        inList = true;
        if (i > 0) {
          const prev = lines[i - 1];
          if (prev.trim().length > 0 && !parseListMarker(prev)) {
            errors.push(`${locationLabel}: List must have an empty line before it.`);
          }
        }
      }
      continue;
    }

    if (inList) {
      if (isBlank) {
        inList = false;
      } else {
        errors.push(`${locationLabel}: List must be followed by an empty line before other content.`);
        inList = false;
      }
    }
  }

  return errors;
}
